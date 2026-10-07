# Testing: Phase S12, My orders

Pairs with [`plan`](../plan/2026-10-07-phase-s12-my-orders.md) and [`status`](../status/2026-10-07-phase-s12-my-orders.md).

**What this phase delivers:**

- the orders list
- each order's page: progress, tracking, payment, cancel, refund status
- Buy again

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`), with online payment (test keys) and, to try cash on delivery, `COD_ENABLED=true`.
   - Restart the API after changing `.env`.
2. **In `nextjs-haircraft`:** `npm run dev` (with `STORE_OPEN=true`), and open <http://localhost:3001>.
3. **Orders to look at:** as a customer, place three orders:
   - cash on delivery
   - online, paid
   - online, left unpaid

## A. The list

1. **My account → My orders.**
   - **Expected:** newest first, each with a photo, number, badge, date, item count and total.
   - **Expected:** "Pay on delivery" on the cash order and "Awaiting payment" on the unpaid one.
2. **Filters:** **Awaiting payment**, then **Delivered**.
   - **Expected:** only the unpaid order, then "No orders here" with **Show all orders**.
3. **The overview** (My account): **Expected:** "Latest: HC-…" with **View all orders**.
4. **A new account:** **Expected:** "No orders yet" with **Start shopping**.

## B. An order's page

5. **Open the cash order.**
   - **Expected:** the progress line with Placed and Confirmed ticked and dated; the items, totals, address and "Cash on delivery".
6. **In the admin panel** set it to Processing, add shipping (carrier, tracking number and link), then Shipped. Reload.
   - **Expected:** Packed and Shipped ticked, "Sent with … tracking number …" and **Track parcel** (opens the courier's page).
   - **Expected:** no Cancel.
7. **Open the unpaid online order.**
   - **Expected:** "Awaiting payment" with **Pay ₹… now** (not opening by itself).
   - Pay with UPI `success@razorpay`. **Expected:** "Online · Paid", status Confirmed.

## C. Cancelling and refunds

8. **On a confirmed, unpaid cash order: Cancel this order.**
   - Choose **Other** without a note and press **Cancel order**. **Expected:** "Please tell us a little more…", with Other still chosen.
   - Add a note and cancel. **Expected:** "Your order is cancelled.", "Cancelled on … Reason: Other: …", and no Cancel any more.
9. **On a paid online order: Cancel.**
   - **Expected:** the form says the payment will be refunded.
   - **Expected:** afterwards, "Your refund of ₹… has started…"; the list shows "Refund pending".
   - **Expected:** once Razorpay processes it (test mode: minutes; the admin panel shows it), "Refunded".
10. **The admin panel** → that order. **Expected:** the reason and the refund.

## D. Buy again and after checkout

11. **Buy again** on any order. **Expected:** the bag opens with the same items.
    - Deactivate one of its products in the admin panel first: **Expected:** "Some items… couldn't be added", and the rest are added. Reactivate it afterwards.
12. **Place an order through checkout.** **Expected:** the thank-you page has **View your order**, which opens its page.

## E. Special cases

13. **Someone else's order:** sign in as another customer and open the first one's order address. **Expected:** "not found".
14. **Signed out:** open an order address. **Expected:** sign in, then back to the order.
15. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** the list and pages work; Cancel this order opens and cancels.
    - Re-enable JavaScript afterwards.
16. **Keyboard:** Tab through the list and an order. **Expected:** cards, chips, Track parcel, Buy again and Cancel are reachable.
17. **Phone:** **Expected:** the chips scroll sideways, the cards fit, and the progress line runs down the screen.
18. **API down:** stop the API and open My orders. **Expected:** "We'll be right back". Start it again.

## F. Automated checks

19. **In `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 152 unit tests and 158 end-to-end tests pass.

## Results

| #     | Check              | Expected                                          | Result (Pass/Fail) | Notes |
| ----- | ------------------ | ------------------------------------------------- | ------------------ | ----- |
| 1     | List               | newest first, badges, payment notes               |                    |       |
| 2     | Filters            | only matching; empty filter message               |                    |       |
| 3–4   | Overview, new user | latest order; no orders yet                       |                    |       |
| 5     | Order page         | progress, items, totals, address                  |                    |       |
| 6     | Shipped            | packed/shipped ticked, tracking, no cancel        |                    |       |
| 7     | Pay from the page  | paid, confirmed                                   |                    |       |
| 8     | Cancel unpaid      | reason kept after a problem; cancelled            |                    |       |
| 9–10  | Cancel paid        | refund pending, then refunded; admin panel agrees |                    |       |
| 11    | Buy again          | items in the bag; unavailable ones explained      |                    |       |
| 12    | View your order    | link from the thank-you page                      |                    |       |
| 13–14 | Access             | not found; sign in first                          |                    |       |
| 15    | No JavaScript      | cancel works                                      |                    |       |
| 16    | Keyboard           | all reachable                                     |                    |       |
| 17    | Phone              | chips scroll, cards fit, vertical progress        |                    |       |
| 18    | API down           | calm message                                      |                    |       |
| 19    | Automated checks   | 152 + 158                                         |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
