# Status: Phase S7, cart

Tracks progress against [`plan/2026-10-06-phase-s7-cart.md`](../plan/2026-10-06-phase-s7-cart.md).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (B12 and S7.1–S7.6) is implemented, and verified by:

- **storefront:** typecheck, ESLint, Prettier and a production build, all clean; 95 unit tests (12 new) and 98 Playwright tests (12 new) against the test API, all passing
- **backend (B12):** 310 unit and 273 e2e tests (4 new), all passing
- screenshots of the product page, the drawer, the cart page (with a problem and a price change) and a phone, reviewed by eye

Approved with the recommended options:

- B12 `POST /cart/preview` for guest bags
- price-change notes remembered on the shopper's device
- a display cookie for the header count
- a 1–10 quantity stepper on the product page

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What was built

### B12 (backend) Guest cart preview

- **The endpoint:** `POST /cart/preview` (public) takes up to 50 `{variantId, quantity}` lines. It returns exactly what `GET /cart` returns for the same lines (tested side by side): current prices, availability and messages, item count, subtotal, `readyForCheckout`.
- **Rules:** nothing is saved; repeated items become one line (at most 10); variants that no longer exist are left out; line ids are the variant ids.
- **One source of truth:** the cart's SQL for a line and its row-to-line mapping are now shared by the cart and the preview.
- **Its own controller:** it is a separate, public controller, because the rest of the cart controller requires a signed-in customer.

### S7.1 Add to bag

- **On the product page:** a − 1 + stepper (1–10) and **Add to bag**, in place of "Ordering opens soon". Adding opens the drawer.
- **Sold-out options:** a disabled **Sold out** button.
- **Problems** are shown by the button and nothing is added:
  - "Only a limited quantity of this item is available."
  - "You can have at most 10 of one item in your bag."
  - "This item is no longer available."
- **Without JavaScript** it is a real form that goes to the cart page.

### S7.2 Drawer and page

- **The header's bag:** a gold count badge, read out as "Bag, 3 items". It opens the **drawer** from the right; without JavaScript it is a link to `/cart`.
- **The drawer:** "Your bag (N)", the free-shipping line with a bar, the lines, the subtotal, "Shipping and taxes are worked out at checkout.", **View bag**, and **Checkout** (disabled: "Checkout opens soon.").
- **`/cart`:** the lines in a larger layout and a summary card; "Your bag is empty" with **Shop all** when empty.
- **Each line:** photo, name (linking to the product with that option chosen), option, line total, "each" price and struck list price when on sale, − / + and **Remove**.

### S7.3 Quantities

- − / + change a line at once (− at 1 removes it), from 1 to 10.
- Raising beyond the stock is refused (the line keeps its quantity) with the API's message.

### S7.4 Cart problems

- **Problem lines:** a line short of stock or no longer sold gets a red outline and the API's message; a banner says "1 item needs your attention before checkout"; **Checkout** stays held.
- **Price changes:** the price seen when adding is remembered on the shopper's device, so a line shows "Price changed from ₹6,899 to ₹6,399" when it differs.

### S7.5 Guest bag and merge

- **Guests:** the bag is an httpOnly cookie of variant ids and quantities (at most 50 lines), priced through B12. Adding is only saved if the API's preview says it's fine (the same rules as a signed-in cart), and items the API no longer knows are dropped from the cookie.
- **On sign-in or registration:** the guest bag joins the account's (`POST /cart/merge`) and the cookie is cleared. If anything couldn't be added, a note says so.
- **Signed in:** the bag is the account's, the same in every browser (tested).
- **Signing out:** leaves an empty guest bag.
- **Header count:** a small display cookie updated with every change, so pages don't ask the API for the bag.

## Problems found and fixed

1. **A text-injection hole** (caught while writing it): the plan was to send the cart page problems as text in the address (`/cart?problem=…`), which would let anyone craft a link that makes HairCraft's page say anything ("Call this number…"). The address now carries only a short code (`?problem=limited`) and the page shows the shop's own words for known codes. A test checks that free text is never shown.
2. **A crash from that check:** `?problem=constructor` passed a plain "is this a known code" test (built-in names count) and would have tried to show a function. It now uses an own-property check; tested.
3. **The header count stayed stale after signing out.** The shared cart took the count only on first load. It now follows the server's count after signing in or out. The first version of that fix also discarded the bag after every add (the drawer stuck on "Loading your bag"); it now resets only when the server's count differs from what the page shows.
4. **The single-device sign-out didn't clear the bag.** A text replacement missed it (the line had been reformatted); found by checking the count of changes.

Test fixes (not app fixes): tests looked for texts that the (closed) drawer also contains; the "at most 10" test needed stock for ten; the API-down test needed a guest bag with an item (an empty bag needs no API); older tests named the "Cart" icon and a single "Sold out" text.

## Changed from the plan

- **The drawer on phones** covers 88% of the width instead of all of it, leaving a sliver of the page visible (it reads more clearly as a panel that closes).

## Known and accepted

- **Stock is never reserved by the bag**, as designed in the backend: a bag shows the current state on every view, and checkout (S10) reserves it.
- **Two tabs** each show the latest bag after their next action or reload.
- **The test catalogue's stock:** cart tests set an option's stock with the admin API and set it back to 50 afterwards (the test database only).

## Not done / follow-ups

- Checkout, coupons and the real shipping cost (S10).
- "Move to wishlist" (S8).
