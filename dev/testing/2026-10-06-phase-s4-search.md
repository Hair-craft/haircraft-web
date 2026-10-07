# Testing: Phase S4, search

Pairs with [`plan`](../plan/2026-10-06-phase-s4-search.md) and [`status`](../status/2026-10-06-phase-s4-search.md).

**What this phase delivers:**

- a search bar in the header that suggests categories and products as you type
- a results page `/search?q=…` with the same filters, sort and pages as the shop
- help when nothing is found ("Did you mean …?")
- in the backend, a smarter search that understands word order, hyphens, plurals, colours and lengths

Product pages come in S5, so opening a product still shows the 404 page.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`) with the sample catalogue (`npm run seed:catalog`).
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`. Then:
   ```powershell
   npm install
   npm run dev
   ```
3. **Open <http://localhost:3001>.**

## A. The backend search

1. **Open these in the browser** (each shows JSON; look at the product names):
   - <http://localhost:3000/api/v1/products?search=clip%20in>: **Expected:** the 2 clip-in products.
   - `?search=wigs`: the lace front wig. `?search=black`: every product with a Natural Black option.
   - `?search=natural%20black%2018`: products with a Natural Black option and an 18 inch length.
2. **Suggestions:** <http://localhost:3000/api/v1/products/suggest?q=wigz>.
   - **Expected:** no products, `"didYouMean": "wig"`. With `q=zzzz`: `"didYouMean": null`.

## B. The search bar

3. **Click the search icon** (magnifying glass, top right).
   - **Expected:** a search bar opens under the header with the cursor in it. On a phone it fills the screen.
4. **Type `clip`.**
   - **Expected:** after a moment, Categories (e.g. Clip-in Extensions) as chips and Products with photo, name and price; "clip" is **bold**; "See all results for "clip"" at the bottom.
5. **Keyboard:** press ↓ a few times.
   - **Expected:** the choice is highlighted (dark chip or mint row). Enter opens it: a category opens its list, a product its page (404 until S5).
6. **Open it again, type `wig`, press Escape.** **Expected:** the bar closes and the search icon has the focus.
7. **Type `body wave` and press Enter.** **Expected:** the results page.
8. **Click outside the bar** (on the page below it). **Expected:** it closes.
9. **Type `wigz`.** **Expected:** "No suggestions for "wigz" — did you mean wig?"; clicking **wig** searches for it.

## C. Results page

10. **`/search?q=clip in`.**
    - **Expected:** "Results for "clip in"", the search box filled in, the products, and **Sort by: Relevance**.
    - **Expected:** the browser tab "Search results for "clip in" | HairCraft".
11. **Tick a colour, then sort by Price: low to high.**
    - **Expected:** the list narrows and reorders; the address keeps `q=clip%20in`. **Clear all** removes the filters but keeps the search.
12. **Search again from the box on the results page.** **Expected:** new results.

## D. When nothing is found

13. **`/search?q=wigz`.**
    - **Expected:** full width: "No results for "wigz"", **Did you mean wig?**, tips, category chips and "You might like" with 4 products; no filter column or sort.
14. **`/search` with nothing typed.** **Expected:** "What are you looking for?" with the categories.

## E. Phones and special cases

15. **Phone:** open search, type `tape`, tap a suggestion. **Expected:** full-screen search, suggestions readable, nothing wider than the screen.
16. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript", reload):
    - **Expected:** the search icon goes to the search page; typing and **Search** shows results. Re-enable JavaScript.
17. **API down:** stop the API, open search and type `wig`.
    - **Expected:** no suggestions, but Enter still opens the results page, which says "We'll be right back". Start the API again.
18. **Search engines:** view the page source of a results page. **Expected:** `<meta name="robots" content="noindex, follow">`.

## F. Automated checks

19. **With the API running, in `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 59 unit tests and 61 end-to-end tests pass.
    - **In `nestjs-haircraft`:** `npm test` and `npm run test:e2e`. **Expected:** 310 and 269 pass.

## Results

| #   | Check                | Expected                                              | Result (Pass/Fail) | Notes |
| --- | -------------------- | ----------------------------------------------------- | ------------------ | ----- |
| 1   | Backend search       | word order, plurals, colours, lengths                 |                    |       |
| 2   | Did you mean (API)   | wigz → wig; nothing for zzzz                          |                    |       |
| 3   | Opening the bar      | under the header; full screen on phones; focus in box |                    |       |
| 4   | Suggestions          | categories, products with photo/price, bold words     |                    |       |
| 5–6 | Keyboard             | arrows, Enter, Escape returns focus                   |                    |       |
| 7–8 | Enter, click outside | results page; closes                                  |                    |       |
| 9   | Typo in the bar      | did you mean wig                                      |                    |       |
| 10  | Results page         | heading, box, Relevance, title                        |                    |       |
| 11  | Filters on results   | narrow, sort, Clear all keeps search                  |                    |       |
| 12  | Search again         | from the page's box                                   |                    |       |
| 13  | No results           | did you mean, tips, categories, products; no filters  |                    |       |
| 14  | Empty search         | "What are you looking for?"                           |                    |       |
| 15  | Phone                | full screen, fits                                     |                    |       |
| 16  | No JavaScript        | link and form work                                    |                    |       |
| 17  | API down             | Enter still searches; calm message                    |                    |       |
| 18  | Search engines       | noindex                                               |                    |       |
| 19  | Automated checks     | 59 + 61 storefront; 310 + 269 backend                 |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
