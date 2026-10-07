# Plan: Phase S3, product listing

**Status: Approved (2026-10-06)** with the recommended options: B10 backend filter-options endpoint, price bands plus from/to boxes, instant filters on desktop and "Show results" on phones, 24 products a page.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S1 (layout, API client, gate) and S2/S2b (product card, section headings, motion components). The home page's **View all**, **Shop all**, **Shop wigs** and every category link go to these pages; today they show the 404 page.

## Context

The listing pages are where customers compare products: by type, length, colour, texture and budget. They must be quick, work by keyboard and on phones, keep every choice in the address (so a filtered view can be shared, bookmarked and opened in a new tab, and Back works), and be readable by search engines.

**What the API offers** (`GET /products`, already built):

- filters: `category` (a slug, includes its sub-categories), `length` (inches, several), `color` (several), `texture` (several), `minPrice`, `maxPrice`, `inStock`; all variant filters must match **the same** variant
- sort: newest (default), price (lowest matching price), name, rating
- pages: `page`, `limit` (up to 100), with the total in `meta`

**What it doesn't offer:** the list of values to choose from. Nothing says which lengths, colours and textures exist, or the price range, so the storefront can't build its filter choices (see open question 1).

**Today's catalogue:** 6 products in 4 top-level categories; Clip-in Extensions has 2 sub-categories (Seamless, Classic) and Wigs has 1 (Lace Front).

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

0. **B10 (backend): filter options**, if open question 1 is approved:
   - `GET /products/filters?category=<slug>` → the lengths, colours and textures that active products in that category actually have (active variants only), and the lowest and highest price
   - public and cached like `/products`; unit and e2e tests, Swagger, backend docs
1. **S3.1 Routes:**
   - `/shop`: all products
   - `/shop/<category>`: one category, top-level or sub-category (the flat slug, as the menus already link)
   - an unknown category shows the 404 page
2. **S3.2 Page header:**
   - breadcrumbs (Home › Shop › Clip-in Extensions › Seamless Clip-ins), also as `BreadcrumbList` structured data
   - the category name as the page's `h1` and its description; "Shop all" on `/shop`
   - sub-category chips under the heading (e.g. Seamless · Classic on Clip-in Extensions)
   - the result count ("6 products")
3. **S3.3 Product grid:** the S2 product card (photo, name, price range, Sale, Sold out, stars); 2 per row on phones, 3 on tablets, 4 on desktop; gentle fade-in as in S2b.
4. **S3.4 Filters:**
   - **Length**, **Colour**, **Texture**: tick boxes, several at once
   - **Price**: preset bands built from the real price range (e.g. Under ₹4,000 · ₹4,000–₹6,000 · Over ₹6,000) plus "from / to" boxes
   - **In stock only**: a switch
   - a filter group is hidden when it has nothing to choose (e.g. no textures in that category)
   - **chips for the active filters** above the grid, each with × to remove it, and **Clear all**
5. **S3.5 Sort:** Newest (default) · Price: low to high · Price: high to low · Best rated · Name A–Z.
6. **S3.6 Pagination:**
   - numbered pages with Previous and Next, as real links (`?page=2`), so search engines and "open in new tab" work
   - 24 products a page, from a validated storefront setting `PRODUCTS_PER_PAGE` (tests set it low, so pagination is tested on today's 6 products)
   - a page past the end goes to the last page
7. **S3.7 Address (URL) state:**
   - every choice is in the address: `/shop/wigs?length=18,20&color=natural-black&sort=price:asc&page=2`
   - changing a filter or the sort goes back to page 1
   - values are checked in the storefront first: unknown or malformed values are dropped (never sent to the API, never an error page)
   - Back and Forward step through filter changes
8. **S3.8 Phones:** a **Filters** button (showing how many are active) opens the filters in a panel from the side; **Show results** closes it. The sort is a dropdown next to it. On desktop the filters are a column on the left.
9. **S3.9 Empty and error states:**
   - no matches → "No products match these filters", with **Clear all** and the removed-one-at-a-time chips
   - an empty category → "Nothing here yet" with a link to all products
   - API down → the calm "We'll be right back" message (S1), not an error page
10. **S3.10 SEO:**
    - title and description per category ("Wigs — Human Hair Wigs | HairCraft")
    - the canonical address is the category itself: filtered and sorted views say `noindex, follow`, so search engines don't index thousands of combinations; page 2+ keeps its own canonical
    - `/shop` and every category with products are added to the sitemap, **only while the shop is open** (`STORE_OPEN`); while it is closed the sitemap stays as it is, so search engines aren't sent to pages that show "Coming soon"
11. **S3.11 Tests, click-through, docs:** unit tests for address parsing and building; Playwright for each filter, sort, pages, chips, phone panel, keyboard, back button, empty and API-down states, phone width; screenshots reviewed by eye; status, QC guide, PROGRESS, boss doc.

**Out of scope:** search (S4); the product page itself (S5: cards still link to `/product/<slug>`, which shows 404 until then); wishlist hearts on cards (S8); infinite scroll; filter counts per value ("Natural Black (3)": needs a heavier backend query, can come later); colour swatches (the API has colour names, not colour codes).

## Design

- **Look:** S2b's style: the small spaced-capitals line above a serif `h1`, mint background, white cards, gold for active states. Filters are quiet: small capitals group headings that fold open and closed, plain tick boxes.
- **Reference:** gemeriahair.in and 1hairstop.in collection pages (filters on the left on desktop, a Filter button and sort dropdown on phones).
- **Rendering:** the page is rendered on the server from the address (`searchParams`): the first view is complete HTML with the products, fast and readable by search engines. Filters are links and small forms that change the address; Next swaps in the new results without a full reload. With JavaScript off, the filters still work as plain links and a form.
- **While loading:** the grid dims slightly and the new results fade in (no layout jump); the filters stay usable.
- **Caching:** product lists are cached for 2 minutes as in S2 (`revalidate`, tagged), filter options for 5 minutes.

## Files

```
src/app/(shop)/shop/page.tsx                 /shop
src/app/(shop)/shop/[category]/page.tsx      /shop/<category> (404 if unknown)
src/app/(shop)/shop/[category]/not-found.tsx
src/components/listing/…                     header, breadcrumbs, filters, chips, sort, pagination, phone panel, empty states
src/lib/listing/query.ts                     address ⇄ filters (parse, validate, build); pure, unit-tested
src/lib/api/catalog.ts                       getProductPage(), getFilterOptions(), getCategory()
src/lib/env.ts                               PRODUCTS_PER_PAGE
tests/unit/listing.test.ts, tests/e2e/listing.spec.ts, tests/e2e/listing.mobile.spec.ts
dev/status/…-phase-s3-…, dev/testing/…-phase-s3-…, dev/PROGRESS.md
```

Backend (B10, if approved): `nestjs-haircraft/src/modules/catalog/` (controller, query service, DTO, tests), its docs and PROGRESS.

## Testing

1. **Unit:** address parsing (lists, prices, sort, page; bad values dropped), address building (page reset on change, stable order so the same filters give the same address), price bands from a range, active-filter chips.
2. **Playwright (real API):**
   - `/shop` lists all products; `/shop/wigs` only wigs; a sub-category only its products; an unknown category → 404
   - each filter narrows the list to exactly what the API returns for the same query; several together; chips remove one; Clear all
   - each sort order matches the API
   - pages: with `PRODUCTS_PER_PAGE=2`, three pages, Next/Previous, a page past the end
   - Back and Forward after filtering; sharing an address reproduces the view
   - keyboard only: filters, sort and pages reachable and usable
   - phone: Filters panel opens and closes, Show results, the page fits the screen
   - empty result, API down, malformed address values
   - SEO: `h1`, title, canonical, `noindex` on filtered views, breadcrumbs data
3. **By eye:** desktop and phone screenshots, compared with the two references.
4. **Backend (B10):** unit + e2e: only active products and variants, category includes sub-categories, empty category, rate limit and caching headers like `/products`.

## Risks

- **Filter values that don't exist together.** "18 inch" and "Body Wave" may each exist but never on the same variant, giving no results. The empty state with removable chips handles it; per-value counts would prevent it (out of scope).
- **Colour names in addresses** ("Natural Black" → `natural-black`): the storefront maps names to address-friendly slugs and back using the filter options, so a renamed colour simply drops out of old links.
- **Thin catalogue:** with 6 products, filters and pages look sparse in screenshots; the tests use the real data with a small page size.

## Open questions

1. **Where filter choices come from.** Recommended: **B10, a small backend endpoint** listing the lengths, colours, textures and price range that exist (always correct, one fast call, cached). The alternative is a fixed list in the storefront: no backend work, but it goes out of date whenever products change and can offer choices that return nothing.
2. **Price filter.** Recommended: **preset price bands from the real range, plus from/to boxes**. The alternative is a slider (pretty, but harder by keyboard and on phones).
3. **Applying filters.** Recommended: **on desktop, each tick applies at once; on phones, choices apply when you tap Show results** (fewer page reloads on a slow connection). The alternative is instant everywhere.
4. **Products per page.** Recommended: **24** (a multiple of 2, 3 and 4 columns). The alternative is 12.
