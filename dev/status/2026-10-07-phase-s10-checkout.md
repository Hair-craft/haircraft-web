# Status: Phase S10, checkout

Tracks progress against [`plan/2026-10-07-phase-s10-checkout.md`](../plan/2026-10-07-phase-s10-checkout.md).

## 2026-10-07: implemented and verified

**Result: done.** Every in-scope item (S10.1–S10.7) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 131 unit tests (9 new) and 138 Playwright tests (16 new) against the test API, all passing
- **backend:** no changes. The test API now runs with cash on delivery switched on (up to ₹10,000), so both kinds of order are tested.
- screenshots reviewed by eye:
  - checkout on a computer: plain, with a coupon and cash on delivery, and with a notice and a refused coupon
  - the confirmation page
  - checkout on a phone, with the summary folded and open

Approved with the recommended options:

- one checkout page
- online orders placed now and shown as awaiting payment until S11
- a quieter checkout header

---

## What was built

### S10.1 Opening checkout

- **Checkout** in the bag drawer and on the bag page now goes to `/checkout`. It is held while an item needs attention.
- **Guests** go to sign in or register and come back to checkout with their bag (it joins the account, from S7).
- **An empty bag** goes back to `/cart`.
- **The quiet frame:** the logo, "Secure checkout" and **Back to bag** at the top, and a one-line footer. No menus.

### S10.2 Delivery address

- The saved addresses as cards to choose from, with the default chosen first.
- **+ Add a new address** opens the S9 form at `/checkout/address`. It comes back to checkout with the new address chosen, and it's saved to the address book too.
- With no saved address, the form is right there on the checkout page.

### S10.3 Coupon

- "Have a coupon?" opens a code field with **Apply** (any case).
- **Applied:** "WELCOME10 applied: you save ₹899.80", a Discount line in the totals, and **Remove**.
- **Not applied:** the API's reason under the field (for example "This coupon code is not valid."). A coupon that doesn't apply changes nothing, so the order can still be placed without it.

### S10.4 Payment and summary

- **Pay online** (the default; "UPI, cards, net banking and wallets") and **Cash on delivery** when the shop offers it for this order. Over its limit, the API's reason shows and **Place order** waits.
- **The summary** (always the API's numbers):
  - each item with a small photo, quantity, option and line total
  - subtotal, discount, shipping or "Free", total, and "Includes ₹… GST"
  - "Add ₹… more for free shipping" when it applies
- **Items with a problem** are marked, with "1 item needs your attention. Review your bag".
- **On phones** the summary comes first, folded to "Order summary (1 item) ₹5,999"; the totals and **Place order** come after the sections.

### S10.5 Place order

- An optional **Delivery instructions** box (up to 500 characters).
- **Place order · ₹8,098.20** shows "Placing your order…" and can't be pressed twice. A line under it says what happens next ("You'll pay the courier when your order arrives." / "You'll pay securely online after placing your order.").
- **One order per attempt:** each drawing of the page carries one idempotency key, so a double click or a resent form returns the same order. This was tested by sending the exact request twice: one order.
- **If the API refuses,** checkout comes back with a notice and fresh totals:
  - a price changed meanwhile ("Prices changed while you were checking out…")
  - the bag changed
  - the coupon no longer applies (it is taken off)
  - cash on delivery isn't available (switched to online)
  - the shop can't be reached
- **The address bar** carries only a short notice code, never text.
- **After placing,** the bag count is 0 and the confirmation page opens.

### S10.6 Confirmation page

`/checkout/placed/HC-100026`:

- "Thank you, Meera", the order number, and what happens next:
  - cash on delivery: "Confirmed: pay when it arrives"
  - online: "Awaiting payment… You'll be able to pay online here soon"
- the address and instructions, the payment method, the items and the totals
- **Continue shopping** and **My account**
- someone else's order number shows the "not found" page

## Problems found and fixed

1. **The phone summary's label** carried hidden "Show"/"Hide" words that screen readers and tests read together. It's now "Order summary (1 item)" with a chevron.
2. **Test orders held stock:**
   - unpaid online orders keep their stock reserved until they expire, and the test API doesn't run the expiry job
   - left over from the first test runs, they made an S7 test's stock change fail
   - the checkout tests now cancel unpaid test orders before and after they run (the test database only), and reset the two products' stock
3. **A note after adding an address from checkout:** "Address added." would have popped up later on another page. It's left out when coming back to checkout (the new address is chosen there instead).

Test fixes (not app fixes): the S7 test expected a disabled Checkout button. "Out of stock" is tested by deactivating the product (stock reserved by orders can't be set to zero).

## Changed from the plan

- **Shipping of ₹99 below ₹1,999** isn't tested end to end: every product in the test catalogue costs more than ₹1,999. The backend's own tests cover the fee, and the page shows whatever the API returns ("Free" or the amount).

## Known and accepted

- **Online orders can't be paid until S11.** They're cancelled automatically after 30 minutes and their stock released. haircraft.in stays behind the coming-soon gate.
- **"Contact us"** in the checkout footer leads to the contact page that arrives with S14.
- **Server log noise:** "The destination stream closed early" appears in full test runs when a test moves on while a page is still streaming. No test fails.

## Not done / follow-ups

- Razorpay payment, retrying and "paid" confirmation (S11).
- Order history and cancelling (S12).
- City and state from the PIN code.
