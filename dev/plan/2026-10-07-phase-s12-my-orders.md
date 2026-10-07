# Plan: Phase S12, My orders

**Status: Approved (2026-10-07)** with the recommended options: the order lives at /account/orders/HC-… (the checkout page stays as the thank-you); cancel reasons from a short list with Other; Buy again included.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S9 (the account area, where "My orders" is marked "coming soon"), S10 (orders) and S11 (the payment panel).

## Context

Customers can place and pay for orders, but can't see them afterwards except on the confirmation page. S12 adds **My orders** to the account: the list, each order's details and progress, cancelling, and refund status.

**What the API offers** (built in backend phases 6–7):

- **`GET /orders`:** my orders, newest first, 20 a page, filterable by status. Each has the number, date, status, payment status and method, total, item count, and the first item's name and photo.
- **`GET /orders/:orderNumber`:** everything about one order:
  - items, totals, address, notes
  - payment status, and whether it can be paid now
  - the courier and tracking number (and link) once shipped
  - the **timeline** of status changes (with the reason for a cancellation)
  - **`canCancel`**
- **`POST /orders/:orderNumber/cancel`** with a reason (3–500 characters):
  - possible until the shop starts preparing it (awaiting payment or confirmed)
  - the stock and any coupon use are given back
  - a paid online order is refunded automatically to the original payment method: **Refund pending**, then **Refunded** once Razorpay processes it (usually 5–7 working days)
- **Statuses:** Awaiting payment → Confirmed → Processing → Shipped → Delivered, or Cancelled. Customers see the refund status, not refund amounts or dates.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S12.1 Orders list** `/account/orders`:
   - "My orders" in the account menu (no longer "coming soon") and an orders card on the overview
   - one card per order: photo, number, date, item count, total, a status badge, and the payment status when it matters ("Awaiting payment", "Refund pending", "Refunded")
   - filter chips: All, Awaiting payment, In progress, Delivered, Cancelled
   - pages of 20
   - an empty state with **Start shopping**
2. **S12.2 Order page** `/account/orders/HC-100001`:
   - **a progress line:** Placed → Confirmed → Packed → Shipped → Delivered, with dates, or "Cancelled on …" with the reason
   - **tracking:** the courier and number with **Track parcel** once shipped
   - **the S11 payment panel**, for paying an unpaid order
   - the items (linking to their products), the totals, the delivery address and instructions, the payment method and status
   - **Need help?** links to contact
3. **S12.3 Cancel:**
   - **Cancel order** while `canCancel`, which asks for a reason (open question 2) and confirms
   - afterwards the page says what happens: stock released; "Your refund of ₹… has started: it usually reaches your account in 5–7 working days" for a paid order
4. **S12.4 Refund status:** "Refund pending" and "Refunded" on the list and the order page, in plain words.
5. **S12.5 Buy again** (open question 3): puts the order's items that are still available back in the bag, and says which couldn't be added.
6. **S12.6 After checkout:** the confirmation page links to the order page ("View your order"). S11's "pay later" link becomes the order page.
7. **S12.7 Tests, click-through, docs:**
   - unit tests for the rules
   - Playwright, listed under Testing
   - screenshots
   - status, QC guide, PROGRESS, boss doc

**Out of scope:**

- returns and exchanges (no API; through Contact us)
- invoices as PDF (no API yet)
- emails about order changes (no email service yet)

## Design

- **The list:** in the account frame from S9. Each order is a white card with the first item's photo, "HC-100001 · 7 Oct 2026", "3 items · ₹18,397", and a coloured badge (gold "Awaiting payment", green "Delivered", grey "Cancelled").
- **The order page:** the progress line across the top (a vertical list on phones), then the payment panel or tracking, then the items, totals and address. Cancelling is a quiet link at the bottom, so it isn't pressed by accident.
- **How it works:**
  - pages read from the API with the customer's session, as the other account pages do
  - cancelling is a server action (a plain form, so it works without JavaScript)
  - the page re-reads the order afterwards; the API is the only record

## Files

```
src/app/(shop)/account/orders/page.tsx, [orderNumber]/page.tsx
src/components/account/…           order card, status badge, progress line, cancel dialog, buy again
src/lib/orders/…                   API calls, server actions, rules (pure: statuses, labels, filters, progress steps)
src/components/account/account-nav.tsx, src/app/(shop)/account/page.tsx   My orders live
src/app/(checkout)/checkout/placed/[orderNumber]/page.tsx                  "View your order"
tests/unit/orders.test.ts, tests/e2e/orders.spec.ts, tests/e2e/orders.mobile.spec.ts
dev/status/…-phase-s12-…, dev/testing/…-phase-s12-…, dev/PROGRESS.md
```

## Testing

1. **Unit:**
   - status labels and badge colours
   - the progress steps for each status (and cancelled)
   - filter chips to the API's statuses
   - the refund wording
   - the cancel reasons
2. **Playwright (test API, stand-in Razorpay):**
   - **list:** newest first, the filters, pages, the empty state
   - **order page:** items, totals, address, the timeline
   - **cancel:** an unpaid order; a paid order (refund pending); not offered once processing
   - **tracking:** shown once staff mark it shipped (set through the admin API)
   - **pay:** an unpaid order from its page
   - **buy again:** with one item no longer available
   - **access:** someone else's order is "not found"; guests sign in first
   - keyboard; no JavaScript (cancel); phones (vertical progress, cards fit); API down
3. **By eye:** the list and an order in each state (awaiting payment, confirmed, shipped, delivered, cancelled with a refund), on a computer and a phone.

## Risks

- **Refund timing is Razorpay's:** the page says "usually 5–7 working days" and shows Refunded only when the API knows.
- **Old orders:** placed by tests or by hand during development. Nothing special; they show like any other order.

## Open questions

1. **Where an order lives.** Recommended: **`/account/orders/HC-…` is the order's page**, with the S11 payment panel, tracking and cancel. The checkout confirmation page stays as the "thank you" right after ordering, with **View your order**. The alternative is a single page for both.
2. **The cancel reason.** Recommended: **a short list:**
   - Ordered by mistake
   - Want a different length or colour
   - Found a better price
   - Delivery takes too long
   - Other, with a box to explain

   This takes one tap and gives the shop useful reasons. The alternative is a free-text box only.

3. **Buy again.** Recommended: **yes**, putting the still-available items (same length and colour) back in the bag, a common shortcut for repeat buyers of extensions. The alternative is leaving it out for now.
