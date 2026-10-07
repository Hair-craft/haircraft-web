# Testing: Phase S3, product listing

Pairs with [`plan`](../plan/2026-10-06-phase-s3-product-listing.md) and [`status`](../status/2026-10-06-phase-s3-product-listing.md).

**What this phase delivers:** the shop's product lists:

- `/shop` (everything) and `/shop/<category>` (e.g. `/shop/wigs`, `/shop/seamless-clip-ins`)
- filters by length, colour, texture, price and stock, with removable chips
- sort, page numbers, and a filter panel on phones
- and, in the backend, `GET /products/filters`, which tells the shop which choices exist

Product pages come in S5, so clicking a product still shows the 404 page.

Test in Chrome or Edge on a computer (at least 1024 px wide), and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`) with the sample catalogue (`npm run seed:catalog`).
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`. To see page numbers with only 6 products, also add `PRODUCTS_PER_PAGE=2` (remove it afterwards; the default is 24). Then:
   ```powershell
   npm install
   npm run dev
   ```
3. **Open <http://localhost:3001/shop>.**

## A. The backend endpoint

1. **Open <http://localhost:3000/api/v1/products/filters?category=wigs>.**
   - **Expected:** `lengths` [18, 22, 26], `colors` ["Natural Black"], `textures` ["Body Wave"], `price` from "18999.00" to "21999.00".
   - **Then** `?category=no-such-thing`. **Expected:** empty lists and `"price": null`.
   - **Swagger** (<http://localhost:3000/api/docs>): "Filter options" appears under Products.

## B. Pages and headings

2. **`/shop`.**
   - **Expected:** breadcrumbs "Home › Shop", the heading "Shop all", a short description, and chips All · Clip-in Extensions · Tape-in Extensions · Wigs · Ponytails.
   - **Expected:** "6 products" (or how many active products you have), newest first; the browser tab says "Shop All Hair Extensions, Wigs & Ponytails | HairCraft".
3. **Click the "Clip-in Extensions" chip.**
   - **Expected:** address `/shop/clip-in-extensions`, heading "Clip-in Extensions", chips "All Clip-in Extensions" (dark) · Seamless Clip-ins · Classic Clip-ins, and only clip-in products.
   - **Click "Seamless Clip-ins".** **Expected:** breadcrumbs Home › Shop › Clip-in Extensions › Seamless Clip-ins; only seamless products.
4. **Open `/shop/no-such-category`.**
   - **Expected:** "We couldn't find that page", with **one** header and offers bar (not two).

## C. Filters (computer)

5. **Tick "Natural Black" under Colour.**
   - **Expected:** the list updates at once without the page jumping or going blank; the address ends `?color=natural-black`; "Colour (1)" in gold; a chip "Colour: Natural Black ×" above the products.
   - **Compare** with Admin → Products: every product shown has a Natural Black option.
6. **Also tick "18 inch".**
   - **Expected:** only products with an option that is **both** 18 inch and Natural Black.
7. **Keyboard:** press Tab until a tick box is focused, then Space. **Expected:** it ticks, the list updates, and the focus stays on the tick box.
8. **Price:** click the first band (e.g. "Up to ₹10,000"). **Expected:** it turns dark, the From/To boxes fill in, and only products within the price show. Click it again to remove it.
   - **Type** From 5000, To 7000 and press **Apply**. **Expected:** the chip "Price: ₹5,000 – ₹7,000".
9. **Tick "In stock only".** **Expected:** sold-out products disappear.
10. **Chips:** click × on one chip. **Expected:** only that filter goes. Then **Clear all**. **Expected:** all filters go; the sort stays.

## D. Sort, pages, address

11. **Sort by** each option. **Expected:** Price: low to high starts with the cheapest; high to low the most expensive; Best rated starts with the reviewed products; Name A–Z alphabetical. Newest removes `sort` from the address.
12. **Pages** (with `PRODUCTS_PER_PAGE=2`): **Expected:** 1 2 3 with Previous/Next; page 1 is dark; Next goes to `?page=2`. Open `/shop?page=99`. **Expected:** it goes to the last page.
13. **Back button:** apply two filters one after another, then press Back twice. **Expected:** each press undoes one change, and the tick boxes follow.
14. **Share:** copy a filtered address into a new tab. **Expected:** the same view.
15. **Messy address:** open `/shop?length=18&length=99&color=purple&page=1`. **Expected:** the address becomes `/shop?length=18`.

## E. Phones

16. **On a phone (or device toolbar), `/shop`.**
    - **Expected:** no filter column; a **Filters** button and **Sort by** beside it; 2 products per row; the page never moves sideways.
17. **Tap Filters.**
    - **Expected:** a panel slides in from the left. Tick a colour and a length: nothing changes behind it yet.
    - **Tap Show results.** **Expected:** the panel closes, the list is filtered, and the button reads "Filters (2)".
18. **Tap Filters, tick something, then close with ×.** **Expected:** nothing changes; reopening shows only the applied filters.

## F. Special cases

19. **No matches:** open `/shop/wigs?min=500000`. **Expected:** "No products match these filters" with **Clear all filters**, which brings the wigs back.
20. **API down:** stop the API and reload `/shop` and `/shop/wigs`. **Expected:** "We'll be right back", no error page. Start the API again.
21. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript", reload): tick filters and press **Apply filters**; choose a sort and press **Sort**. **Expected:** both work. Re-enable JavaScript afterwards.
22. **Search engines:**
    - **View page source on a filtered view.** **Expected:** `<meta name="robots" content="noindex, follow">`.
    - **Open `/sitemap.xml`.** **Expected:** `/shop` and the categories are listed while the shop is open.

## G. Automated checks

23. **With the API running, in `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 49 unit tests and 47 end-to-end tests pass.
    - **In `nestjs-haircraft`:** `npm test` and `npm run test:e2e`. **Expected:** 306 and 260 pass.

## Results

| #     | Check              | Expected                                            | Result (Pass/Fail) | Notes |
| ----- | ------------------ | --------------------------------------------------- | ------------------ | ----- |
| 1     | Filter options API | real values per category; empty for unknown         |                    |       |
| 2     | /shop              | heading, chips, count, newest first, title          |                    |       |
| 3     | Categories         | category and sub-category pages, breadcrumbs        |                    |       |
| 4     | Unknown category   | 404 page, one header                                |                    |       |
| 5–6   | Tick filters       | instant, address, chip, combined on the same option |                    |       |
| 7     | Keyboard           | Space ticks, focus stays                            |                    |       |
| 8     | Price              | bands and From/To                                   |                    |       |
| 9     | In stock only      | sold-out hidden                                     |                    |       |
| 10    | Chips              | × removes one; Clear all keeps the sort             |                    |       |
| 11    | Sort               | every order correct                                 |                    |       |
| 12    | Pages              | numbers, Next/Previous, past the end                |                    |       |
| 13–14 | Back, share        | Back undoes; shared address same view               |                    |       |
| 15    | Messy address      | tidied                                              |                    |       |
| 16–18 | Phone              | panel, Show results, count, closing forgets         |                    |       |
| 19    | No matches         | message and Clear all filters                       |                    |       |
| 20    | API down           | calm message                                        |                    |       |
| 21    | No JavaScript      | Apply filters and Sort work                         |                    |       |
| 22    | Search engines     | noindex on filtered views; sitemap                  |                    |       |
| 23    | Automated checks   | 49 + 47 storefront; 306 + 260 backend               |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
