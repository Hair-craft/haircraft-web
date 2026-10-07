# Testing: Phase S7, cart

Pairs with [`plan`](../plan/2026-10-06-phase-s7-cart.md) and [`status`](../status/2026-10-06-phase-s7-cart.md).

**What this phase delivers:**

- **Add to bag** on product pages, with a quantity
- the bag drawer and `/cart` page: quantities, remove, problems, price changes
- a guest bag that joins the account at sign-in
- in the backend, `POST /cart/preview` for guests' bags

Checkout itself comes in S10.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`).
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true` and `FREE_SHIPPING_THRESHOLD=1999`, then `npm install` and `npm run dev`.
3. **Open <http://localhost:3001>.**

## A. Adding

1. **Open a product, choose an option, press + once, then Add to bag.**
   - **Expected:** the drawer opens: "Your bag (2)", the line (photo, name, option), the line total for 2, "You've got free shipping" (or "Add ₹… more"), the subtotal, **View bag** and **Checkout** ("Checkout opens soon").
   - **Expected:** the bag icon shows a gold **2**.
2. **A sold-out option** (struck through): **Expected:** the button reads **Sold out** and can't be pressed.
3. **Press + until it stops at 10**, add, then add again.
   - **Expected:** "You can have at most 10 of one item in your bag."
4. **More than the stock:** in the admin panel, set an option's stock to 2 (Inventory → adjust), then try to add 3 of it.
   - **Expected:** "Only a limited quantity of this item is available." and nothing added. Adding 2 works.

## B. The bag

5. **In the drawer, press + and −.** **Expected:** the quantity, totals, title and icon update at once. − at 1 removes the line.
6. **Remove.** **Expected:** the line goes; an empty bag says "Your bag is empty" with **Shop all**.
7. **View bag** (`/cart`).
   - **Expected:** the lines in a larger layout and a Summary card (subtotal, item count, free-shipping line, Checkout).
   - **Expected:** a product name opens that product with the same option chosen.
8. **A problem line:**
   - Add 2 of an option, then set its stock to 1 in the admin panel and reload `/cart`.
   - **Expected:** a red-outlined line with "Only a limited quantity…" and "1 item needs your attention before checkout." Press −: the warning goes.
   - **Deactivating** the product instead shows "This item is no longer available." Reactivate it afterwards.
9. **Price changed:** add an item, change its price (or sale price) in the admin panel, wait 2 minutes, reload `/cart`.
   - **Expected:** "Price changed from ₹… to ₹…" on that line.

## C. Guest bag and account

10. **As a guest, add 2 items, then sign in.** **Expected:** the bag still has them (now the account's), with the count in the header.
11. **Sign in with the same account in another browser.** **Expected:** the same bag.
12. **Sign out.** **Expected:** the bag is empty (it stays with the account; signing in again brings it back).
13. **Register as a new customer with a guest bag.** **Expected:** the new account starts with those items.

## D. Special cases

14. **Keyboard:** Tab to the bag icon and press Enter. **Expected:** the drawer opens with the focus inside; Escape closes it.
15. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** Add to bag goes to `/cart` with the item; + / − / Remove work there (the page reloads). Re-enable JavaScript.
16. **Phone:** add an item. **Expected:** the drawer covers most of the screen and everything fits; **View bag** shows `/cart`.
17. **API down:** with an item in a guest bag, stop the API and open `/cart`. **Expected:** "We'll be right back". Start the API again.
18. **A made-up message:** open `/cart?problem=Call%20us`. **Expected:** that text never appears (only the shop's own messages).

## E. Automated checks

19. **In `nestjs-haircraft`:** `npm test` and `npm run test:e2e`. **Expected:** 310 and 273 pass.
20. **In `nextjs-haircraft`** (the test database set up once with `scripts\setup-e2e-db.ps1`):
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 95 unit tests and 98 end-to-end tests pass.

## Results

| #     | Check              | Expected                                                  | Result (Pass/Fail) | Notes |
| ----- | ------------------ | --------------------------------------------------------- | ------------------ | ----- |
| 1     | Add to bag         | drawer, line, totals, count, free-shipping line           |                    |       |
| 2     | Sold out           | button disabled                                           |                    |       |
| 3     | Ten at most        | message                                                   |                    |       |
| 4     | Over the stock     | message, nothing added                                    |                    |       |
| 5–6   | Quantities, remove | instant updates; empty state                              |                    |       |
| 7     | Cart page          | layout, summary, product links                            |                    |       |
| 8     | Problem lines      | outline, message, banner, cleared by −                    |                    |       |
| 9     | Price changed      | note on the line                                          |                    |       |
| 10–13 | Guest and account  | merged on sign-in/register; follows; empty after sign-out |                    |       |
| 14    | Keyboard           | open, focus inside, Escape                                |                    |       |
| 15    | No JavaScript      | add, +/−/Remove on /cart                                  |                    |       |
| 16    | Phone              | drawer, fits                                              |                    |       |
| 17    | API down           | calm message                                              |                    |       |
| 18    | Made-up message    | never shown                                               |                    |       |
| 19–20 | Automated checks   | 310 + 273 backend; 95 + 98 storefront                     |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
