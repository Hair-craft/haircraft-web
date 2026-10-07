# Testing: Phase S11, payment (with backend B13)

Pairs with [`plan`](../plan/2026-10-07-phase-s11-payment.md) and [`status`](../status/2026-10-07-phase-s11-payment.md).

**What this phase delivers:**

- paying online with Razorpay straight after Place order
- retrying and paying later
- clear messages when a payment fails or is pending
- in the backend, a stand-in Razorpay for tests and demos (B13)

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **Keys first:** in the Razorpay dashboard (Test mode → Account & Settings → API Keys), **regenerate** the test key. Put the new key id and secret in `nestjs-haircraft/.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Keep `ONLINE_PAYMENTS_ENABLED=true`. Never paste keys into chat.
2. **Start the API:** `npm run start:dev` in `nestjs-haircraft`.
3. **Start the shop:** `npm run dev` in `nextjs-haircraft`, with `STORE_OPEN=true`. Open <http://localhost:3001>.
4. **A customer:** sign in as a customer with a saved address and something in the bag.

## A. Paying (real Razorpay, test mode)

1. **Checkout → Pay online → Place order.**
   - **Expected:** the order page, with Razorpay's window opening by itself, showing HairCraft, the amount and your details filled in.
   - **Expected:** a "Test mode" ribbon in the window.
2. **Pay with UPI `success@razorpay`** (or card `4111 1111 1111 1111`, any future date, any CVV, OTP as shown).
   - **Expected:** the window closes; "Payment received: ₹… paid online. Your order is confirmed."
3. **Admin panel → Orders:** **Expected:** the order Confirmed and Paid, with the Razorpay payment id.
4. **Reload the order page.** **Expected:** still "Payment received", and the window doesn't open again.

## B. Failing and retrying

5. **Place another online order, then close Razorpay's window.**
   - **Expected:** "Payment not completed. You can try again.", **Pay ₹… now** and "Pay within N minutes…".
6. **Pay now, then UPI `failure@razorpay`.** **Expected:** a red message with the reason; the window lets you try again.
7. **Pay successfully.** **Expected:** "Payment received".
8. **Pay later:** place an online order, close the window and go to the home page. Then open the order page again (its address is in the browser history).
   - **Expected:** "Awaiting payment" with **Pay now**, and no window opening by itself.
   - Pay: **Expected:** confirmed.
9. **Not paid in time** (optional, 30 minutes): leave an online order unpaid. **Expected:** cancelled automatically; the page says "Not paid…" with **Shop again**, and the items are back in stock.

## C. Special cases

10. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** placing an online order works.
    - **Expected:** the page says "Paying online needs JavaScript…".
    - Re-enable JavaScript afterwards.
11. **Phone:** **Expected:** Razorpay's window fills the screen and UPI apps can be chosen; the order page fits.
12. **An ad blocker** that blocks Razorpay (if you have one): **Expected:** "We couldn't open the payment window. Nothing has been charged…".
13. **Cash on delivery** (if `COD_ENABLED=true`): **Expected:** no payment panel; "Confirmed: pay when it arrives".

## D. The stand-in (B13), optional

14. **In `nestjs-haircraft/.env`** set `RAZORPAY_FAKE=true`.
    - **In `nextjs-haircraft/.env.local`** set `RAZORPAY_SCRIPT_URL=http://localhost:3000/api/v1/dev/razorpay/checkout.js`.
    - Restart both.
    - **Expected:** placing an online order opens a plain "Stand-in Razorpay… no real payment" window with Pay, Fail and Close, which behave like steps 2, 5 and 6.
    - **Remove both settings afterwards.**
15. **With `APP_ENV=production`, the API refuses `RAZORPAY_FAKE=true`** at startup (optional).

## E. Automated checks

16. **In `nestjs-haircraft`:** `npm test` and `npm run test:e2e`. **Expected:** 317 and 287 pass.
17. **In `nextjs-haircraft`:** `npm run check` and `npm run test:e2e`. **Expected:** 142 and 145 pass.

## Results

| #   | Check             | Expected                                | Result (Pass/Fail) | Notes |
| --- | ----------------- | --------------------------------------- | ------------------ | ----- |
| 1–2 | Real test payment | window opens by itself; paid, confirmed |                    |       |
| 3   | Admin panel       | Confirmed, Paid, Razorpay id            |                    |       |
| 4   | Reload            | still paid; window not reopened         |                    |       |
| 5   | Closed            | not completed, Pay now, time left       |                    |       |
| 6–7 | Failed, retried   | reason shown; then paid                 |                    |       |
| 8   | Pay later         | Pay now on return; paid                 |                    |       |
| 9   | Not paid in time  | cancelled, stock back                   |                    |       |
| 10  | No JavaScript     | placed; message                         |                    |       |
| 11  | Phone             | window fits                             |                    |       |
| 12  | Ad blocker        | calm message                            |                    |       |
| 13  | Cash on delivery  | no payment panel                        |                    |       |
| 14  | Stand-in          | Pay, Fail, Close                        |                    |       |
| 15  | Production guard  | startup refuses RAZORPAY_FAKE           |                    |       |
| 16  | Backend checks    | 317 + 287                               |                    |       |
| 17  | Storefront checks | 142 + 145                               |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
