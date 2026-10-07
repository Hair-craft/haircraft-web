# Plan: Phase S10, checkout

**Status: Approved (2026-10-07)** with the recommended options: one checkout page; online orders placed in S10 and shown as awaiting payment until S11; a quieter checkout header.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S7 (the bag) and S9 (the address book). Paying online (Razorpay) is S11; order history is S12.

## Context

Today the bag's **Checkout** button is disabled ("Checkout opens soon"). S10 opens it: the shopper chooses where to deliver, may add a coupon, sees the final price, and places the order.

**What the API offers** (all built, for signed-in customers):

- **`POST /checkout/preview`:** the totals for the current bag with an address, coupon and payment method. It changes nothing, so the page can ask whenever something changes.
  - **totals:** subtotal, coupon discount, shipping (₹99, free from ₹1,999), grand total, GST included
  - **coupon:** applied or not, with the reason in plain words
  - **problems** to fix first: empty bag, an item short or gone, no address, cash on delivery not available
  - which payment methods are open, and `canPlaceOrder`
- **`POST /orders`:**
  - places the order: re-checks every line, reserves the stock, copies prices and the address, counts the coupon and empties the bag
  - needs a new **Idempotency-Key** per checkout attempt, so a double click or a resent form never makes two orders
  - sending the total the shopper saw makes the API refuse (`409 PRICE_CHANGED`) if it changed meanwhile
  - **errors:** empty bag, bag not ready, coupon invalid, price changed, no address, cash on delivery not available
- **Online orders** wait for payment (`PENDING_PAYMENT`) and are cancelled automatically after 30 minutes. **Cash on delivery** (only when the shop switches it on, up to ₹10,000) is confirmed at once.
- **`GET /orders/:orderNumber`:** the placed order, for the confirmation page.
- **No guest checkout:** ordering needs an account. A guest's bag already joins their account at sign-in (S7).

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S10.1 Opening checkout:**
   - **Checkout** in the drawer and on the bag page goes to `/checkout`
   - guests are sent to sign in or register first and come back with their bag (`/checkout` joins the signed-in pages in `proxy.ts`)
   - an empty bag goes back to `/cart`
2. **S10.2 Delivery address:**
   - the saved addresses as choices, the default selected
   - **Add a new address** opens the S9 form and comes back to checkout with it selected
   - with no saved address, the form is shown straight away
3. **S10.3 Coupon:**
   - "Have a coupon?" opens a code field with **Apply**
   - the discount shows in the summary, or the API's reason ("This coupon has expired", "Spend ₹2,000 to use this coupon"…)
   - **Remove** takes it off
4. **S10.4 Payment method and summary:**
   - **Pay online** (the default) and **Cash on delivery** when the shop offers it for this order
   - an order summary with the items (photo, name, option, quantity, price), subtotal, discount, shipping (or "Free"), total and "Includes ₹… GST"
   - the free-shipping line from S7
   - problems (an item running short) are shown with a link back to the bag
5. **S10.5 Place order:**
   - an optional "Delivery instructions" box (up to 500 characters)
   - **Place order** sends one idempotency key per attempt, kept when the same attempt is sent again
   - if the total changed, the new total is shown and the shopper confirms again
   - on success, the bag is empty (header count 0) and the confirmation page opens
6. **S10.6 Confirmation page** `/checkout/placed/HC-100001`:
   - "Thank you, Meera", the order number, items, total, address and what happens next
   - cash on delivery: "Confirmed: pay when it arrives"
   - online: "Awaiting payment" (open question 2)
   - only the order's own customer can see it
7. **S10.7 Tests, click-through, docs:**
   - unit tests for the rules
   - Playwright, listed under Testing
   - screenshots
   - status, QC guide, PROGRESS, boss doc

**Out of scope:**

- Razorpay and paying (S11)
- order history and cancelling (S12)
- PIN-code look-up
- gift wrap and gift messages (no API)

## Design

- **One checkout page** (open question 1), in two columns on computers:
  - left: Delivery address, Payment, Delivery instructions
  - right: an order summary card that stays in view, with **Place order** under the total
- **On phones:** the summary comes first, folded to "Order total ₹…" (tap to see the items), then the sections, with **Place order** at the end.
- **Quiet chrome** (open question 3): the usual header and footer are replaced by the logo, "Secure checkout" and a link back to the bag, so nothing distracts from finishing.
- **How it works:**
  - the chosen address, coupon and payment method live in the page's address (`/checkout?address=…&coupon=…&pay=cod`), so every choice is a plain link or form that works without JavaScript, and a reload keeps them
  - the summary is always the API's preview: the shop never adds up prices itself
  - **Place order** is a server action carrying the idempotency key made when the page was drawn

## Files

```
src/app/(checkout)/layout.tsx              the quiet header
src/app/(checkout)/checkout/page.tsx, placed/[orderNumber]/page.tsx
src/components/checkout/…                  address choice, coupon, payment, summary, place order
src/lib/checkout/…                         API calls, server action, rules (pure: URL state, messages, idempotency keys)
src/components/cart/cart-ui.tsx            Checkout buttons become links
src/proxy.ts                               /checkout needs a session
tests/unit/checkout.test.ts, tests/e2e/checkout.spec.ts, tests/e2e/checkout.mobile.spec.ts
dev/status/…-phase-s10-…, dev/testing/…-phase-s10-…, dev/PROGRESS.md
```

## Testing

1. **Unit:**
   - reading and writing the checkout's URL state
   - problem and coupon messages
   - the idempotency key format
   - which payment methods show
2. **Playwright** (test API; a second test API setting turns cash on delivery on, so both kinds of order are tested):
   - **access:** a guest goes to sign in and comes back with the bag; an empty bag goes back to `/cart`
   - **address:** the default is chosen; choose another; add a new one from checkout
   - **coupon:** applied (made by the test through the admin API), refused with its reason, removed
   - **totals:** shipping free above ₹1,999 and ₹99 below
   - **cash on delivery:** placed, confirmed, the bag emptied, the stock reduced
   - **online:** placed and awaiting payment
   - **safety:**
     - the same attempt sent twice makes one order
     - a price changed meanwhile is shown before ordering
     - an item that runs out blocks ordering, with a link to the bag
   - **confirmation page:** someone else's order isn't shown
   - keyboard; no JavaScript (the whole flow); phones (folded summary, fits); API down
3. **By eye:** the checkout and the confirmation page on a computer and a phone, with a coupon, a problem and the price-change notice.

## Risks

- **Between S10 and S11, online orders can be placed but not paid.** They are cancelled automatically after 30 minutes and their stock released. haircraft.in stays behind the coming-soon gate, so no real shopper can place one.
- **Prices or stock can change while the shopper is deciding.** The API's checks at ordering time (stock, `PRICE_CHANGED`) are the safety net, and the page explains them.
- **Coupons need an admin to create them:** the dev seed has none, so the QC guide starts by creating one in the admin panel.

## Open questions

1. **One page or steps.** Recommended: **one checkout page** (address, payment and summary together): fewer taps, and returning shoppers with a saved address just check and press **Place order**. The alternative is three steps (Address → Payment → Review).
2. **Online orders before S11.** Recommended: **place them in S10 and show them as "Awaiting payment"** on the confirmation page ("You'll be able to pay online here soon"). S11 then adds the Razorpay step right after placing, on the same pages. The alternative is building S10 and S11 together as one larger phase.
3. **A quieter header at checkout.** Recommended: **yes:** logo, "Secure checkout" and "Back to bag" only, as most shops do, so shoppers aren't led away mid-checkout. The alternative is the normal header and footer.
