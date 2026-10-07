# Plan: Phase S4, search

**Status: Approved (2026-10-06)** with the recommended options: B11 smarter backend search, suggestions with categories and up to 5 products, no stored recent searches, the shared rate limit fixed in S16.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S3 (the listing page, filters, address state). Today the header's search icon and the footer's **Search** link go to the 404 page.

## Context

Shoppers who know what they want type it: "body wave clip in", "wigs", "natural black 18". Search must find it in whatever order and spelling they type, suggest results while they type, and help when nothing matches, rather than showing an empty page.

**What the API does today** (`GET /products?search=`): it looks for the **exact phrase** in the product name, short description or SKU. Tried against the sample catalogue on 2026-10-06:

| Typed                       | Found | Why                                 |
| --------------------------- | ----- | ----------------------------------- |
| `body wave`                 | 2     | the phrase is in the names          |
| `clip-in`                   | 2     |                                     |
| `clip in`                   | **0** | a space instead of the hyphen       |
| `wave clip`                 | **0** | words in a different order          |
| `wigs`                      | **0** | plural; the name says "Wig"         |
| `black`, `natural black 18` | **0** | colours and lengths aren't searched |

So the storefront can't fix this on its own: the search itself needs improving (open question 1).

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

0. **B11 (backend): smarter search**, if open question 1 is approved:
   - **any word order**, every word must match somewhere: product name, short description, SKU, category names, variant colours and textures, and lengths (`18`, `18 inch`, `18"`)
   - **hyphens and spaces count the same** (`clip in` = `clip-in`); simple **plurals** match (`wigs` = `wig`, `extensions` = `extension`)
   - a **relevance** sort (`sort=relevance`, the default when searching): name matches first, then other fields, then newest
   - `GET /products/suggest?q=`: for the type-ahead, up to 5 products (name, slug, photo, price range) and up to 3 matching categories, plus **"did you mean"**: the closest product or category name when nothing matches (using Postgres trigram similarity, already installed)
   - `GET /products/filters?search=`: filter choices for search results
   - unit and e2e tests, Swagger, backend docs
1. **S4.1 Header search:**
   - the search icon opens a search bar under the header (full width; a full-screen panel on phones), with the focus in the box
   - **suggestions while typing** (from 2 letters, after a short pause): matching categories as chips, up to 5 products with photo, name and price, and "See all results for "…""
   - keyboard: ↑ ↓ move through suggestions, Enter opens one (or searches), Escape closes; it follows the WAI combobox pattern, so screen readers announce the suggestions and their count
   - a real `GET /search?q=` form, so it works without JavaScript (results page, no suggestions)
2. **S4.2 Suggestions route (BFF):** `GET /bff/search/suggest?q=` on the storefront's server calls the API, so the browser never talks to the API directly. It is cached per query for a minute, and the query is checked (2–100 characters).
3. **S4.3 Results page** `/search?q=…`:
   - heading "Results for "body wave"" with the count; the search box at the top, filled in
   - the S3 listing: same grid, filters (choices from the search's own results), chips, sort (with **Relevance** first and default) and pages
   - the address keeps everything: `/search?q=body+wave&length=18&sort=price-asc`
   - the search words are part of the chips ("Search: body wave ×" clears the search, keeping filters, and shows all products)
4. **S4.4 No-results help:**
   - "No results for "wigz"", then **Did you mean "wig"?** as a link when there is a close match
   - tips: check the spelling, use fewer words, try a category
   - the categories as chips and a few newest products ("You might like")
   - an empty search (`/search`) shows the search box with popular categories, not an error
5. **S4.5 SEO and privacy:**
   - search pages are `noindex, follow` and not in the sitemap (search engines advise against indexing a shop's own search results)
   - search words are not stored anywhere (no recent searches, no logging in the storefront)
6. **S4.6 Tests, click-through, docs:** unit tests for the query and suggestion helpers; Playwright for the header search (mouse, keyboard, screen-reader roles), results matching the API, filters and sort on results, no-results help, without JavaScript, phones, API down; screenshots reviewed by eye; status, QC guide, PROGRESS, boss doc.

**Out of scope:** recent or popular searches (open question 3); search by photo; synonyms such as "extensions" for "clip-ins" (can come with the owner's list of terms customers use); search analytics.

## Design

- **Search bar:** opens under the header with a soft slide; mint background, a large serif-style input with a search icon and a clear (×) button; suggestions in a white rounded panel: categories as chips on top, products as rows (small photo, name, price). The matched words in suggestions are **bold**.
- **References:** gemeriahair.in and 1hairstop.in both open a search bar from the header with live product suggestions.
- **Type-ahead behaviour:**
  - waits 250 ms after the last key before asking
  - only the latest answer is shown (an older, slower one never overwrites it)
  - while waiting, the previous suggestions stay, dimmed
  - if the API is down, the box still works: Enter goes to the results page
- **Results page:** reuses S3's listing (the same components), so filters, chips, sort, pages, phones and no-JavaScript all behave the same way.

## Files

```
src/app/(shop)/search/page.tsx               /search?q=
src/app/bff/search/suggest/route.ts          suggestions for the type-ahead
src/components/search/…                      header search bar, suggestions list, no-results help
src/components/listing/…                     a search mode for the listing (heading, Relevance sort, search chip)
src/lib/listing/query.ts                     `q` in the address state
src/lib/api/catalog.ts                       getSuggestions(), search on getProducts()/getFilterOptions()
tests/unit/search.test.ts, tests/e2e/search.spec.ts, tests/e2e/search.mobile.spec.ts
dev/status/…-phase-s4-…, dev/testing/…-phase-s4-…, dev/PROGRESS.md
```

Backend (B11, if approved): `nestjs-haircraft/src/modules/catalog/` (query service, controller, DTOs), tests, README and PROGRESS.

## Testing

1. **Backend (B11):** every row of the table above finds the right products; words in any order; plurals; colours and lengths; inactive products and variants never found; relevance order; suggestions (limits, categories, did-you-mean for a typo, nothing for nonsense); filters with `search`; special characters (`%`, `_`, quotes) treated as plain text.
2. **Storefront unit:** `q` in the address (trimmed, length-limited, kept with filters); highlighting matched words; picking the newest answer.
3. **Playwright:**
   - header: open by click and keyboard; suggestions appear after typing; ↑ ↓ Enter Escape; choosing a product goes to its page (404 until S5), a category to the listing, "See all" to results
   - results match the API for the same words; filters and sort on results; the search chip
   - no results with "Did you mean"; empty search
   - without JavaScript; phones (full-screen panel, fits the screen); API down (the box still searches; the results page shows the calm message)
   - `noindex` on search pages
4. **By eye:** desktop and phone screenshots of the open search bar, results and no-results, compared with the two references.

## Risks

- **Every key press is a request.** Mitigated by the 250 ms pause, the 2-letter minimum, caching each query for a minute, and only the newest answer counting.
- **Shared rate limit (an existing issue, found while planning).** The API allows 100 requests a minute **per client address**, and every shopper's request reaches it from the storefront's server, so all shoppers share one allowance. Cached catalogue pages keep this low today, but searches and, later, carts and checkouts can't be cached. See open question 4.
- **Search quality on a small catalogue:** with 6 products, "did you mean" and relevance are tested on few names; they're written to work on a full catalogue and tested with deliberately similar names in the backend tests.

## Open questions

1. **Improve the backend search (B11).** Recommended: **yes**: any word order, hyphens/spaces, plurals, colours and lengths, relevance order, suggestions and "did you mean" (a contained change in the catalogue module, with tests). The alternative is to keep exact-phrase search, which misses most real queries (see the table).
2. **What the type-ahead suggests.** Recommended: **categories and up to 5 products**. The alternative is products only.
3. **Recent searches.** Recommended: **not now** (nothing about a shopper's searches is stored). The alternative is remembering the last 5 on the shopper's own device.
4. **The shared rate limit.** Recommended: **fix it in S16 (launch readiness)**, before real traffic: the storefront's server identifies itself to the API with a secret key and gets its own, larger allowance, while each shopper's own address is still limited separately for sign-in and checkout. It's tracked as an open item until then. The alternative is to fix it now, in S4 (about half a day more, mostly backend).
