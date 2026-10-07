# Plan: Phase S9, My account

**Status: Approved (2026-10-07)** with the recommended options: separate account pages with a shared menu; no PIN-code look-up for now; address labels Home, Work and Other (Other takes a typed label).

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S6 (sign-in, and the placeholder account page) and B9 (editing one's profile). Orders join the account area in S12.

## Context

Today `/account` shows the customer's name, email and phone, with Sign out and Sign out on all devices, and says "Your orders, addresses and profile settings will appear here soon". S9 turns it into the real account area, ready for checkout (S10), which picks from the saved addresses.

**What the API offers** (all built):

- **profile:** `GET /profile` and `PATCH /profile` (first name, last name, phone; B9)
- **password:** `POST /auth/change-password`
  - needs the current password
  - signs out every other device
  - returns a fresh session for this one
- **sign out everywhere:** `POST /auth/logout-all`
- **addresses:** `GET`, `POST`, `PATCH`, `DELETE /addresses`
  - up to 20 per account
  - the first one is the default; a "make default" flag; deleting the default promotes another
  - rules: Indian mobile, a 6-digit PIN code, one of India's 36 states and union territories; label (Home, Work…), name, two address lines, landmark, city

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S9.1 Account layout** (open question 1):
   - pages:
     - `/account`: overview
     - `/account/profile`
     - `/account/addresses`
     - `/account/security`
   - a side menu on computers and tabs on phones, with My orders ("coming soon", until S12) and My wishlist
   - all of them need signing in (`proxy.ts` already covers `/account/*`)
2. **S9.2 Overview:**
   - "Hello, Meera"
   - cards for profile, default address, wishlist count and orders (coming soon), each linking to its page
3. **S9.3 Profile:**
   - edit first name, last name and mobile (10-digit Indian, as at registration; stored as +91…)
   - the email is shown read-only, with "Contact us to change your email"
   - after saving, a note says so and the name in the header updates at once (the display cookie is renewed)
4. **S9.4 Address book:**
   - the saved addresses as cards, the default one first and marked
   - **Add address**, **Edit**, **Make default** and **Delete** (asks first)
   - a form with the API's fields: the state as a list of the 36 states and union territories, and the PIN code and mobile checked as you type and again by the API
   - the 20-address limit explained when reached
   - an empty state: "No saved addresses yet"
   - the form is built to be reused by checkout in S10
5. **S9.5 Password and security:**
   - **change password:** current password, new password (the same strength rules and meter as registration) and confirmation
     - afterwards: "Password changed. You've been signed out on your other devices."
     - this device stays signed in with the fresh session
   - **sign out on all devices**, moved here from the overview, with a short explanation
6. **S9.6 Tests, click-through, docs:**
   - unit tests for the form rules
   - Playwright, listed under Testing
   - screenshots
   - status, QC guide, PROGRESS, boss doc

**Out of scope:**

- changing the email (decided in B9)
- deleting the account (no API; a request through Contact us for now)
- order history (S12)
- PIN-code look-up of the city and state (open question 2)

## Design

- **Layout:** the account pages share a frame:
  - a small "My account" heading over a two-column layout on computers (menu left, page right)
  - a scrollable row of tabs under the heading on phones
  - forms in the white rounded cards used for sign-in
- **References:** the account areas of gemeriahair.in and 1hairstop.in for order and wording, kept in HairCraft's style.
- **How it works:**
  - each form is a real form posting to a server action, so it works without JavaScript; with JavaScript it shows errors without a reload
  - field errors come from the API's own messages, in plain sentences, as on the sign-in pages
  - a session that has ended mid-form goes through sign-in and comes back

## Files

```
src/app/(shop)/account/layout.tsx, page.tsx, profile/page.tsx, addresses/page.tsx, security/page.tsx
src/components/account/…             menu, cards, profile form, address card and form, password form
src/lib/account/…                    API calls, server actions, rules (pure: states list, PIN, mobile, form checks)
src/lib/session/cookies.ts           renew the display name after a profile change
tests/unit/account.test.ts, tests/e2e/account.spec.ts, tests/e2e/account.mobile.spec.ts
tests/e2e/auth.spec.ts               the placeholder account page's texts change
dev/status/…-phase-s9-…, dev/testing/…-phase-s9-…, dev/PROGRESS.md
```

## Testing

1. **Unit:**
   - the states list (36, matching the API's)
   - PIN and mobile checks
   - the address and password forms' checks
   - the API's errors as messages, including the 20-address limit
2. **Playwright (test API):**
   - profile: edit and clear, the header name updates, bad values
   - addresses: add (the first becomes the default), add a second as default, edit, make default, delete (the default moves), empty state, bad PIN and mobile
   - password:
     - a wrong current password and a weak new one are refused
     - a successful change keeps this browser signed in and signs another one out; the new password works
   - sign out on all devices
   - guests are sent to sign in
   - keyboard; no JavaScript (profile and address forms); phones (tabs, forms fit); API down
3. **By eye:** each page on a computer and a phone, with errors showing.

## Risks

- **The states list is copied** from the API, which has no endpoint for it. A unit test pins the 36 names, and the API still checks every address.
- **Changing the password replaces this browser's session:** the new tokens are saved before the page reloads, so the shopper isn't signed out.

## Open questions

1. **One page or several.** Recommended: **separate pages** (overview, profile, addresses, security) with a shared menu. Each stays short on a phone, and My orders (S12) slots in as one more page. The alternative is a single long account page with sections.
2. **Filling in city and state from the PIN code.** Recommended: **not now**: shoppers type the city and pick the state. A look-up needs an outside service (India Post's public API isn't dependable, and the paid ones need an account). It can come with checkout (S10) or later. The alternative is adding the look-up now, filling the fields as a suggestion when it answers.
3. **Address labels.** Recommended: **quick choices "Home", "Work" and "Other"** (Other lets them type a label, up to 30 characters). The alternative is a free-text label only.
