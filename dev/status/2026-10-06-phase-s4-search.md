# Status: Phase S4, search

Tracks progress against [`plan/2026-10-06-phase-s4-search.md`](../plan/2026-10-06-phase-s4-search.md).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (B11 and S4.1–S4.6) is implemented, and verified by:

- **storefront:** typecheck, ESLint, Prettier and a production build, all clean; 59 unit tests (10 new) and 61 Playwright tests (14 new) against the real API, all passing
- **backend (B11):** 310 unit (4 new) and 269 e2e tests (9 new), all passing
- screenshots of the open search bar (desktop and phone), results and no-results, reviewed by eye

The tests and the review by eye found and fixed six problems (below).

Approved with the recommended options:

- B11, a smarter backend search
- suggestions with categories and up to 5 products
- no stored recent searches
- the shared rate limit fixed in S16 (tracked as an open item)

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What search finds now

The same queries as in the plan, on the sample catalogue:

| Typed              | Before | Now                                           |
| ------------------ | ------ | --------------------------------------------- |
| `clip in`          | 0      | 2 (both clip-in products)                     |
| `wave clip`        | 0      | 1                                             |
| `wigs`             | 0      | 1 (the lace front wig)                        |
| `black`            | 0      | 6 (every product with a Natural Black option) |
| `natural black 18` | 0      | 5                                             |
| `extensions`       | —      | 4 (through their category names)              |
| `wigz`             | —      | 0, with **Did you mean "wig"?**               |

## What was built

### B11 (backend) Smarter search

- **Matching (`GET /products?search=`):** every word must be found, in any order, somewhere in the product: name, short description, SKUs, colours, textures and lengths (`18 inch`) of its active variants, and its category names with their parents.
  - Hyphens and spaces count the same, and simple plurals match.
  - Text is reduced to letters and digits first, so `%`, `_` and quotes can never act as wildcards.
  - Punctuation-only searches find nothing.
- **Relevance sort** (`sort=relevance`, the default when searching): words found in the name first, then newest.
- **`GET /products/suggest?q=`:** up to 5 products and up to 3 categories (with products) for the type-ahead. When nothing matches, `didYouMean` replaces each unknown word with the closest catalogue word (Postgres trigram similarity, already installed), offered only when the corrected search finds products.
- **`GET /products/filters?search=`:** filter choices for search results.
- The search-word rules are a small pure module (`search.util.ts`) with their own unit tests.

### S4.1 Header search

- The search icon opens a search bar under the header (the whole screen on phones), with the focus in the box.
- **Suggestions while typing** (from 2 letters, 250 ms after the last key):
  - matching categories as chips
  - up to 5 products with photo, name and price
  - "See all results for "…""
  - the typed words in **bold**
- **Keyboard:** ↑ ↓ choose, Enter opens the choice (or searches), Escape closes and returns focus to the icon. It follows the WAI combobox pattern; screen readers hear "5 suggestions…".
- **Only the newest answer counts:** older requests are cancelled. While waiting, the last suggestions stay, dimmed.
- **Closing:** a click outside, the × button, or any navigation closes the bar.
- **When nothing matches:** "No suggestions for "wigz" — did you mean wig?".
- **Without JavaScript,** the icon is a link to `/search`, which has its own search form.
- **API down or shop closed:** no suggestions, but Enter still searches.

### S4.2 Suggestions route (BFF)

`GET /bff/search/suggest?q=` (2–100 characters, otherwise 400) calls the API from the storefront's server. Each query's answer is cached for a minute on the server and in the browser. Nothing about the search is stored or logged.

### S4.3 Results page `/search?q=`

- "Results for "clip in"" with the search box filled in above the results.
- The S3 listing: filters (choices from the search's own results), chips, sort with **Relevance** first and default, pages, the phone panel and no-JavaScript forms.
- Everything is in the address, e.g. `/search?q=clip%20in&color=natural-black&sort=price-asc`. **Clear all** keeps the search.
- A `q` on the shop's own lists (`/shop?q=wig`) is dropped; `/search?q=` (empty) goes to `/search`.

### S4.4 No-results help

- When a search alone finds nothing, the help takes the full width (no empty filters or sort):
  - "No results for "wigz""
  - **Did you mean wig?**
  - tips
  - the categories as chips
  - four products under "You might like"
- With filters on, it's S3's "No products match these filters" with **Clear all filters**.
- `/search` with nothing typed: "What are you looking for?" with the categories.

### S4.5 SEO and privacy

Search pages are `noindex, follow`, with `/search` as their canonical address, and are not in the sitemap. Searches are not stored anywhere.

## Problems found and fixed

1. **Filter options for a search failed (503).** The search SQL registered its relevance parameters even when only the matching condition was used, and Postgres rejects unused parameters. Each word form now gets one parameter, shared by both parts. Found by the backend e2e test.
2. **The phone search panel wasn't full screen.** The header's frosted-glass effect (`backdrop-blur`) makes "fixed" elements inside it position relative to the header rather than the screen. The panel is now rendered at the end of the page (a portal); on wider screens it opens just under the header, following it as the page scrolls.
3. **The no-results heading wasn't a heading.** It carried `role="status"`, which replaces the heading role for screen readers. The status is now a wrapper around the heading only (not the tips and products, which would all be read out).
4. **The browser's own blue "×" in search boxes** clashed with the brand and sat next to our own close button. It is hidden.
5. **Search with no results showed an empty filter column, "0 products" and a sort.** The help now takes the full width.
6. **Stale cached data in tests.** Next's cache of API answers survives rebuilds, so a test saw product lists from before the B11 change. The e2e script now clears that cache too.

Also: "See all results" is offered only alongside suggestions (with none, it led to an empty page).

## Known and accepted

- **Search speed on a large catalogue:** each product's searchable text is built during the query. That's instant for hundreds of products; for many thousands, a stored search column with an index would be the next step.
- **Synonyms** ("extensions" for "clip-ins" is covered by category names, but not, say, "hair piece") need the owner's list of words customers use.
- **Shared rate limit** (an existing issue): all shoppers reach the API through the storefront's server and share 100 requests a minute. Suggestions are cached per query, but this must be fixed before launch. It's planned for S16 and tracked in both trackers.

## Not done / follow-ups

- Recent searches (decided: not now).
- Search analytics (what people search for and don't find) would help choose synonyms; it needs a privacy decision first.
