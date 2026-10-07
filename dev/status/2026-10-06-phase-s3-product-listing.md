# Status: Phase S3, product listing

Tracks progress against [`plan/2026-10-06-phase-s3-product-listing.md`](../plan/2026-10-06-phase-s3-product-listing.md).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (B10 and S3.1–S3.11) is implemented, and verified by:

- **storefront:** typecheck, ESLint, Prettier and a production build, all clean; 49 unit tests (18 new) and 47 Playwright tests (19 new) against the real API, all passing
- **backend (B10):** 306 unit and 260 e2e tests (6 new), all passing
- desktop and phone screenshots reviewed by eye

The review by eye and the tests found and fixed five problems (below).

Approved with the recommended options:

- B10, a backend endpoint for the filter choices
- price bands from the real prices, plus from/to boxes
- filters apply at once on desktop, and with **Show results** on phones
- 24 products a page

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What was built

### B10 (backend) Filter options

`GET /api/v1/products/filters?category=<slug>` returns the lengths, colours and textures of active variants of active products in that category (and its sub-categories, or the whole shop), plus their lowest and highest effective price. For example, Wigs today: 18, 22 and 26 inch · Natural Black · Body Wave · ₹18,999–₹21,999.

- Colours and textures that differ only in capitals are one choice, as the list filter treats them the same.
- An unknown or empty category gives empty lists and `price: null`.
- It is public and cached like `/products`. It is declared before `/products/:slug`, so "filters" is never read as a product.
- The category rule ("this category or its active sub-categories") is now one shared function, used by both this endpoint and the product list.
- Tests: whole shop, a category, a sub-category, effective (sale) prices, empty/hidden/unknown categories, "every offered choice returns products", caching header, a malformed category.

### S3.1 Routes

- `/shop`: all products.
- `/shop/<category>`: a top-level category or a sub-category (e.g. `/shop/seamless-clip-ins`).
- An unknown category shows the shop's 404 page, with a real 404 status.

### S3.2 Page header

- Breadcrumbs (Home › Shop › Clip-in Extensions › Seamless Clip-ins), also as `BreadcrumbList` structured data.
- A small capitals line, the category name as the `h1`, and its description.
- Category chips:
  - on `/shop`, the top-level categories
  - on a category, "All …" and its sub-categories
  - on a sub-category, its siblings, with the current one highlighted
- The result count ("6 products") is announced to screen readers when it changes.

### S3.3 Product grid

The S2 product card, 2 per row on phones, 3 on tablets and small laptops, 4 on wide screens. The first four photos load first.

### S3.4 Filters

- **Length**, **Colour**, **Texture:** tick boxes, built from B10, so only choices that exist are offered. A group with nothing to offer is hidden.
- **Price:** up to three bands with round edges from the real range (₹3,999–₹21,999 → Up to ₹10,000 · ₹10,000 – ₹16,000 · From ₹16,000), plus From/To boxes with **Apply**.
- **Availability:** In stock only.
- Each group folds open and closed; the number chosen shows in gold next to its name.
- **Chips** above the products, one per active filter, each with × to remove it, and **Clear all** (which keeps the sort).

### S3.5 Sort

Newest (default) · Price: low to high · Price: high to low · Best rated · Name A–Z.

### S3.6 Pagination

- Numbered pages with Previous and Next, as real links. Long runs are shortened: 1 … 5 6 7 … 12.
- 24 a page, from the new setting `PRODUCTS_PER_PAGE` (validated 1–100, in `.env.example`). The tests run with 2, so today's 6 products make 3 pages.
- A page past the end goes to the last page.

### S3.7 Address (URL) state

- Everything is in the address, e.g. `/shop/wigs?length=18,22&color=natural-black&min=4000&sort=price-asc&page=2`.
- Each view has exactly one address. Any other spelling is redirected to it: `?page=1`, repeated keys, empty boxes, unknown values.
- Anything unknown or malformed is dropped before it reaches the API, so an old or hand-edited link shows products, never an error.
- Changing a filter or the sort goes back to page 1. Back and Forward step through changes.
- All of this lives in one pure module, `src/lib/listing/query.ts`, unit-tested.

### S3.8 Phones

A **Filters** button (with the number active, e.g. "Filters (2)") opens the filters from the side. Choices apply together with **Show results**; **Clear all** empties them; closing without applying forgets the ticks. The sort dropdown sits beside it.

### S3.9 Empty and error states

- No matches: "No products match these filters", with **Clear all filters** and the removable chips.
- An empty category: "Nothing here yet", with a link to all products.
- API down: the calm "We'll be right back" message on `/shop` and every category.

### S3.10 SEO

- **Titles:** per category, e.g. "Wigs — Human Hair Wigs | HairCraft", with the category description.
- **Canonical address:** filtered and re-sorted views are marked `noindex, follow`, and their canonical address is the plain list. Page 2 onwards keeps its own canonical address.
- **Sitemap:** `/shop` and every category with products are listed, only while the shop is open (`STORE_OPEN`). The sitemap is now built per request, so it follows the running server's setting.

### Works without JavaScript

The filters and the sort are real forms, so they still work with JavaScript switched off. Their untidy addresses are redirected to the tidy ones.

## Problems found and fixed

1. **Streaming hid the real status codes and broke the no-JavaScript forms.**
   - **Cause:** the shop's loading skeleton (`loading.tsx`) made every shop page stream. Streaming sends status 200 before the page runs, so an unknown category was a "soft 404" and tidy-address redirects were 1-second meta refreshes. With JavaScript off, the skeleton never went away at all.
   - **Fix:** the skeleton now covers only the home page (`(shop)/(home)/`). Listing pages render whole: a real **404**, real **307** redirects, and working forms without JavaScript.
   - **Trade-off:** following a link to the shop shows no skeleton while it loads (filter changes keep the current page on screen, dimmed).
2. **The 404 page showed the header and offers bar twice.** The root 404 page adds the header and footer for addresses outside the shop, and the shop layout added them again. Shop pages now use their own `(shop)/not-found.tsx`. A test checks for one header and one offers bar on both kinds of 404.
3. **Uneven price bands.** Rounding the edges up made bands like ₹4,999–₹6,000 / ₹6,000–₹6,500 / from ₹6,500. Edges are now rounded to the nearest round number and must sit strictly inside the range.
4. **The phone panel remembered abandoned ticks.** Ticking without applying and closing with Escape left the ticks there on reopening. Each opening now starts from the applied filters.
5. **The fold icon read as "remove".** The open group's "+" was rotated into "×". It now shows "−" when open and "+" when closed.

Also: `/shop`'s heading is smaller on phones, so products appear sooner.

## Known and accepted

- **Canonical tag after in-browser navigation.** After moving to page 2 in the browser, Next leaves the first page's canonical tag in the page head. Search engines always load pages fresh and get the right one; the test checks the fresh page.
- **404s in the browser console.** Next prefetches links to pages later phases will build (product pages S5, search S4, cart S7, account S9, information pages S14). They disappear as those pages arrive.
- **Thin catalogue.** With 6 products, filters often leave one or two cards; screenshots look sparse until the real catalogue is loaded.

## Not done / follow-ups

- **Per-choice counts** ("Natural Black (3)") need a heavier backend query; left for later, as planned.
- **No progress indicator** when a link to the shop is followed from another page (see problem 1); a slim top progress bar could come in S15 (SEO and performance).
- **Colour swatches** need colour codes the catalogue doesn't have.
