# Status: Phase S11, payment (with backend B13)

Tracks progress against [`plan/2026-10-07-phase-s11-payment.md`](../plan/2026-10-07-phase-s11-payment.md).

## 2026-10-07: implemented and verified

**Result: done, except the real test-mode payment by hand,** which is in the QC guide and needs the owner's regenerated keys. Every other in-scope item (B13 and S11.1–S11.6) is implemented and verified:

- **storefront:** typecheck, ESLint, Prettier and a production build, all clean; 142 unit tests (11 new) and 145 Playwright tests (7 new) against the test API, all passing
- **backend (B13):** 317 unit tests (1 new) and 287 e2e tests (5 new), all passing; ESLint and the build clean
- **screenshots reviewed by eye:**
  - the payment window over the order page
  - "Payment not completed" with Pay now
  - "Payment received"
  - a phone

Approved with the recommended options:

- B13, a stand-in Razorpay for tests and demos (refused in production)
- the payment window opens straight after Place order

**Keys:** the Razorpay test keys pasted in chat on 2026-10-07 were not copied anywhere. The backend's `.env` already holds test keys; the owner is asked to regenerate them in the Razorpay dashboard and replace the values (an open item in PROGRESS).

---

## What was built

### B13 (backend) Stand-in Razorpay

- **`RAZORPAY_FAKE=true`** makes a running API use an in-memory Razorpay: the same one the backend's own tests used, moved from `test/` into the app.
  - startup refuses it with `APP_ENV=production`
  - it needs no keys (it uses fake ones when none are set) and never contains a network call
- **`GET /api/v1/dev/razorpay/checkout.js`** stands in for Razorpay's browser script: `new Razorpay(options)`, `.on("payment.failed")`, `.open()`. It opens a pretend payment window with **Pay**, **Fail** and **Close**:
  - Pay hands back a result signed exactly as Razorpay signs it
  - Fail fires Razorpay's failure event with the bank's reason
  - Close calls the shop's "dismissed" handler
- **The routes** don't exist (404) unless the stand-in is on. Their headers allow only what the storefront needs (the script loaded from another origin, the window shown inside the shop's page).
- **Tests:** a payment through the stand-in confirms the order exactly like a real one, a failed attempt can be retried, bad input is refused, and nothing exists with the setting off. The existing Razorpay suite still passes on the moved fake.

### S11.1 Pay after placing

- **Place order** with Pay online goes to the order's page with `?pay=1`, where Razorpay's window opens at once, prefilled with the shopper's name, email and mobile and themed in HairCraft's deep green.
- The `?pay=1` is removed straight away, so a reload doesn't open it again.
- Razorpay's script loads only on that page, only when someone pays. Production always uses Razorpay's own script; a stand-in needs an explicit test setting (`ALLOW_TEST_PAYMENT_SCRIPT=true`).

### S11.2 Success

- Razorpay's result goes to a server action, which checks its shape and has the API verify it (signature, then Razorpay itself). The page then re-reads the order from the API and shows **Payment received**: "₹3,999 paid online. Your order is confirmed."
- The browser never sees the key secret: starting and verifying are server actions with the shopper's session.

### S11.3 Failure and retry

- **Closed without paying:** "Payment not completed. You can try again." with **Pay ₹3,999 now** and "Pay within 29 minutes or the order is cancelled." (kept current).
- **Declined:** the bank's reason, e.g. "Payment failed because the bank declined it". It stays after the window is closed. Retrying (in the window or with Pay now) works.
- **Still pending at the bank:** "We're waiting for your bank to confirm". The page checks again every 5 seconds for a minute, then offers **Check again**.
- **Cancelled** (unpaid in time, or cancelled): "Not paid. This order was cancelled because it wasn't paid in time. Nothing was charged…" with **Shop again**.
- **The script blocked or slow:** "We couldn't open the payment window. Nothing has been charged…".

### S11.4 Pay later

- The order's page (`/checkout/placed/HC-…`) offers **Pay now** for as long as the order can be paid. Coming back to it doesn't open the window by itself.
- The panel is one component, ready for S12's order page.

### S11.5 Without JavaScript

- The order is placed as before. The panel shows "Paying online needs JavaScript. Please turn it on in your browser to pay."

## Problems found and fixed

1. **Opening the window from an effect** ran into React's rule against changing state during an effect, and in development React runs effects twice. It now starts once, from a timer.
2. **A wrong "not signed in" path in the first draft:** a check would have thrown an error instead of returning "session ended". Caught while reviewing; fixed before any test ran.

Test notes (not app fixes):

- Playwright's text search skips `<noscript>`, so the no-JavaScript message is checked on the element itself.
- A page-wide "alert" query also matched Next's route announcer, so it's scoped to the payment panel.
- A screenshot seemed to show the decline message lost after Close. That was my screenshot script closing too soon; a test now checks the message stays.

## Changed from the plan

- **The real test-mode payment by hand** is left for QC (section C of the guide). It needs the regenerated keys and Razorpay's test page in a real browser.

## Known and accepted

- **Online payment needs JavaScript** (Razorpay's window is a script).
- **Ad blockers** can stop Razorpay's script; the panel says so, and nothing is charged.
- **Server log noise:** "The destination stream closed early" appears in full test runs. No test fails.

## Not done / follow-ups

- **Refunds:** staff handle them in the admin panel; the customer's view comes with S12.
- **Emails and SMS:** no email service yet.
- **Saved cards, EMI and pay-later offers:** Razorpay shows whatever is switched on in its dashboard.
