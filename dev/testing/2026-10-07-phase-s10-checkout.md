# Testing: Phase S10, checkout

Pairs with [`plan`](../plan/2026-10-07-phase-s10-checkout.md) and [`status`](../status/2026-10-07-phase-s10-checkout.md).

**What this phase delivers:** checkout, where the shopper chooses the address, adds a coupon, picks how to pay and places the order, plus the order confirmation page. Paying online arrives in S11, so online orders show "Awaiting payment" for now.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **In `nestjs-haircraft`:** add `COD_ENABLED=true` to `.env` (to try cash on delivery), then `npm run start:dev`.
2. **A coupon:** in the admin panel (Coupons → New), create `WELCOME10`, Percentage, 10, active.
3. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`, then `npm run dev`. Open <http://localhost:3001>.

## A. Opening checkout

1. **As a guest, add a product and press Checkout in the bag.**
   - **Expected:** the sign-in page.
   - **Expected:** after signing in, the checkout page with your item.
2. **The header:** **Expected:** only the logo, "Secure checkout" and **Back to bag** (no menus).
3. **With an empty bag, open `/checkout`.** **Expected:** back on the bag page.

## B. Address

4. **With no saved address:** **Expected:** the address form on the checkout page.
   - Fill it in and press **Add address**: **Expected:** back at checkout with it chosen.
5. **With two addresses:** **Expected:** the default is chosen.
   - Choose the other: **Expected:** "Delivering to …" under the total changes.
6. **+ Add a new address:** fill in and save. **Expected:** back at checkout with the new address chosen; it's also in My account → Addresses.

## C. Coupon and totals

7. **Have a coupon?** → `welcome10` → **Apply**.
   - **Expected:** "WELCOME10 applied: you save ₹…", a Discount line, and a lower total on **Place order**.
8. **Remove.** **Expected:** the discount goes.
9. **A wrong code** (`NOPE`). **Expected:** a red reason under the field; you can still place the order.
10. **Totals:** **Expected:** Subtotal, Shipping "Free" (over ₹1,999) or ₹99, Total and "Includes ₹… GST".

## D. Placing orders

11. **Cash on delivery** (and a delivery instruction), then **Place order**.
    - **Expected:** "Placing your order…".
    - **Expected:** "Thank you, <name>", the order number, "Confirmed: pay when it arrives", the address, the instruction, the items and the total.
    - **Expected:** the bag icon shows 0.
12. **In the admin panel → Orders:** **Expected:** the order, Confirmed, cash on delivery, with the instruction.
13. **Pay online**, then **Place order.** **Expected:** the confirmation page with "Awaiting payment". It is cancelled automatically after 30 minutes.
14. **Cash on delivery over ₹10,000** (the HD lace wig): **Expected:** a reason under Cash on delivery and **Place order** waits; choosing Pay online lets you continue.
15. **A price change:** open checkout, change that item's price in the admin panel, then press **Place order**.
    - **Expected:** a notice that prices changed and the new total.
    - Set the price back afterwards.
16. **An item that runs out:** with checkout open in one tab, deactivate the product in the admin panel and reload checkout.
    - **Expected:** "1 item needs your attention. Review your bag", and **Place order** waits.
    - Reactivate it afterwards.
17. **Double click Place order.** **Expected:** one order (the admin panel shows one).
18. **Someone else's order:** copy the confirmation page's address, sign in as another customer and open it. **Expected:** "not found".

## E. Special cases

19. **Keyboard:** Tab through checkout. **Expected:** address and payment choices with the arrow keys, the coupon and **Place order** reachable.
20. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - choosing an address shows **Deliver here**; choosing a payment shows **Use this**
    - the whole order can be placed
    - Re-enable JavaScript afterwards.
21. **Phone:**
    - **Expected:** the summary at the top folded to "Order summary (1 item) ₹…"; tapping shows the items.
    - **Expected:** everything fits, and **Place order** is at the end.
22. **API down:** with the API stopped, open `/checkout`. **Expected:** "We'll be right back". Start it again.

## F. Automated checks

23. **In `nextjs-haircraft`** (the test database set up once with `scripts\setup-e2e-db.ps1`):
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 131 unit tests and 138 end-to-end tests pass.

## Results

| #     | Check             | Expected                                     | Result (Pass/Fail) | Notes |
| ----- | ----------------- | -------------------------------------------- | ------------------ | ----- |
| 1     | Guest to checkout | sign in, back with the bag                   |                    |       |
| 2     | Quiet header      | logo, secure checkout, back to bag           |                    |       |
| 3     | Empty bag         | back to the bag page                         |                    |       |
| 4–6   | Address           | inline form; default chosen; choose; add new |                    |       |
| 7–9   | Coupon            | applied, removed, refused with a reason      |                    |       |
| 10    | Totals            | shipping, total, GST included                |                    |       |
| 11–12 | Cash on delivery  | confirmed page; bag 0; in the admin panel    |                    |       |
| 13    | Online            | awaiting payment                             |                    |       |
| 14    | COD over ₹10,000  | reason; pay online instead                   |                    |       |
| 15    | Price changed     | notice, new total                            |                    |       |
| 16    | Item ran out      | marked; Place order waits                    |                    |       |
| 17    | Double click      | one order                                    |                    |       |
| 18    | Someone else's    | not found                                    |                    |       |
| 19    | Keyboard          | all reachable                                |                    |       |
| 20    | No JavaScript     | whole order                                  |                    |       |
| 21    | Phone             | folded summary, fits                         |                    |       |
| 22    | API down          | calm message                                 |                    |       |
| 23    | Automated checks  | 131 + 138                                    |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
