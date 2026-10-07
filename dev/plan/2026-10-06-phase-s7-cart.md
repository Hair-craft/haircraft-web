# Plan: Phase S7, cart

**Status: Approved (2026-10-06)** with the recommended options: B12 `POST /cart/preview` for guest bags, price-change notes remembered on the shopper's device, a display cookie for the header count, a 1–10 quantity stepper on the product page.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S5 (the product page, where "Ordering opens soon" stands in for Add to bag) and S6 (sessions). Roadmap decision **D6**: guests keep a cart in a cookie (variant ids and quantities only), merged into their account when they sign in.

## Context

Shoppers need to collect items, see what they cost now and whether they're still available, change quantities, and keep their bag when they sign in. Checkout itself is S10.

**What the API offers** (built):

- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart` for signed-in customers
  - each returns the whole cart: lines with the **current** price (sale price when on sale), list price, line total, and an availability per line (`available`, `insufficient_stock` "Only a limited quantity…", "out of stock", `unavailable` "no longer available"), plus the item count, subtotal and `readyForCheckout`
  - the cart stores no prices and reserves no stock; stock is reserved only when an order is placed (S10)
- `POST /cart/merge`: adds a guest's lines after sign-in, listing any it had to skip
- limits: 10 of one item per line, 50 lines per cart

**What it doesn't offer:** pricing a **guest's** cart. Guests have no account, so their cookie (ids and quantities) can't be shown with prices and availability without either a new endpoint or the storefront rebuilding the rules (open question 1).

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

0. **B12 (backend): guest cart preview**, if open question 1 is approved:
   - `POST /cart/preview` with up to 50 `{variantId, quantity}` lines
   - returns the same cart shape as `GET /cart`, using the same rules and messages
   - public, saves nothing; unknown or removed items come back as `unavailable`
   - tests, Swagger, backend docs
1. **S7.1 Add to bag** (product page):
   - **Add to bag** replaces "Ordering opens soon"
   - a quantity stepper (1–10) beside it (open question 4)
   - sold-out options: the button reads **Sold out** and can't be pressed
   - adding opens the cart drawer; problems are shown by the button ("Only a limited quantity of this item is available.")
2. **S7.2 Cart drawer and page:**
   - the header's bag icon shows the item count and opens a **drawer** from the right: each line with photo, name, option (e.g. 18 inch · Natural Black), price, quantity stepper and **Remove**; the subtotal; **View bag**; **Checkout**
   - **`/cart`**, the full page: the same lines in a larger layout, an order summary (subtotal; "Shipping and taxes at checkout"), and an empty state ("Your bag is empty", with links to shop)
   - **Checkout** shows "Checkout opens soon" until S10, like the product page did
   - a free-shipping line: "Add ₹350 more for free shipping" / "You've got free shipping", from the existing `FREE_SHIPPING_THRESHOLD` setting (checkout will show the real shipping)
3. **S7.3 Quantities:**
   - − / + per line (1–10); at 1, − becomes Remove; changes save at once and the totals update
   - asking for more than is in stock keeps the old quantity and says so
4. **S7.4 Cart problems:**
   - each problem line is marked with the API's message and a clear action: lower the quantity, or remove it
   - a summary at the top ("1 item needs your attention"); **Checkout** is held back while `readyForCheckout` is false
   - **price changes:** the price the shopper saw when adding is remembered on their device; if it has changed, the line says "Price changed from ₹6,999 to ₹5,999" (open question 2)
5. **S7.5 Guest cart and merge:**
   - **guests:** the lines live in an httpOnly cookie (variant id and quantity only, at most 50 lines) and are priced with B12
   - **on sign-in or register:** the guest's lines are merged into the account and the cookie is cleared
   - anything the API skips (no longer sold, cart full) is explained once: "1 item from your bag couldn't be added"
   - **signing out** leaves an empty guest bag (the account's bag stays with the account)
6. **S7.6 Tests, click-through, docs:** unit tests for the cookie, quantities, price-change and free-shipping rules; Playwright for guest and signed-in carts, the drawer and page, quantities and limits, sold-out, stock problems, merge on sign-in, keyboard, no JavaScript, phones, API down; screenshots; status, QC guide, PROGRESS, boss doc.

**Out of scope:** checkout, coupons and shipping cost (S10); "move to wishlist" (S8); saved-for-later; reserving stock in the cart (the API deliberately doesn't).

## Design

- **Drawer:** slides in from the right (full width on phones), mint background, white line cards, a sticky footer with the subtotal and buttons. Focus moves into it; Escape and the backdrop close it (the S1 dialog).
- **Line:** photo · name (links to the product with that option chosen) · option · price (and struck list price on sale) · stepper · Remove · line total. A problem line has a soft red border and its message.
- **Header count:** a small gold circle on the bag icon; screen readers hear "Bag, 3 items".
- **References:** the gemeriahair.in and 1hairstop.in cart drawers (right-hand drawer, steppers, subtotal, free-shipping bar).
- **How it works:**
  - every change is a server action, so the forms work without JavaScript on the cart page; with JavaScript the drawer updates in place
  - the API (or the cookie for guests) is the only record of the cart
  - the header's count comes from a small display cookie updated on every change, so pages don't ask the API for the cart each time (open question 3)

## Files

```
src/app/(shop)/cart/page.tsx
src/components/cart/…                drawer, line, stepper, summary, add-to-bag
src/lib/cart/…                       guest cookie, rules (pure), server actions, API calls
src/components/product-page/…        Add to bag in the buying column
src/components/layout/header.tsx     the bag count and drawer
tests/unit/cart.test.ts, tests/e2e/cart.spec.ts, tests/e2e/cart.mobile.spec.ts
dev/status/…-phase-s7-…, dev/testing/…-phase-s7-…, dev/PROGRESS.md
```

Backend (B12, if approved): `nestjs-haircraft/src/modules/cart/` (controller, service, DTO), tests, README and PROGRESS.

## Testing

1. **Backend (B12):** preview matches `GET /cart` for the same lines; unknown, inactive and sold-out items; quantities and line limits; nothing is saved.
2. **Unit:** the guest cookie (read, write, limits, junk ignored); quantity bounds; price-change notes; the free-shipping line.
3. **Playwright (test API):**
   - guest: add from the product page, drawer opens with the right line and totals; quantities ±; the limit of 10; remove; empty state
   - sold-out button; asking for more than the stock; a line that becomes unavailable (the admin deactivates it)
   - sign in with a guest bag: lines merged, cookie cleared; register does the same
   - signed in: the bag persists across browsers (the API's cart)
   - header count; keyboard in the drawer; `/cart` without JavaScript; phones (full-width drawer); API down
4. **By eye:** drawer and cart page, with problems and empty, desktop and phone.

## Risks

- **Stock can change between adding and checkout:** the cart never promises stock (it shows the current state on every view); checkout (S10) reserves it.
- **Two tabs:** each change returns the whole cart, so a tab shows the latest after its next action or reload.
- **Cookie size:** 50 lines of ids and quantities fit well within a cookie's 4 KB.

## Open questions

1. **Pricing a guest's bag.** Recommended: **B12, a small backend endpoint** (`POST /cart/preview`) using the same rules as the signed-in cart: one call, identical messages, nothing duplicated. The alternative is the storefront rebuilding prices and stock from product pages: more calls, and only "sold out", not "limited quantity".
2. **Telling shoppers a price changed.** Recommended: **yes, remember the price seen when adding, on the shopper's device**, and show "Price changed from … to …" on the line. The alternative is showing only the current price (checkout in S10 checks prices anyway).
3. **The header's bag count.** Recommended: **a small display cookie updated with every cart change** (no API call per page). The alternative is asking the API on every page for signed-in shoppers: always exact, but a request on every page view (and against the shared rate limit).
4. **Quantity on the product page.** Recommended: **a stepper (1–10) beside Add to bag**, as on both references. The alternative is always adding one and changing it in the bag.
