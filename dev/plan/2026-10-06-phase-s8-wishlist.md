# Plan: Phase S8, wishlist

**Status: Approved (2026-10-06)** with the recommended options: guests are asked to sign in and the product is saved automatically afterwards; filled hearts on cards for signed-in shoppers (one request per page load); move to bag directly when one option is in stock, otherwise via the product page, leaving the wishlist once in the bag.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S6 (accounts) and S7 (the bag). The header's heart icon goes to `/wishlist`, which shows the 404 page today.

## Context

Shoppers save hair they like to decide later, and move it to the bag when ready. The wishlist is a reason to create an account, so it should be easy to save from anywhere and easy to buy from.

**What the API offers** (built):

- `GET /wishlist`, `POST /wishlist/items` (save), `DELETE /wishlist/items/:productId` (remove), for signed-in customers only
- it saves **products**, not options (a length or colour is chosen when buying)
- saving twice changes nothing; at most 200 products
- a product no longer sold stays in the list as "no longer available", so the customer sees why it went

**What it doesn't offer:** a wishlist for guests. There is no guest wishlist to merge (unlike the bag), so open question 1 decides what a guest's heart does.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S8.1 Heart toggle:**
   - a heart on every product card (shop, search, home, related products) and beside the product name on the product page
   - press to save (it fills in gold) or remove; screen readers hear "Save Silky Tape-ins to your wishlist" / "Remove … from your wishlist", with `aria-pressed`
   - it changes at once and goes back if the API refuses (e.g. the 200 limit, with a message)
   - **guests** (open question 1): a small panel "Save your favourites: sign in or create an account", and the product is saved automatically once they have
2. **S8.2 Knowing which hearts are filled** (open question 2): for signed-in shoppers the page asks once for the saved product ids after loading and fills the hearts; the header shows the count on the heart icon.
3. **S8.3 Wishlist page** `/wishlist` (signed in; guests go to sign in and come back):
   - "My wishlist (N)", most recently saved first, as product cards with **Remove** and **Move to bag**
   - products no longer sold: shown faded with "No longer available" and **Remove**
   - empty: "Nothing saved yet", with a link to shop
   - a **Wishlist** link in the account menu and the phone menu (the header heart is hidden on phones)
4. **S8.4 Move to bag** (open question 3):
   - a product with **one option in stock** goes straight to the bag and leaves the wishlist (the drawer opens)
   - a product with **several options** opens its page to choose; once added to the bag from there, it leaves the wishlist
   - sold-out products show "Sold out" instead
5. **S8.5 Tests, click-through, docs:** unit tests for the heart and move rules; Playwright for saving from cards and the product page (signed in and as a guest, then signing in), the wishlist page, removing, moving to the bag (one option and several), unavailable products, keyboard, no JavaScript, phones, API down; screenshots; status, QC guide, PROGRESS, boss doc.

**Out of scope:** sharing a wishlist, price-drop or back-in-stock alerts (they need emails), several lists.

## Design

- **Heart:** an outline heart in the top-right corner of each card photo (a white circle behind it); gold and filled when saved, with a gentle pop; 44 px to tap on phones.
- **Wishlist page:** the S3 product grid, each card with **Move to bag** (dark) and **Remove** (text) underneath.
- **References:** the gemeriahair.in and 1hairstop.in wishlist hearts and pages.
- **How it works:**
  - saving and removing are server actions; without JavaScript the heart is a form (a guest's goes to sign in)
  - the API is the only record
  - the header count is a small display cookie, like the bag's

## Files

```
src/app/(shop)/wishlist/page.tsx
src/components/wishlist/…            heart, guest panel, wishlist page parts
src/lib/wishlist/…                   API calls, server actions, rules (pure)
src/components/product/product-card.tsx, src/components/product-page/…   hearts
src/proxy.ts                         /wishlist needs a session
tests/unit/wishlist.test.ts, tests/e2e/wishlist.spec.ts, tests/e2e/wishlist.mobile.spec.ts
dev/status/…-phase-s8-…, dev/testing/…-phase-s8-…, dev/PROGRESS.md
```

## Testing

1. **Unit:** which option "move to bag" picks (one in stock → direct; several → product page; none → sold out); the saved-after-sign-in rule; heart labels; the API's errors (including the 200 limit) as messages.
2. **Playwright (test API):**
   - signed in: save from a card and from the product page; the hearts stay filled across pages; remove; the count
   - guest: the panel, sign in, the product is saved
   - wishlist page: order, remove, move to bag (both cases), unavailable products, empty state
   - (the 200-product limit can't be reached with the 6-product test catalogue: its message is unit-tested, and the backend's own tests cover the limit)
   - keyboard; no JavaScript; phones (menu link, cards); API down
3. **By eye:** cards with hearts, the guest panel, the wishlist page (with an unavailable product), desktop and phone.

## Risks

- **Hearts on cards need the saved ids:** asked once per page load for signed-in shoppers (one small request), never for guests.
- **A wishlist of products, a bag of options:** "move to bag" asks for the option when there's a real choice, rather than guessing.

## Open questions

1. **A guest presses a heart.** Recommended: **a small panel asking them to sign in or create an account, and the product is saved automatically afterwards** (no guest wishlist to keep or merge). The alternative is a guest wishlist kept in a cookie and merged at sign-in (one request per product, as the API has no merge for wishlists).
2. **Filled hearts on product cards.** Recommended: **yes: for signed-in shoppers the page asks once for the saved ids after loading**, so hearts fill in a moment after the page appears. The alternative is hearts only on the product page and the wishlist page (no extra request).
3. **Move to bag.** Recommended: **straight to the bag when only one option is in stock; otherwise open the product page to choose**, and in both cases it leaves the wishlist once in the bag. The alternative is "Add to bag" that keeps it saved too.
