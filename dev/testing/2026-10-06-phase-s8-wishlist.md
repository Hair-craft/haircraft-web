# Testing: Phase S8, wishlist

Pairs with [`plan`](../plan/2026-10-06-phase-s8-wishlist.md) and [`status`](../status/2026-10-06-phase-s8-wishlist.md).

**What this phase delivers:**

- a heart on every product card and product page, to save products
- a header count, and **My wishlist** in the account and phone menus
- the `/wishlist` page with **Move to bag** and **Remove**
- guests asked to sign in, with the product saved afterwards

No backend changes.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`).
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`, then `npm install` and `npm run dev`.
3. **Open <http://localhost:3001>.** Have a customer account ready (or register one in step 1).

## A. As a guest

1. **Open Shop all and press the heart on a card.**
   - **Expected:** a panel, "Save your favourites", with **Sign in** and **Create an account**.
2. **Press Sign in and sign in.**
   - **Expected:** you come back to the same page, that product's heart is gold and filled, and the header heart shows **1**.
3. **Sign out, then open `/wishlist`.** **Expected:** you are sent to sign in, and come back to the wishlist after signing in.

## B. Saving (signed in)

4. **Open a product and press the heart beside its name.**
   - **Expected:** it fills at once, a note says "Saved … to your wishlist.", and the header count goes up.
5. **Open Shop all.** **Expected:** saved products show filled hearts (a moment after the page appears).
6. **Press a filled heart.** **Expected:** it empties, "Removed … from your wishlist.", and the count goes down.
7. **Account menu (your initial).** **Expected:** **My wishlist** opens `/wishlist`.

## C. The wishlist page

8. **Save three products and open `/wishlist`.**
   - **Expected:** "My wishlist (3)", the products with **Move to bag** and **Remove** under each, lined up.
9. **Remove one.** **Expected:** it goes, the heading and header count drop. Removing the last shows "Nothing saved yet" with **Shop all**.
10. **Move to bag, one option** (save **Deep Wave Tape-ins**: one length is sold out).
    - **Expected:** the bag drawer opens with it, and it leaves the wishlist.
11. **Move to bag, several options** (save **Classic Straight Clip-in Set**).
    - **Expected:** its product page opens. Choose an option and **Add to bag**: the drawer opens and the header's wishlist count drops (it left the wishlist).
12. **A product no longer sold:** save a product, deactivate it in the admin panel, then reload `/wishlist`.
    - **Expected:** it shows faded, "No longer available", with only **Remove**. Reactivate it afterwards.
13. **Sold out:** save a product, set every option's stock to 0 in the admin panel, reload. **Expected:** a disabled **Sold out** button. Restore the stock afterwards.

## D. Special cases

14. **Keyboard:** on Shop all, Tab through the cards. **Expected:** each card's link, then its heart; Space presses the heart.
15. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - as a guest, the heart goes to sign in, then back, with the product saved
    - signed in, the heart comes back to the same page and the product is on `/wishlist`
    - Re-enable JavaScript afterwards.
16. **Phone:**
    - **Expected:** hearts are easy to tap; the menu (☰) has **My wishlist**; the wishlist page shows two products per row and fits the screen.
17. **Sign out.** **Expected:** the header heart has no count.
18. **API down:** signed in, stop the API and open `/wishlist`. **Expected:** "We'll be right back". Start the API again.

## E. Automated checks

19. **In `nextjs-haircraft`** (the test database set up once with `scripts\setup-e2e-db.ps1`):
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 107 unit tests and 110 end-to-end tests pass.

## Results

| #   | Check                  | Expected                                       | Result (Pass/Fail) | Notes |
| --- | ---------------------- | ---------------------------------------------- | ------------------ | ----- |
| 1–2 | Guest heart            | panel; saved after sign-in, same page, count 1 |                    |       |
| 3   | Wishlist needs sign-in | sent to sign in and back                       |                    |       |
| 4–6 | Saving and removing    | instant, notes, count, filled hearts on cards  |                    |       |
| 7   | Account menu           | My wishlist                                    |                    |       |
| 8–9 | Wishlist page          | heading, buttons lined up, remove, empty state |                    |       |
| 10  | Move, one option       | in the bag, leaves the wishlist                |                    |       |
| 11  | Move, several options  | product page; leaves the wishlist once added   |                    |       |
| 12  | No longer sold         | faded, Remove only                             |                    |       |
| 13  | Sold out               | disabled button                                |                    |       |
| 14  | Keyboard               | link then heart; Space                         |                    |       |
| 15  | No JavaScript          | guest to sign-in and saved; customer saved     |                    |       |
| 16  | Phone                  | tap targets, menu link, fits                   |                    |       |
| 17  | Sign out               | no count                                       |                    |       |
| 18  | API down               | calm message                                   |                    |       |
| 19  | Automated checks       | 107 + 110 storefront                           |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
