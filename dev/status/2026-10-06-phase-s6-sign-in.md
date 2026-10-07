# Status: Phase S6, sign-in and register

Tracks progress against [`plan/2026-10-06-phase-s6-sign-in.md`](../plan/2026-10-06-phase-s6-sign-in.md).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (S6.1–S6.7) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 83 unit tests (14 new) and 86 Playwright tests (14 new), all passing; no backend changes
- the new end-to-end setup: the tests now run against their own API (port 3100) and database (`hc_e2e`)
- screenshots of sign-in (with an error), register (with errors), the account menu and page, and a phone, reviewed by eye

Approved with the recommended options:

- `/sign-in` and `/register`
- a "Forgot your password?" page that says to contact us until emails exist
- end-to-end tests on their own API copy and test database

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What was built

### S6.1 Register `/register`

- **Fields:**
  - first name and last name (the last name optional)
  - email
  - mobile, optional: any usual Indian way of typing it ("98765 43210", "+91 98765-43210", "098…") is stored as +91 and 10 digits
  - password with **Show**
- **Rules while typing:** the password rules (8 characters, a letter, a number: the same as the API's, any script) tick off as you type.
- **Problems:** shown under each field, with a message at the top, and the focus moves to the first problem. What was typed is kept, except that the password has to be retyped only if you change it.
- **Duplicate email:** "An account with this email already exists." with **Sign in instead**.
- **On success:** signed in, then back to where the shopper was going (`?next=`), or their account.

### S6.2 Sign in `/sign-in`

- Email and password (with **Show**), "Forgot your password?", and a link to register.
- **Messages:**
  - "Incorrect email or password."
  - "Too many attempts. Please try again in N minutes." (a locked account)
  - "This account has been suspended. Please contact us."
  - "Too many attempts from here. Please wait a minute and try again." (the rate limit)
- **Return address:** `?next=` returns the shopper to where they were. Only addresses on this site are allowed, so a link can't send people elsewhere ("//evil.com", "https://…" and similar are ignored).
- **`/forgot-password`:** says to contact us from the account's email for now (the contact page itself comes in S14).

### S6.3 Session in the BFF

- **Server actions:** sign-in, register and sign-out are plain forms posting to server actions, so they work without JavaScript, and Next checks they come from this site.
- **Cookies** (httpOnly, `SameSite=Lax`, `Secure` in production):
  - `hc_at`: the access token, for 30 seconds less than the token's 15 minutes
  - `hc_rt`: the refresh token, for its 7 days
  - `hc_who`: the first name and email for the header; display only, never trusted for access
  - Page scripts can read none of them (tested).
- **Renewal:** when `hc_at` has run out, `proxy.ts` renews the session once before the page renders and hands the new cookies to the page and the browser. Requests arriving together share one renewal (tested with 5 at once).
- **When a renewal fails:**
  - **lost a race:** the API answers it exactly like an expired token, so the cookies are left alone (clearing them could delete the winner's new ones), and that one request continues as a guest
  - **certainly ended** (token reused, account suspended): the cookies are cleared
  - **API unreachable:** nothing changes
- **Forwarding:** the shopper's address and browser name go to the API with each sign-in, so its device list is right, and so the S16 rate-limit fix is API-side only.

### S6.4 Sign out

- **This device:** "Sign out" in the menu or on the account page. The API ends the session (its refresh token stops working, tested); a note says "You're signed out."
- **Everywhere:** "Sign out on all devices". Another browser's session ends at once (tested with two browsers), and the note says so only when the API confirmed it.

### S6.5 Protected routes

- `/account` and everything under it need a session; guests go to `/sign-in?next=…` and come back after signing in.
- Signed-in shoppers visiting `/sign-in` or `/register` go to their account (or `next`).
- If the API stops accepting a session mid-visit (signed out elsewhere, suspended), the account page ends it via `/bff/session/end` and asks the shopper to sign in again: "Your session has ended."
- **The account page** is the planned placeholder: "Hello, Priya", name, email, mobile, and both sign-out buttons. The full account area is S9.

### S6.6 Header

- **Guests:** the person icon is a **Sign in** link.
- **Signed in:** a dark circle with the first letter of the name, opening a small menu (Hello, Priya · My account · Sign out). It works by keyboard (Enter opens with the focus on the first item; Escape closes and returns the focus) and closes on a click outside.

### End-to-end test setup (open question 3)

- **The API copy:** Playwright compiles the backend into `dist-e2e` (so it never clashes with your running `nest start --watch`) and starts it on port 3100, with:
  - the `hc_e2e` database
  - relaxed rate limits
  - a 3-attempt lockout (so that test is short)
- **The database:** `scripts/setup-e2e-db.ps1` prepares `hc_e2e` (migrations, sample accounts and catalogue, local photos); it has been run once.
- **The effect:** all specs now use the test API. Test accounts never reach the development database, and runs no longer depend on the rate limit (the S5 "wait and retry" note no longer applies).

## Problems found and fixed

1. **A suspended customer would have hit the error page.** The API answers a suspended account's requests with 403 `ACCOUNT_SUSPENDED`, not the 401 of an ended session. The account page now treats both as an ended session.
2. **"Signed out on all devices" could have been claimed without being true** when the API couldn't be reached. It now says so only when the API confirmed it.
3. **The "You're signed out" note never appeared.** The note component read its cookie only when it first appeared, but signing out redirects within the already-loaded page. The layout now reads the note on the server and passes it in.
4. **Setting up the test API took four fixes:**
   - the backend caps the sign-in limit at 10,000
   - the compiler read its own previous output back in, so `dist-e2e` is now deleted before each compile
   - Windows PowerShell treated npm's warnings as fatal in the setup script
   - the backend's `dist` folder is shared with `nest start --watch`, hence the separate `dist-e2e`
5. **The tests waited for the wrong thing:** a password label ("Password*") and sign-ins that hadn't finished before the next step. These were test fixes, not app fixes.

## Known and accepted

- **The test API's settings differ from yours:** it uses a 3-attempt lockout and relaxed rate limits; your API keeps its real settings (10 attempts, 10 sign-ins a minute per address).
- **Shared sign-in limit (S16):** until the API trusts the storefront, all shoppers' sign-ins count against one 10-a-minute allowance. Tracked with the other rate-limit item.
- **Dead refresh tokens linger:** after a lost race, or a session ended elsewhere, the browser keeps a refresh token the API refuses. The shopper is simply a guest; the server remembers the refusal for 10 minutes so it isn't retried on every page, and the cookie expires by itself.
- **"destination stream closed early" in the test log:** the server noting that a test navigated away mid-response; harmless.

## Not done / follow-ups

- Password reset, email verification, Google or OTP sign-in (need emails/SMS; not scheduled).
- Editing the profile and changing the password (S9, with backend B9).
- The guest cart merging on sign-in (S7).
