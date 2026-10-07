# Testing: Phase S6, sign-in and register

Pairs with [`plan`](../plan/2026-10-06-phase-s6-sign-in.md) and [`status`](../status/2026-10-06-phase-s6-sign-in.md).

**What this phase delivers:**

- creating an account and signing in and out (on one device or all)
- staying signed in safely
- account pages that need a session, and the header's account menu

The account page is a simple placeholder; the full account area comes in S9.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar). Use made-up email addresses such as `qc.test1@example.com`; they go into your development database (step 0).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`).
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`, then `npm install` and `npm run dev`.
3. **Open <http://localhost:3001>.**

## A. Register

1. **Click the person icon in the header.** **Expected:** the **Sign in** page ("Welcome back").
2. **Click "Create an account".** **Expected:** "Create your account" with First name, Last name, Email, Mobile number (optional) and Password.
3. **Press Create account with everything empty.**
   - **Expected:** "Please check the details below." at the top, a red message under First name and Email, and the cursor in First name.
4. **Type a mobile number "12345" and a password "abc1".**
   - **Expected:** under Mobile, "Enter a 10-digit Indian mobile number…"; under Password, the rules (✓ A letter, ✓ A number, ○ At least 8 characters) and "Use at least 8 characters."
5. **Fill in properly** (mobile `98765 43210`, password `Silky2026!`) and press Create account.
   - **Expected:** "Hello, <first name>" with your email and `+919876543210`; in the header, a dark circle with your first letter.
6. **Sign out, then register again with the same email.** **Expected:** "An account with this email already exists." and a **Sign in instead** link.

## B. Sign in

7. **On Sign in, use the wrong password.** **Expected:** "Incorrect email or password."; the email is still filled in.
8. **Press Show.** **Expected:** the password becomes readable; Hide hides it again.
9. **Sign in correctly.** **Expected:** your account page.
10. **While signed out, open <http://localhost:3001/account/orders>.**
    - **Expected:** the sign-in page; after signing in you land on `/account/orders` (404 until S12, which is fine).
11. **Lockout:** with another test account, enter a wrong password 10 times (your API's setting).
    - **Expected:** "Too many attempts. Please try again in N minutes." Even the right password is refused until then.
12. **"Forgot your password?"** **Expected:** a page saying to contact us for now.

## C. Staying signed in

13. **Sign in, wait 16 minutes** (or delete the `hc_at` cookie: F12 → Application → Cookies), **then reload.**
    - **Expected:** still signed in; a new `hc_at` cookie appears.
14. **Cookies** (F12 → Application → Cookies → localhost:3001):
    - **Expected:** `hc_at`, `hc_rt` and `hc_who` all have **HttpOnly** ticked.
    - In the Console, `document.cookie` doesn't show them.
15. **While signed in, open `/sign-in`.** **Expected:** you're sent to your account.

## D. Signing out

16. **Header circle → menu.**
    - **Expected:** "Hello, <name>", **My account**, **Sign out**.
    - **Keyboard:** Tab to the circle, Enter opens it with "My account" focused; Escape closes it.
17. **Sign out.**
    - **Expected:** the home page with "You're signed out."; the person icon is **Sign in** again.
    - `/account` now asks you to sign in.
18. **Everywhere:**
    - Sign in in two browsers (or a normal and a private window). In one, press **Sign out on all devices**. **Expected:** "You're signed out on all your devices."
    - Reload the account page in the other. **Expected:** "Your session has ended. Please sign in again."
19. **Suspended:** in the admin panel, suspend the test customer, then reload their account page.
    - **Expected:** "Your session has ended…"; signing in says "This account has been suspended. Please contact us." Reactivate them afterwards.

## E. Special cases

20. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** registering, signing in (including the wrong-password message) and signing out all work. Re-enable JavaScript.
21. **Phone:** register and sign in. **Expected:** the forms fit the screen, and the keyboard suggests email and phone layouts in the right fields.
22. **API down:** stop the API and try to sign in. **Expected:** "We can't reach the shop at the moment…", no error page.

## F. Automated checks

23. **One-time setup** (if not done yet; needs the Postgres superuser file):
    ```powershell
    powershell -ExecutionPolicy Bypass -File scripts\setup-e2e-db.ps1
    ```
    - **Expected:** it ends with "Done: hc_e2e is ready".
24. **In `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 83 unit tests and 86 end-to-end tests pass. The tests start their own API on port 3100; yours can keep running.

## Results

| #     | Check                  | Expected                                           | Result (Pass/Fail) | Notes |
| ----- | ---------------------- | -------------------------------------------------- | ------------------ | ----- |
| 1–2   | Pages                  | Sign in; Create your account                       |                    |       |
| 3–4   | Register problems      | messages under fields, focus, password rules       |                    |       |
| 5     | Register               | signed in, account page, +91 number, header circle |                    |       |
| 6     | Duplicate email        | message and Sign in instead                        |                    |       |
| 7–9   | Sign in                | wrong password message, Show, success              |                    |       |
| 10    | Return address         | back to /account/orders                            |                    |       |
| 11    | Lockout                | "Too many attempts… N minutes"                     |                    |       |
| 12    | Forgot password        | contact page                                       |                    |       |
| 13    | Renewal                | still signed in after the access cookie runs out   |                    |       |
| 14    | Cookies                | HttpOnly, invisible to scripts                     |                    |       |
| 15    | Sign-in when signed in | sent to account                                    |                    |       |
| 16    | Menu                   | items; keyboard                                    |                    |       |
| 17    | Sign out               | note, guest again                                  |                    |       |
| 18    | Everywhere             | other browser's session ends                       |                    |       |
| 19    | Suspended              | session ends; suspended message                    |                    |       |
| 20    | No JavaScript          | register, sign in, sign out work                   |                    |       |
| 21    | Phone                  | fits; right keyboards                              |                    |       |
| 22    | API down               | calm message                                       |                    |       |
| 23–24 | Automated checks       | setup Done; 83 unit + 86 e2e                       |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
