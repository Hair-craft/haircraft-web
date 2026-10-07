# Plan: Phase S5, product page

**Status: Approved (2026-10-06)** with the recommended options: no Add to bag until S7 ("Ordering opens soon"), sold-out options shown struck through, 4 related products from the same category.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S1–S4 (layout, product cards, listing, search). Every product card, search suggestion and review link points to `/product/<slug>`, which shows the 404 page today.

## Context

The product page is where a shopper decides: they need to see the hair up close, pick their length, colour and texture, know the price and whether it's in stock, and trust it (reviews, details). It is also the page search engines show most, so it must load fast and describe the product in structured data.

**What the API offers** (all built; no backend work expected):

- `GET /products/:slug`: name, descriptions, attributes (e.g. "Pieces: 20"), categories, images (some belong to one variant), variants (length, colour, texture, weight, price, sale price, in stock, but no exact stock count), the distinct `options`, price range and rating
- `GET /products/:slug/reviews?sort=newest|highest|lowest&page=` and `…/reviews/summary` (average, count, 1–5 breakdown)
- `GET /products?category=` for related products

**Sample catalogue:** 6 products with 2–9 variants each; some options are sold out (e.g. Deep Wave Tape-ins 20 inch); most products have variant-specific photos.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S5.1 Route** `/product/<slug>`:
   - an unknown or hidden product gets the shop's 404 page with a real 404 status
   - breadcrumbs: Home › Shop › category › product (also as structured data)
2. **S5.2 Gallery:**
   - a large photo with thumbnails beside it (desktop) or a swipeable row with dots (phones)
   - choosing a variant shows its own photos first
   - click (or Enter) opens a full-screen view with arrows, swipe and Escape
   - keyboard: thumbnails are buttons; ← → move between photos
3. **S5.3 Variant picker:**
   - one row of buttons per option (Length · Colour · Texture), only for options with more than one choice; a single value is shown as plain text
   - picking a value keeps the other choices when that combination exists, otherwise moves to the nearest one that does
   - combinations that don't exist are disabled; sold-out ones stay selectable, struck through and marked "sold out" (so shoppers can see what exists)
   - the choice is in the address (`/product/<slug>?variant=<SKU>`), so a link opens the same option; the default is the first option in stock
4. **S5.4 Price and stock:**
   - the chosen option's price; on sale, the old price struck through and the saving ("Save ₹600")
   - "Inclusive of all taxes"; "In stock" or "Sold out"
   - the SKU, in small print
   - **no Add to bag yet** (open question 1): a clear note in its place
5. **S5.5 Details:**
   - the short description near the price; below, folding sections for **Description**, **Details** (the product's attributes, plus the chosen option's length, colour, texture, weight) and **Delivery & returns** (placeholder text for the owner, like the home page FAQ)
6. **S5.6 Rating summary and reviews list:**
   - stars and count near the name, linking to the reviews section
   - the summary: average, count and a bar per star level (5 to 1)
   - the reviews (5 at a time, **Show more**), sortable Newest · Highest · Lowest, with stars, title, text, name, date and "Verified purchase"
   - no reviews yet: "No reviews yet" (writing reviews is S13)
7. **S5.7 Related products:** "You may also like": up to 4 other products from the same category, falling back to the newest.
8. **S5.8 SEO:**
   - title, description and share image (the product's first photo) per product; canonical `/product/<slug>` (the `?variant=` versions point to it)
   - `Product` structured data: name, description, images, brand, SKU, price range in INR with availability, and the rating (only when it has reviews)
   - every active product in the sitemap while the shop is open
9. **S5.9 Tests, click-through, docs:** unit tests for picking variants and the gallery order; Playwright for each part against the API (including sold-out and sale variants, the address, keyboard, phones, no JavaScript, API down, 404); screenshots reviewed by eye; status, QC guide, PROGRESS, boss doc.

**Out of scope:** Add to bag (S7); wishlist heart (S8); writing reviews (S13); a quantity picker (S7); size guides and videos (need the owner's content); exact stock counts ("only 2 left": the API deliberately doesn't share them).

## Design

- **Layout (desktop):** gallery on the left (about 55%), the buying column on the right, staying in view while the gallery scrolls past; details, reviews and related products below, full width. **Phones:** gallery, then the buying column, then the rest.
- **Look:** S2b/S3 style. The name in the serif display font, the price in bold, option buttons as rounded chips (dark when chosen, struck through when sold out), gold stars.
- **References:** gemeriahair.in and 1hairstop.in product pages (large gallery with thumbnails, chip-style option buttons, folding detail sections, reviews with a star breakdown).
- **Rendering:** the page is rendered on the server (fast first view, readable by search engines). Changing a variant updates the address and the price, stock and photos straight away in the browser, without reloading. Without JavaScript, the option buttons are links to each variant's address.

## Files

```
src/app/(shop)/product/[slug]/page.tsx
src/components/product-page/…        gallery, lightbox, variant picker, buy box, details, reviews, related
src/lib/product/variants.ts          choosing variants from options (pure, unit-tested)
src/lib/api/catalog.ts               getProduct(), getReviews(), getReviewSummary()
src/app/sitemap.ts                   products added
tests/unit/product.test.ts, tests/e2e/product.spec.ts, tests/e2e/product.mobile.spec.ts
dev/status/…-phase-s5-…, dev/testing/…-phase-s5-…, dev/PROGRESS.md
```

## Testing

1. **Unit:** the default variant (first in stock; the first if none); picking a value keeps the others or moves to the nearest existing combination; which buttons are disabled or sold out; gallery order (the variant's photos first); reading `?variant=` (unknown SKUs ignored); structured data.
2. **Playwright (real API):**
   - every product page loads with the API's name, price range and photos (photos actually load)
   - picking options changes price, stock, photos and address; sold-out options are marked; a sale option shows the struck-through price and saving
   - a shared `?variant=` link opens that option; an unknown SKU falls back to the default
   - gallery: thumbnails, arrows, full-screen view with Escape
   - reviews: the summary matches the API; Show more; sort; "No reviews yet"
   - related products; breadcrumbs; structured data parses and matches the API
   - 404 for an unknown product (real status); API down; no JavaScript (option links work); phones (swipe row, fits the screen)
3. **By eye:** desktop and phone screenshots compared with the two references.

## Risks

- **Many variants (up to 9 today, more later):** the picker works per option, not per variant, so it stays three short rows however many combinations there are.
- **The duplicate test reviews** (five identical "Gorgeous waves") would show five times on Deep Wave Tape-ins. The storefront shows reviews as the API returns them; cleaning the data is the fix (the command is ready; see the S2b status).

## Open questions

1. **Add to bag before S7.** Recommended: **leave it out until S7** and show "Ordering opens soon" in its place, so nothing on the page pretends to work (the shop is still closed to the public anyway). The alternative is a disabled button.
2. **Sold-out options.** Recommended: **selectable, struck through and marked "sold out"**, so shoppers see what exists and S16 can add "notify me". The alternative is hiding them.
3. **Related products.** Recommended: **yes, 4 from the same category** (cheap: one cached request). The alternative is none until later.
