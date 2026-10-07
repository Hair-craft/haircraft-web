# Testing: Phase S5, product page

Pairs with [`plan`](../plan/2026-10-06-phase-s5-product-page.md) and [`status`](../status/2026-10-06-phase-s5-product-page.md).

**What this phase delivers:** the product page:

- photos (thumbnails, swipe, full screen)
- choosing length, colour and texture, with the price and stock
- details, reviews with a star breakdown
- related products, and search-engine details

There's no Add to bag yet (S7); "Ordering opens soon" stands in its place.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`) with the sample catalogue and reviews.
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`, then `npm install` and `npm run dev`.
3. **Open <http://localhost:3001/shop>** and click **Brazilian Body Wave Seamless Clip-in**.

## A. The page

1. **Expected:**
   - breadcrumbs Home › Shop › Seamless Clip-ins › the product
   - the name, a price, "Inclusive of all taxes", **In stock**, a short description
   - rows **Length** (16, 18, 20, 22 inch) and **Colour** (Dark Brown, Natural Black); "Texture: Body Wave" as text
   - the "Ordering opens soon" box and the SKU
2. **Browser tab:** "Brazilian Body Wave Seamless Clip-in | HairCraft".

## B. Choosing an option

3. **Click 20 inch.**
   - **Expected:** it turns dark; the price and SKU change straight away (the page doesn't reload); the address ends `?variant=BBW-SC-20-…`.
4. **Click Dark Brown.** **Expected:** the photos switch to that colour's photo first (when it has one); the price and SKU follow.
5. **A sold-out option** (e.g. 22 inch in one of the colours) is **struck through**. Click it. **Expected:** "Sold out" in red.
6. **A dashed button** means that value exists only with other choices. Click it. **Expected:** the other choices change to an option that exists.
7. **Copy the address, open it in a new tab.** **Expected:** the same option is chosen.
8. **Type the SKU in lower case** in the address. **Expected:** it is corrected to the catalogue's spelling. A made-up SKU goes to the plain product address.
9. **A product on sale** (find one with a Sale badge in the shop):
   - **Expected:** the old price struck through, the new price, and a gold "Save ₹…".
   - Check the saving against Admin → Products.

## C. Photos

10. **Desktop:** click the second thumbnail, then the › arrow. **Expected:** the photo changes; the chosen thumbnail has a dark ring. Click the photo itself: it opens full screen with "1 / 3", arrows and ×; Escape closes it.
11. **Phone:** swipe the photo sideways. **Expected:** the next photo, and the dots follow. Tap it to open full screen; swipe there too.

## D. Details, reviews, related

12. **Description** is open. **Details** shows Pieces and similar, plus the chosen length, colour, texture and weight; it changes when you change the option. **Delivery & returns** shows placeholder text.
13. **Wrap-around Ponytail** (it has a review):
    - **Expected:** stars under the name, which jump to "Customer reviews" when clicked
    - **Expected:** "4 / 5", "Based on 1 review", bars per star level, and the review with name and date
    - **Sort reviews → Lowest rated** reorders them.
14. **A product without reviews:** "No reviews yet…".
15. **"You may also like":** 4 other products, never the one you're on.

## E. Special cases

16. **`/product/no-such-thing`:** the 404 page, with one header.
17. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** the option buttons still work; each click loads that option's address. Re-enable JavaScript afterwards.
18. **API down:** stop the API and reload a product. **Expected:** "We'll be right back". Start the API again.
19. **Search engines:**
    - **View the page source.** **Expected:** a `"@type":"Product"` block with the price range in INR (and the rating only when there are reviews), and `<link rel="canonical" href="…/product/<slug>">`.
    - **`/sitemap.xml`** lists every product.
20. **Phone:** the page never scrolls sideways; the price and options come right after the photos.

## F. Automated checks

21. **With the API running, in `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 69 unit tests and 72 end-to-end tests pass.
    - If several fail at once with missing sections, the API's rate limit was reached (until S16): wait a minute and run again.

## Results

| #     | Check            | Expected                                           | Result (Pass/Fail) | Notes |
| ----- | ---------------- | -------------------------------------------------- | ------------------ | ----- |
| 1–2   | Page             | breadcrumbs, name, price, stock, rows, note, title |                    |       |
| 3–4   | Choosing         | instant price/SKU/photo/address change             |                    |       |
| 5–6   | Sold out, dashed | struck through and selectable; dashed moves others |                    |       |
| 7–8   | Addresses        | shared link; lower case corrected; unknown → plain |                    |       |
| 9     | Sale             | old price, Save ₹… correct                         |                    |       |
| 10–11 | Photos           | thumbnails, arrows, full screen; swipe and dots    |                    |       |
| 12    | Details          | follow the chosen option                           |                    |       |
| 13–14 | Reviews          | summary, bars, list, sort; "No reviews yet"        |                    |       |
| 15    | Related          | 4 others                                           |                    |       |
| 16    | 404              | not-found page, one header                         |                    |       |
| 17    | No JavaScript    | option links work                                  |                    |       |
| 18    | API down         | calm message                                       |                    |       |
| 19    | Search engines   | Product data, canonical, sitemap                   |                    |       |
| 20    | Phone            | fits, order of sections                            |                    |       |
| 21    | Automated checks | 69 unit + 72 e2e                                   |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
