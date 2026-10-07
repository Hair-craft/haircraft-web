# Status: Phase S9, My account

Tracks progress against [`plan/2026-10-07-phase-s9-my-account.md`](../plan/2026-10-07-phase-s9-my-account.md).

## 2026-10-07: implemented and verified

**Result: done.** Every in-scope item (S9.1–S9.6) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 122 unit tests (15 new) and 122 Playwright tests (12 new) against the test API, all passing
- **backend:** no changes (it uses B9's `PATCH /profile`)
- screenshots reviewed by eye:
  - the overview
  - the profile with an error and once saved
  - the address book and the delete question
  - the address form with errors
  - the security page
  - the overview and address book on a phone

Approved with the recommended options:

- separate pages with a shared menu
- no PIN-code look-up for now
- address labels Home, Work and Other (Other takes a typed label)

---

## What was built

### S9.1 Account layout

- **The pages:**
  - `/account` (overview)
  - `/account/profile`
  - `/account/addresses`, with `/account/addresses/new` and `/account/addresses/:id` for the form
  - `/account/security`
- **The menu:**
  - Overview, Profile, Addresses, Password and security, My wishlist, and My orders (marked "coming soon" until S12)
  - on computers, a column with **Sign out** under it; on phones, a row of tabs that scrolls sideways
  - the current page is marked, for screen readers too
- **Access:** guests are sent to sign in and come back. A session the API no longer accepts ends and comes back after signing in. If the API is down, each page shows "We'll be right back".

### S9.2 Overview

- "Hello, Meera", then four cards:
  - profile (name, email, mobile)
  - the default address
  - the wishlist count
  - orders ("will appear here soon")
- Each card links to its page. **Sign out** sits under the cards on phones; on computers it's in the menu.

### S9.3 Profile

- **Fields:** first name, last name and mobile (10 digits, e.g. 98765 43210, saved as +91…). The last name and mobile can be cleared.
- **Email:** shown read-only, with "To change your email, please contact us" (decided in B9).
- **After saving:** "Your details are saved." The header's account button greets the new name at once.

### S9.4 Address book

- **The cards:** label, a gold **Default** badge (the default comes first), name, address lines ("Near …" for a landmark), and the mobile shown the local way. Each card has **Edit**, **Make default** and **Delete**.
- **The form:**
  - label chips Home, Work and Other (Other shows "Your label"; a CSS rule, so it also works without JavaScript)
  - full name, mobile, flat/house/street, area, landmark
  - town or city, State (a list of the 36 states and union territories), PIN code
  - "Make this my default address"
  - "Your first address becomes your default" when it's the first one
- **Checks:** every field is checked in the shop's words before sending, and again by the API.
- **Delete** asks first ("Delete this address?"). For the default address it adds that another one becomes the default.
- **Notes** after each change: "Address added.", "Address saved.", "Default address changed.", "Address deleted.".
- **Limit:** at 20 addresses, "Add address" is replaced by an explanation.
- **Unknown addresses:** an address that no longer exists is explained (the address bar carries only a code, never text).
- **Checkout (S10):** the form takes a "back" page and the first-address flag, so checkout can reuse it.

### S9.5 Password and security

- **Change password:**
  - current, new (with the strength rules ticked off while typing) and confirm
  - wrong current password, weak, unchanged or unconfirmed passwords are explained
  - on success: "Password changed. You've been signed out on your other devices." This browser keeps its fresh session (tested: another browser is signed out, the new password works and the old one doesn't).
- **Sign out on all devices** moved here from the old account page, with a short explanation.

## Problems found and fixed

1. **The State list emptied after a failed submit:** React resets a form after its action, and a `<select>` ignores a new default value. It now starts afresh with the typed value.
2. **The phone layout was 794 px wide:** the row of tabs stretched the page's grid. The grid columns can no longer grow beyond the screen.
3. **Deleting from the confirmation did nothing:** the button showed its spinner (and so became disabled) before the browser sent the form. The dialog now sends the form first.
4. **Two "Sign out" buttons on computers** (the menu's and the overview's). The overview's now shows on phones only.

Test fixes (not app fixes):

- address cards are counted in their own list (the account menu is a list too)
- the S6 tests expected the old page's raw "+91…" mobile and its "Sign out on all devices" button

## Known and accepted

- **Without JavaScript, Delete doesn't ask first** (the question is a dialog). It deletes straight away.
- **"Contact us"** links to the contact page, which comes with S14 (as on Forgot password).
- **Server log noise:** "The destination stream closed early" appears now and then in full test runs. Chrome stops a page that was still streaming when a test moves on. No test fails, and it doesn't reproduce in any single test.
- **One full run** hit `net::ERR_NETWORK_IO_SUSPENDED` (the computer briefly paused the network). That test and the full suite passed when run again.

## Not done / follow-ups

- My orders (S12).
- City and state from the PIN code (with S10 or later).
- Deleting the account (no API; via Contact us for now).
