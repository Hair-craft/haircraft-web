# Plan: Phase S6, sign-in and register

**Status: Approved (2026-10-06)** with the recommended options: `/sign-in` and `/register`; a "Forgot your password?" page saying to contact us until emails exist; end-to-end tests on their own API copy (port 3100) and database `hc_e2e`.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S1's session groundwork (cookie names and options; today everyone is a guest) and decision D2: **the API's tokens live only in httpOnly cookies set by the storefront's server, never in browser JavaScript.** The header's account icon goes to `/account`, which shows the 404 page today.

## Context

Customers need an account for checkout (S10), their orders (S12), wishlist (S8) and reviews (S13). This phase builds signing up, signing in and out, and keeping the session alive safely, so later phases only ask "who is this?".

**What the API offers** (all built):

- `POST /auth/register` (email, password, first name, optional last name and phone) and `POST /auth/login`: both return an access token (valid 15 minutes), a refresh token (7 days) and the user
- `POST /auth/refresh`: a **new** pair each time; reusing an old refresh token ends the session. Two refreshes within 10 seconds (a race between tabs or requests) are not treated as theft: the second simply fails.
- `POST /auth/logout` (this device) and `POST /auth/logout-all` (every device)
- clear errors: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED` (with minutes left), `ACCOUNT_SUSPENDED`, `EMAIL_ALREADY_REGISTERED`, field errors for weak passwords
- `GET /profile`: the signed-in customer

**What it doesn't offer:** password reset (it needs emails, which aren't built), see open question 2.

**Found while planning (the shared address again):**

- **Sign-in limit:** the API allows 10 sign-in/refresh/register requests a minute **per address**, and every shopper's comes from the storefront's server. In real use, 10 sign-ins a minute for the whole shop. This joins the S16 rate-limit item. The storefront will already forward the shopper's address and browser name (`X-Forwarded-For`, `User-Agent`), so the fix in S16 is only on the API side, and the API's "your devices" list shows real devices.
- **Tests:** the end-to-end tests would trip the 10-a-minute limit within one run (see open question 3).

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S6.1 Register** `/register`:
   - first name, last name (optional), email, mobile (optional, Indian numbers, stored as +91…), password with **Show**, and the rules shown as you type (8+ characters, a letter and a number)
   - on success the customer is signed in and goes back to where they were (`?next=`), or to their account
   - "An account with this email already exists" with a **Sign in instead** link
2. **S6.2 Sign in** `/sign-in`:
   - email and password (with **Show**); a link to register
   - friendly messages:
     - wrong details: "Incorrect email or password."
     - locked: "Too many attempts. Try again in N minutes."
     - suspended: "This account has been suspended. Please contact us."
     - rate limited: "Too many attempts from here. Please wait a minute."
   - returns to `?next=` (only addresses on this site, so a link can't send people elsewhere)
3. **S6.3 Session in the BFF:**
   - sign-in, register and sign-out are **server actions** (plain forms that work without JavaScript; Next checks they come from this site)
   - cookies:
     - `hc_at`: access token, httpOnly, lives 15 minutes
     - `hc_rt`: refresh token, httpOnly, 7 days (the refresh can happen before any page)
     - `hc_who`: first name and email for the header; httpOnly, display only, never trusted for access
   - **refresh:** when `hc_at` has run out and `hc_rt` is there, the storefront's `proxy.ts` refreshes once before the page renders, sets the new cookies, and lets the page see them. Refreshes are single-flight per server process (requests arriving together share one refresh). A lost race (the API's "second refresh" failure) keeps the newer cookies instead of signing the shopper out. A truly ended session (expired, signed out elsewhere, suspended) clears the cookies quietly: the shopper is a guest again.
   - the API calls made for a customer forward their address and browser name
4. **S6.4 Sign out:**
   - **Sign out** (this device) from the account menu and page
   - **Sign out everywhere** on the account page
   - both clear the cookies and return to the home page with a short "Signed out" note
5. **S6.5 Protected routes:**
   - `/account` and everything under it need a session; guests are sent to `/sign-in?next=…` and come back after signing in
   - signed-in customers visiting `/sign-in` or `/register` go to their account
   - **the account page itself is a simple placeholder** in S6 ("Hello Priya", email, sign out, sign out everywhere); the full account area is S9
6. **S6.6 Header:** the account icon shows the first letter of the name once signed in, opening a small menu (My account · Sign out); for guests it's **Sign in**.
7. **S6.7 Tests, click-through, docs:** unit tests for the cookie, refresh and `next` rules; Playwright for register, sign in, every error message, refresh (with a 15-minute token shortened for the test), races, sign-out, sign-out everywhere, protected routes, no JavaScript, keyboard, phones; screenshots; status, QC guide, PROGRESS, boss doc.

**Out of scope:** password reset (open question 2), signing in with Google or a phone OTP, email verification, editing the profile (S9 with B9), the guest cart merging on sign-in (S7).

## Design

- **Pages:** a centred card on the mint background: a serif heading ("Welcome back" / "Create your account"), labelled fields with errors under each field, a full-width dark button, and the link to the other page. The submit button shows a spinner and can't be pressed twice.
- **Accessibility:**
  - every field has a label and autocomplete hints (`email`, `current-password`, `new-password`, `given-name`, `tel`)
  - errors are announced and linked to their field
  - the first error gets the focus
- **References:** the sign-in and register pages of gemeriahair.in and 1hairstop.in (simple single-column forms).

## Files

```
src/app/(shop)/sign-in/page.tsx, src/app/(shop)/register/page.tsx, src/app/(shop)/account/page.tsx
src/lib/session/…                    cookies, getSession(), refresh (single-flight), server actions
src/proxy.ts                         refresh before render; account routes need a session
src/components/auth/…                forms, password field, account menu
tests/unit/session.test.ts, tests/e2e/auth.spec.ts, tests/e2e/auth.mobile.spec.ts
dev/status/…-phase-s6-…, dev/testing/…-phase-s6-…, dev/PROGRESS.md
```

## Testing

1. **Unit:** `next` addresses (only this site's paths; `//evil.com`, `https://…` and `/\evil` refused); cookie lifetimes and options; refresh decisions (refresh, keep on a race, clear on an ended session); the API's error codes to messages; the password rules matching the API's.
2. **Playwright (real API):**
   - register (and the duplicate email); sign in; every error message
   - the session surviving an expired access token (refreshed once, even with several requests at once)
   - sign out; sign out everywhere (another browser's session ends too)
   - protected routes and `next`; header menu by keyboard; no JavaScript (the forms still work); phones
   - cookies are httpOnly and never readable by page scripts
3. **By eye:** screenshots of both forms (empty, with errors), the header menu and the account placeholder, desktop and phone.

## Risks

- **Refresh races** across several server instances (on Vercel) can't share one in-memory lock. The API's 10-second race window makes the loser harmless, and the storefront keeps the winner's cookies.
- **Security:** tokens never reach browser JavaScript; forms are server actions (checked to come from this site); `next` is restricted to this site; cookies are `Secure` in production and `SameSite=Lax`.

## Open questions

1. **Where sign-in lives.** Recommended: **`/sign-in` and `/register`** (short, clear addresses). The alternative is `/account/sign-in` and `/account/register`.
2. **Forgot password.** Recommended: **a "Forgot your password?" link to a page that says to contact us for now**, until emails exist (the "Emails / SMS" backend phase, not yet scheduled). Then a real reset can be added. The alternative is no link until then.
3. **The end-to-end tests and the API's limits.** Recommended: **the tests start their own copy of the API (port 3100) with relaxed limits, using a separate test database `hc_e2e`** prepared once with the sample catalogue and reviews. The test accounts never touch your development data, and runs don't depend on the rate limit (this also removes the S5 retry note). You would run one setup command once (I'll write it); it needs the Postgres superuser password, like the earlier setup. The alternative is to run against your development API and database: test accounts accumulate there (tagged `@storefront-e2e.test`) and runs must pause to stay under the limit.
