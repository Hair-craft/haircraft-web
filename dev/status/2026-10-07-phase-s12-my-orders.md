# Status: Phase S12, My orders

Tracks progress against [`plan/2026-10-07-phase-s12-my-orders.md`](../plan/2026-10-07-phase-s12-my-orders.md).

## 2026-10-07: implemented and verified

**Result: done.** Every in-scope item (S12.1–S12.7) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 152 unit tests (10 new) and 158 Playwright tests (13 new) against the test API, all passing
- **backend:** no changes
- screenshots reviewed by eye: the list, a shipped order with tracking, a cancelled paid order with its refund, and the phone's vertical progress line

Approved with the recommended options:

- the order lives at `/account/orders/HC-…` (the checkout page stays as the thank-you)
- cancel reasons from a short list with Other
- Buy again included

---

## What was built

### S12.1 Orders list `/account/orders`

- **My orders** is live in the account menu. The overview's orders card shows the latest one ("Latest: HC-100207, 7 Oct 2026 · ₹4,999 · Confirmed") with **View all orders**.
- **One card per order:**
  - the first item's photo, the number and a status badge (gold Awaiting payment, dark Confirmed, Being packed and Shipped, mint Delivered, grey Cancelled)
  - a payment note when it matters: "Pay on delivery", "Refund pending", "Refunded"
  - "Classic Straight Clip-in Set and 1 more", the date, the item count and the total
- **Filter chips:** All, Awaiting payment, Confirmed, Being packed, Shipped, Delivered, Cancelled (in the address bar, `?status=shipped`).
- **Pages of 20**, with an empty state for no orders and for an empty filter.

### S12.2 Order page `/account/orders/HC-100204`

- **The number** and its status badge, with "Placed on 7 Oct 2026".
- **The progress line:** Placed → Confirmed → Packed → Shipped → Delivered, with dates. It runs across on computers and down on phones; screen readers hear "(done)" or "(not yet)".
- **Once shipped:** "Sent with Delhivery, tracking number 1234567890123" and **Track parcel** (opens the courier's page).
- **An unpaid online order** has the S11 payment panel. It doesn't open by itself here; **Pay ₹… now** does.
- **Also on the page:** the items (linking to their products), the totals, the delivery address and instructions, the payment method ("Online · Paid", "Cash on delivery") and "Need help with this order? Contact us."
- **A cancelled order** shows "Cancelled on …, Reason: …" in place of the progress line.

### S12.3 Cancel

- While the API allows it, a quiet **Cancel this order** at the bottom opens a short form:
  - the reason: Ordered by mistake, Want a different length or colour, Found a better price, Delivery takes too long, Other (needs a few words)
  - an optional note
  - what happens to the money: "Nothing has been charged…" or "Your payment will be refunded… usually within 5–7 working days"
- **Afterwards:** "Your order is cancelled." The page shows the reason and, for a paid order, "Your refund of ₹3,999 has started…".
- **If the shop has started preparing it meanwhile,** that is explained, with Contact us.
- **Without JavaScript** it works the same (the form opens natively).

### S12.4 Refund status

- "Refund pending" and "Refunded" (and "Partly refunded") on the list.
- A plain sentence on the order page: "Your refund of ₹3,999 has started. It usually reaches your account in 5–7 working days…" or "₹3,999 has been refunded…".

### S12.5 Buy again

- **Buy again** puts the order's items (same options and quantities) in the bag and opens it.
- Items no longer available are left out, with "Some items from your bag couldn't be added: they're no longer available."

### S12.6 After checkout

- The thank-you page's second button is now **View your order**.

## Problems found and fixed

1. **The cancel reason could be lost** (found by a test):
   - choosing Other without a note, then adding one, sent "Ordered by mistake: …"
   - React resets a form after its action and doesn't apply new defaults to inputs that are already there
   - the form now starts afresh with the shopper's own choice and note after a problem, as with S9's address form

Test fixes (not app fixes):

- **Filter chips:** they're looked up by their exact name, because an order card's link also contains "Awaiting payment".
- **The S9 overview test:** it expected "Your orders will appear here soon."
- **An untested fix:** one fix attempt was checked against an old build (Playwright run without rebuilding). The full run afterwards rebuilds, and the final fix passes.

## Changed from the plan

- **Filter chips:** the API filters by one status at a time, so there's a chip per status (All, Awaiting payment, Confirmed, Being packed, Shipped, Delivered, Cancelled) instead of a combined "In progress". A combined filter would need a small backend change; it can be added any time.

## Known and accepted

- **Customers see the refund status, not amounts per refund or dates.** The API gives customers only the status; the full order amount is shown, as refunds are for the whole order.
- **"Contact us"** leads to the contact page that arrives with S14.
- **Server log noise:** "The destination stream closed early" appears in full test runs. No test fails.

## Not done / follow-ups

- Returns and exchanges, invoices as PDF, and emails about order changes (no API or email service yet).
