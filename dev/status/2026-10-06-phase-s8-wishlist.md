# Status: Phase S8, wishlist

Tracks progress against [`plan/2026-10-06-phase-s8-wishlist.md`](../plan/2026-10-06-phase-s8-wishlist.md).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (S8.1–S8.5) is implemented, and verified by:

- **storefront:** typecheck, ESLint, Prettier and a production build, all clean; 107 unit tests (12 new) and 110 Playwright tests (12 new) against the test API, all passing
- **backend:** no changes (the wishlist API from backend phase 4 is used as it is)
- screenshots of the listing (guest and signed in), the guest panel, the product page, the wishlist page (full and empty), the account menu and a phone, reviewed by eye

Approved with the recommended options:

- a guest who presses a heart is asked to sign in, and the product is saved automatically afterwards
- filled hearts on cards for signed-in shoppers (one request per page)
- Move to bag goes straight in when one option is in stock, otherwise via the product page; either way the product leaves the wishlist once it is in the bag

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What was built

### S8.1 Heart toggle

- **Where:** a heart in the top-right corner of every product card photo, and beside the name on the product page (larger). It is a 44 px round button with a white circle behind it.
- **States:** an outline when not saved; gold and filled, with a small pop, when saved. Screen readers hear "Save Deep Wave Tape-ins to your wishlist" or "Remove … from your wishlist" and the pressed state.
- **On cards:** the heart is its own button next to the card's link, not inside it, so the card is still one keyboard stop and the heart the next.
- **Signed in:** the heart changes at once, the API confirms it, and a toast says "Saved … to your wishlist." If the API refuses, the heart goes back and the reason is shown, for example "Your wishlist can hold up to 200 products. Remove some first."
- **Guests:** a small panel, "Save your favourites", with **Sign in** and **Create an account**. The product is remembered for 30 minutes in an httpOnly cookie and saved as soon as they sign in or register; they come back to the same page.
- **Without JavaScript** the heart is a real form:
  - a guest goes to sign in and then back to the page, with the product saved
  - a customer comes back to the same page with it saved

### S8.2 Filled hearts and header count

- For signed-in shoppers the page asks once for the saved product ids after it loads, and the hearts fill in. Guests cost no request.
- The header's heart shows a gold count ("Wishlist, 3 items"), from a small display cookie kept up to date by every change. On phones the header has no room for it, so the menu has **My wishlist** instead.
- The account menu has **My wishlist** too.
- Signing out (on this device or everywhere) clears the count and any pending save.

### S8.3 Wishlist page

- **`/wishlist`** needs signing in; guests are sent to sign in and come back.
- **The page:** "My wishlist (N)", the product grid, and under each card **Move to bag** (or a disabled **Sold out**) and **Remove**. The buttons line up across a row.
- **A product no longer sold** stays, faded, as "No longer available", with only **Remove**.
- **When the list is empty:** "Nothing saved yet" with **Shop all**.
- **If the session has ended**, it goes through sign-in again. If the API is down, the page shows "We'll be right back".

### S8.4 Move to bag

- **One option in stock:** that option goes in the bag, the bag drawer opens, and the product leaves the wishlist.
- **Several options in stock:** it opens the product page to choose. Once Add to bag works there, the product leaves the wishlist. The page remembers this for the tab only, so adding the same product later from elsewhere doesn't remove it.
- **No option in stock:** "Sold out".
- **Problems** (stock, the 10-per-item limit, unavailable) use the bag's own messages.

## Problems found and fixed

1. **The heading count went stale:** "My wishlist (3)" was drawn on the server and didn't drop after Remove. It now follows what's left on the page.
2. **Uneven buttons:** a card with a star rating pushed its Move to bag lower than its neighbours (found by eye). The buttons now sit at the bottom of each card.
3. **Hearts were 40 px**, below the plan's 44 px for phones. They are now 44 px, and the phone test checks it.

Test fixes (not app fixes): the "no longer sold" test first tried to set a live product back to Draft, which the API doesn't allow; it uses Inactive, as staff would.

## Known and accepted

- **Without JavaScript the heart always saves** (pressing it again doesn't remove). Showing filled hearts needs the saved ids, which are fetched by the page's script. Removing works on the wishlist page with JavaScript.
- **Filled hearts appear a moment after the page** for signed-in shoppers (the one request), as approved.
- **Two tabs** each show the latest state after their next action or reload.
- **Server log noise in the test run:** once in the full suite, the storefront logged "The destination stream closed early". This happens when a test moves on while a page is still streaming. It didn't reproduce when the wishlist or cart tests ran alone, and no test failed.

## Not done / follow-ups

- "Save for later" from the bag to the wishlist was not in the plan; it can be added with S10 if wanted.
