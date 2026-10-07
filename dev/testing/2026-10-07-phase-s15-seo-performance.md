# Testing: Phase S15, SEO and performance

Pairs with [`plan`](../plan/2026-10-07-phase-s15-seo-performance.md) and [`status`](../status/2026-10-07-phase-s15-seo-performance.md).

**What this phase delivers:**

- search engines see the shop correctly, and test copies are kept out
- shared links show a branded picture
- Google gets prices, delivery, returns and reviews
- lighter pages
- an accessibility audit with its fixes

## 0. Setup

1. **Start the API:** `npm run start:dev` in `nestjs-haircraft`.
2. **Start the shop:** `npm run dev` in `nextjs-haircraft`, with `STORE_OPEN=true`. Leave `ALLOW_INDEXING` unset at first.

## A. Search engines

1. **Open `http://localhost:3001/robots.txt`.**
   - **Expected:** `Disallow: /`, so nothing may be indexed (indexing is off).
2. **Add `ALLOW_INDEXING=true` to `.env.local`, restart the shop, and reload.**
   - **Expected:** `Allow: /`, a list of `Disallow:` lines (account, checkout, cart, search…) and a `Sitemap:` line.
   - Remove the setting afterwards.
3. **Open `/sitemap.xml`.**
   - **Expected:** the home page, shop, categories, products (each with an `image:loc`) and the seven information pages.
4. **A product page → right-click → View page source → search for `application/ld+json`.**
   - **Expected:** a `Product` with `offers` (one per option, each with `shippingDetails` and `hasMerchantReturnPolicy`), plus the rating and reviews when it has some.
5. **Once the site is live:** paste a product address into [Google's Rich Results Test](https://search.google.com/test/rich-results).
   - **Expected:** "Product snippets" and "Merchant listings" valid.

## B. Link previews

6. **Open `http://localhost:3001/opengraph-image`.**
   - **Expected:** the 1200×630 picture: logo, "Premium human hair", the title and haircraft.in.
7. **Open a category, then add `/opengraph-image` to its address.**
   - Easier: view the page source and open the `og:image` address.
   - **Expected:** the category's name and its first product's photo.
8. **Once live:** paste a link into WhatsApp, or [opengraph.xyz](https://www.opengraph.xyz).
   - **Expected:** the picture, title and description show.

## C. Speed

9. **Chrome F12 → Lighthouse → Mobile → Analyze page load,** on the home page and a product (a production build: `npm run build && npm start`).
   - **Expected:** Performance in the green or orange, with LCP and CLS green.
   - Note the scores for comparison after launch.
10. **The logo:** F12 → Network → Img, reload.
    - **Expected:** the logo request (`_next/image?url=%2Fimages%2Flogo.png…`) is a few kB, not about 50 kB.

## D. Accessibility

11. **Look:** the grey-green secondary text (breadcrumbs, prices struck through, descriptions) should read clearly and still look on-brand.
    - **Expected:** the gold words in headings ("confidence", "you") are a deeper gold.
12. **Keyboard:**
    - On a product, open a photo and press Tab. **Expected:** the photo strip is focused (outline), and the arrow keys scroll it.
    - On a listing's first page, Tab past the page numbers. **Expected:** Tab skips the greyed-out "Previous".
13. **Phone:** the photo dots under a product photo are easy to tap.
14. **Screen reader** (Windows: NVDA, free; or Narrator):
    - On a listing, the headings list shows the page title, then "Products", then each product.
    - On a listing's first page, "Previous" is read as "link, unavailable".
15. **Windows High Contrast** (Settings → Accessibility → Contrast themes):
    - **Expected:** the shop is usable; buttons and links are visible.

## E. Automated checks

16. **Storefront:** `npm run check` and `npm run test:e2e` in `nextjs-haircraft`.
    - **Expected:** 194 and 204 pass. The last test, "Core Web Vitals on a slow phone", prints each page's numbers.

## Results

| #     | Check              | Expected                                                        | Result (Pass/Fail) | Notes |
| ----- | ------------------ | --------------------------------------------------------------- | ------------------ | ----- |
| 1–2   | robots.txt         | blocked by default; open with ALLOW_INDEXING, private paths out |                    |       |
| 3     | Sitemap            | products with photos, info pages                                |                    |       |
| 4–5   | Product data       | offers, delivery, returns, reviews; Rich Results valid (live)   |                    |       |
| 6–8   | Share images       | site and category pictures; previews when live                  |                    |       |
| 9–10  | Speed              | Lighthouse LCP/CLS green; small logo                            |                    |       |
| 11    | Colours            | readable, on-brand                                              |                    |       |
| 12–13 | Keyboard and phone | photo strip focusable; disabled Previous; dots tappable         |                    |       |
| 14    | Screen reader      | headings in order; Previous unavailable                         |                    |       |
| 15    | High Contrast      | usable                                                          |                    |       |
| 16    | Automated checks   | 194 + 204                                                       |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
