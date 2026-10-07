# Testing: Phase S9, My account

Pairs with [`plan`](../plan/2026-10-07-phase-s9-my-account.md) and [`status`](../status/2026-10-07-phase-s9-my-account.md).

**What this phase delivers:** the account area: an overview, profile editing, the address book and password and security.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`), with B9 built.
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true`, then `npm run dev`.
3. **Open <http://localhost:3001>**, register a new customer (or sign in), and open **My account** from the account menu.

## A. Overview and menu

1. **Expected:**
   - "Hello, <name>" and four cards: Profile, Default address ("No saved addresses yet."), My wishlist, My orders ("will appear here soon")
   - the menu on the left with Overview highlighted; My orders greyed "(coming soon)"; Sign out under it
2. **Sign out, then open `/account/addresses`.** **Expected:** sent to sign in; after signing in, back on Addresses.

## B. Profile

3. **Profile:** change the first name, add a last name and a mobile (98765 43210), then **Save changes**.
   - **Expected:** "Your details are saved."; the account button in the header shows the new initial and greets the new name.
4. **Reload.** **Expected:** the new values; the mobile shown as 98765 43210.
5. **Empty the first name and type 12345 as the mobile, then save.** **Expected:** "Please check the details below." with a message under each field; nothing saved.
6. **The email** is shown but can't be edited, with "To change your email, please contact us".

## C. Address book

7. **Addresses:** **Expected:** "No saved addresses yet" with **Add address**.
8. **Add an address** (choose Home; State from the list; PIN 400 050).
   - **Expected:** "Your first address becomes your default." on the form; afterwards "Address added." and a card with the gold **Default** badge.
9. **Add a second**, choosing **Other** (a "Your label" box appears; type "Studio"), and tick "Make this my default address".
   - **Expected:** Studio comes first and is the default.
10. **Edit** the Home address, add a landmark, save. **Expected:** "Address saved." and "Near …" on the card.
11. **Make default** on Home. **Expected:** "Default address changed."; Home first with the badge.
12. **Delete** Home.
    - **Expected:** a question, "Delete this address?", saying another address becomes the default.
    - **Keep it** keeps it; **Delete address** deletes it, and Studio becomes the default.
13. **Bad values:** add an address with mobile 12345 and PIN 0400, and no street.
    - **Expected:** a message under each field.
    - **Expected:** what was typed stays, including the chosen state.
14. **The limit** (optional; quickest through Swagger, `POST /api/v1/addresses` 20 times): with 20 saved, **Expected:** no **Add address**, and a line explaining the limit.

## D. Password and security

15. **Sign in on a second browser** (or a private window) with the same account.
16. **Password and security:** enter a wrong current password. **Expected:** "Your current password is incorrect."
17. **New and confirm that don't match.** **Expected:** "The passwords don't match." While typing the new password, the rules tick off.
18. **Change it properly.**
    - **Expected:** "Password changed. You've been signed out on your other devices."
    - **Expected:** this browser stays signed in, and the second browser is signed out when it next loads a page.
    - **Expected:** the new password signs in; the old one doesn't.
19. **Sign out on all devices.** **Expected:** "You're signed out on all your devices."

## E. Special cases

20. **Keyboard:** Tab through the menu and a form. **Expected:** everything can be reached, and the label chips can be chosen with the arrow keys or Space.
21. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** saving the profile and adding an address work.
    - **Expected:** "Your label" shows when Other is chosen.
    - Delete doesn't ask first without JavaScript, as accepted.
    - Re-enable JavaScript afterwards.
22. **Phone:** **Expected:** the menu is a row of tabs that scrolls sideways; every page and form fits the screen.
23. **API down:** stop the API and open My account. **Expected:** "We'll be right back". Start it again.

## F. Automated checks

24. **In `nextjs-haircraft`** (the test database set up once with `scripts\setup-e2e-db.ps1`):
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 122 unit tests and 122 end-to-end tests pass.

## Results

| #     | Check               | Expected                                                   | Result (Pass/Fail) | Notes |
| ----- | ------------------- | ---------------------------------------------------------- | ------------------ | ----- |
| 1     | Overview and menu   | greeting, four cards, menu                                 |                    |       |
| 2     | Needs sign-in       | sent to sign in and back                                   |                    |       |
| 3–4   | Edit profile        | saved, header name updates, kept on reload                 |                    |       |
| 5     | Bad profile values  | messages, nothing saved                                    |                    |       |
| 6     | Email               | read-only, contact us                                      |                    |       |
| 7–8   | First address       | empty state; added as default                              |                    |       |
| 9     | Second, Other label | label box, made default                                    |                    |       |
| 10–11 | Edit, make default  | saved; default moves                                       |                    |       |
| 12    | Delete              | asks; Keep it / Delete; default moves                      |                    |       |
| 13    | Bad address values  | messages; typed values kept                                |                    |       |
| 14    | 20 addresses        | no Add, explained                                          |                    |       |
| 15–18 | Change password     | errors; this browser stays, other signed out; new pw works |                    |       |
| 19    | All devices         | signed out everywhere                                      |                    |       |
| 20    | Keyboard            | all reachable                                              |                    |       |
| 21    | No JavaScript       | profile and address forms work                             |                    |       |
| 22    | Phone               | tabs, fits                                                 |                    |       |
| 23    | API down            | calm message                                               |                    |       |
| 24    | Automated checks    | 122 + 122                                                  |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
