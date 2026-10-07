# Plan: Phase S2, home page

**Status: Approved (2026-10-05)** with the recommended options (catalogue photo in the hero, free-shipping amount from a storefront setting, any reviewed product in Best rated).

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S1 (layout, API client, components). It replaces S1's temporary home page.

## Context

The home page is the shop window: it must show quickly what HairCraft sells, look premium, and lead people to products in one or two clicks. It is also the most important page for search engines. Everything on it comes from the API (products, categories, ratings), so it stays current without code changes.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S2.1 Product card:** the reusable card used here and in S3 to S8:
   - main photo (`next/image`, lazy below the fold)
   - name and price range ("₹3,999 – ₹4,999"); a **Sale** badge when a variant is on sale
   - **Sold out** when nothing is in stock
   - star rating with the review count, shown only when the product has reviews
   - the whole card is one link to `/product/<slug>` (product page = S5)
2. **S2.2 Hero:**
   - a large headline and a short promise
   - **Shop all** and **Shop wigs** buttons
   - a featured product photo from the catalogue (the newest product with a photo), in a soft gold/mint frame like the coming-soon page
   - one gentle entrance animation, switched off for people who prefer reduced motion
3. **S2.3 Shop by category:** the top-level categories as image cards, each with:
   - the photo of one of its products (categories have no photos of their own)
   - its name, short description and product count
   - a link to `/shop/<slug>`
4. **S2.4 New arrivals:** the 8 newest products (`sort=createdAt:desc`), as a row that scrolls sideways on phones and a grid on desktop, with **View all**.
5. **S2.5 Best rated:**
   - products with reviews, highest rated first (`sort=rating:desc`)
   - hidden when no product has reviews yet, so the section is never empty
6. **S2.6 Brand promise strip:** four short promises with icons:
   - 100% human hair
   - free shipping above the threshold
   - secure payments (UPI, cards, net banking)
   - easy help

   The shipping wording follows open question 2.

7. **S2.7 SEO:**
   - title and description for the home page, canonical `/`
   - structured data: `Organization` (exists) and `WebSite`
   - the search box structured data waits for S4 (search)
8. **S2.8 States:**
   - every section loads on its own (streaming): one slow or failed section never blanks the page
   - skeleton cards while loading
   - the S1 "We'll be right back" panel when the API is down
9. **S2.9 Tests and docs:**
   - unit tests (card states, rating display, section rules)
   - Playwright (sections from the real API, links, sale and sold-out badges, best-rated hidden without reviews, phone layout, API down)
   - a screenshot click-through at desktop and phone sizes
   - status, testing guide, `PROGRESS.md`

**Out of scope:**

- the pages the links lead to: listing (S3), product (S5)
- a newsletter sign-up (needs email sending)
- banners managed from the admin panel (would need a backend feature; can be planned later)

## Approach

- **Server components:** the page and each section fetch from the API on the server, with short caching (2 minutes for product lists, 5 for categories). New products and new reviews appear within minutes, with no rebuild.
- **Streaming:** each section is wrapped in `<Suspense>` with a skeleton, so the hero shows at once and the rest stream in.
- **Small calls:**
  - one call each for new arrivals and best rated
  - one per top-level category for its photo (4 today, cached)
- **Photos:**
  - `next/image` with sizes per breakpoint, so phones download small images
  - the hero image is preloaded; everything else loads lazily
- **No new dependencies:** stars and promise icons are small inline SVGs; the hero animation uses Framer Motion (already installed) or CSS.
- **Accessibility:**
  - one `h1` (the hero), then `h2` per section
  - a card reads as "Name, price, rating 4 out of 5 (12 reviews), Sale"
  - sideways-scrolling rows are keyboard-reachable and show the next card partly so people see there is more

## Files (new or changed)

```
src/app/(shop)/page.tsx                          the home page (replaces the S1 placeholder)
src/components/home/*                            hero, category cards, product rows, promise strip, skeletons
src/components/product/product-card.tsx, rating-stars.tsx
src/lib/api/catalog.ts                           getProducts(query), getNewArrivals, getBestRated, category photo
src/lib/api/types.ts                             (product card type exists)
tests/unit/*, tests/e2e/home.spec.ts
dev/status/…-phase-s2-home-page.md, dev/testing/…-phase-s2-home-page.md, dev/PROGRESS.md
```

## Verification

1. typecheck, lint, format and build: clean; all S1 tests still pass.
2. **Unit tests:**
   - card: on sale, sold out, with and without reviews, a single price vs a range
   - star rounding (4.3 → 4½ shown, "4.3 out of 5" read out)
   - the best-rated section's rule (no reviews → hidden)
3. **Playwright, against the real API:**
   - the hero, 4 category cards with photos and links
   - new arrivals in newest order, matching the API
   - Sale and rating shown where the API says so
   - best rated in rating order
   - phone layout: rows scroll sideways and there is no page-wide sideways scroll
   - API down → the calm message and the hero still shows
4. **Click-through** at desktop and phone widths, screenshots reviewed by eye.
5. Status report and QC guide; `PROGRESS.md` ticked.

## Open questions

1. **Hero image.** Recommended: **a product photo from the catalogue for now**, replaced by a brand photo when you have one (S14/S16). The alternative is a text-only hero.
2. **Free-shipping promise.** The threshold (₹1,999) is a backend setting, and the storefront shouldn't hard-code it. Recommended: **"Free shipping on orders above ₹1,999", read from a storefront setting (`FREE_SHIPPING_THRESHOLD`) that must match the backend**; checkout (S10) will always show the real amount from the API. The alternative is a neutral "Fast, tracked delivery across India" with no number.
3. **Best rated with few reviews.** Today 3 products have reviews (1 to 5 each). Recommended: **show any reviewed product**; later we can require at least 3 reviews.
