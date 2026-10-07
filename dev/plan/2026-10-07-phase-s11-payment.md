# Plan: Phase S11, payment (with backend B13)

**Status: Approved (2026-10-07)** with the recommended options: B13, a stand-in Razorpay for tests and demos (refused in production); the payment window opens straight after Place order.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S10, where an online order is placed and waits as "Awaiting payment". Order history is S12.

## Context

S11 connects online payment: after **Place order**, the shopper pays in Razorpay's own payment window (UPI, cards, net banking, wallets) and sees their order confirmed.

**What the API offers** (built in backend phase 7):

- **`POST /orders/:orderNumber/payments/razorpay`:**
  - returns what Razorpay's window needs (the public key id, Razorpay's order id, amount, prefilled name, email and mobile, time left)
  - calling again (another try, a reload) reuses the same Razorpay order
  - refuses orders that are paid, cancelled, cash on delivery, or have under 90 seconds left
- **`POST /orders/:orderNumber/payments/razorpay/verify`:**
  - takes Razorpay's success result, checks its signature and reads the payment back from Razorpay; the order becomes **Confirmed / Paid**
  - safe to repeat
  - if the payment failed or is still pending at the bank, it says so in plain words
- **If the browser never gets back** (closed tab, lost signal), Razorpay's webhook or the API's background check still confirms the payment.
- **Each order says** whether it can be paid now (`payment.canPay`) and why the last attempt failed.
- **Unpaid online orders** are cancelled after 30 minutes and their stock released.

**Keys:** the backend's `.env` already has the Razorpay test keys from phase 7. The keys pasted in chat on 2026-10-07 should be regenerated in the Razorpay dashboard and replaced in `.env` by the owner. The key **secret** stays on the API server; the storefront only ever receives the public key id, through the API.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **B13 (backend) A stand-in Razorpay for tests and demos** (open question 1):
   - a setting `RAZORPAY_FAKE=true` (refused in production) makes the API use an in-memory Razorpay instead of the real one (the same fake the backend's own tests already use, moved from `test/` into the app)
   - a development-only page stands in for Razorpay's payment window, with **Pay**, **Fail** and **Close** buttons; the payment results it hands back are correctly signed
   - so the storefront's Playwright tests cover paying, failing and retrying without the internet or anyone's keys
   - backend unit and e2e tests; README
2. **S11.1 Pay after placing:** after **Place order** with **Pay online**, Razorpay's payment window opens straight away (open question 2), prefilled with the shopper's name, email and mobile.
3. **S11.2 Success:**
   - the payment is verified through the API and the page becomes "Payment received: your order is confirmed", with the order number
   - the bag stays empty and the header is unchanged
4. **S11.3 Failure and retry:**
   - **closed without paying:** "Payment not completed" and **Pay ₹… now** to try again, with the time left ("Pay within 24 minutes or the order is cancelled")
   - **a declined payment:** the bank's reason in plain words (from the API), with **Try again**
   - **a payment still pending at the bank:** "We're waiting for your bank to confirm", and the page checks again by itself for a minute, then offers **Check again**
   - **an expired order:** "This order was cancelled because it wasn't paid in time", with **Shop again**
5. **S11.4 Pay later:**
   - the order's page (`/checkout/placed/HC-…`, until My orders arrives in S12) shows **Pay now** for as long as the order can be paid, so a shopper who closed the tab can come back
   - the payment panel is a component S12's order page reuses
6. **S11.5 Without JavaScript:** online payment needs JavaScript (Razorpay's window is a script). Without it, the page says so and suggests cash on delivery where offered. Placing the order still works.
7. **S11.6 Tests, click-through, docs:**
   - unit tests for the payment rules
   - Playwright, listed under Testing
   - a real test-mode payment by hand (in the QC guide)
   - screenshots
   - status, QC guide, PROGRESS, boss doc

**Out of scope:**

- refunds (staff do them in the admin panel; the customer view comes with S12)
- saved cards
- EMI and pay-later offers (Razorpay shows whatever is switched on in its dashboard)
- emails and SMS (no email service yet)

## Design

- **The payment panel** on the order's page:
  - the amount, "Secure payment by Razorpay", the time left, **Pay ₹… now**, and the latest message (failed, pending, closed)
  - once paid: a green "Payment received" with the date
- **Razorpay's window** uses HairCraft's deep green and the shop name. Razorpay's own design and the payment methods are set in the Razorpay dashboard.
- **How it works:**
  - Razorpay's script loads only on this page, when needed
  - starting a payment and verifying it are server actions calling the API with the shopper's session; the browser never sees the key secret
  - after verifying, the page re-reads the order from the API, the only record of whether it's paid

## Files

```
nestjs-haircraft/src/modules/payments/razorpay/fake-razorpay.ts       the stand-in (moved from test/support)
nestjs-haircraft/src/modules/payments/payments.module.ts, src/config/…   RAZORPAY_FAKE (refused in production)
nestjs-haircraft/src/modules/orders/dev-razorpay-window.controller.ts   the stand-in payment window (development only)
nestjs-haircraft/test/…, README.md, dev/PROGRESS.md
src/components/checkout/payment-panel.tsx      Pay now, Razorpay's window, messages
src/lib/checkout/payment.ts, actions.ts, rules.ts   start, verify, messages, time left
src/app/(checkout)/checkout/placed/[orderNumber]/page.tsx
playwright.config.ts                            the test API with RAZORPAY_FAKE
tests/unit/payment.test.ts, tests/e2e/payment.spec.ts, tests/e2e/payment.mobile.spec.ts
dev/status/…-phase-s11-…, dev/testing/…-phase-s11-…, dev/PROGRESS.md
```

## Testing

1. **Backend (B13):**
   - the fake mode is refused in production
   - payments through the stand-in window confirm the order exactly as real ones do (paid, failed, closed, retried)
   - the full backend suite still passes
2. **Unit:** time left, the messages for each payment outcome, and which button the panel shows.
3. **Playwright (test API with the stand-in):**
   - place and pay: confirmed and paid
   - close, then pay: confirmed
   - a declined payment, then a successful retry
   - pay later from the order's page after leaving
   - a paid order offers no **Pay now**
   - someone else's order can't be paid
   - no JavaScript
   - phones (the window fits)
   - API down
4. **By hand (QC guide):** a real Razorpay test-mode payment with the test UPI id and test card, and a failed one.
5. **By eye:** the panel in each state, on a computer and a phone.

## Risks

- **A paid order the browser never confirms** (the tab closes right after paying): the API's webhook and background check confirm it. The page shows "We're waiting for your bank to confirm" until then.
- **Razorpay's script can be slow or blocked** (some ad blockers): the panel says "Couldn't open the payment window" with **Try again**, and nothing is charged.
- **Real Razorpay in automated tests** would need the internet and keys in test settings. The stand-in avoids both; the real one is checked by hand.

## Open questions

1. **How to test payments automatically.** Recommended: **B13, a stand-in Razorpay inside the API for tests and local demos** (refused in production). It covers success, failure and retry on every run, offline and without keys, and a real test-mode payment is checked by hand in QC. The alternative is no automated payment tests (unit tests only), with all payment checks by hand.
2. **When the payment window opens.** Recommended: **straight after Place order**, since the shopper has just chosen Pay online, with **Pay now** on the page for retries and later. The alternative is a confirmation page first, with a **Pay now** button to press.
