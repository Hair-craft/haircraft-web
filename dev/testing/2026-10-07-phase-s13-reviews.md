# Testing: Phase S13, reviews

Pairs with [`plan`](../plan/2026-10-07-phase-s13-reviews.md) and [`status`](../status/2026-10-07-phase-s13-reviews.md).

**What this phase delivers:**

- writing, editing and deleting reviews
- My reviews, with each review's status
- "Review this item" on delivered orders

Moderation is in the admin panel (Reviews).

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`), and the admin panel is open in another tab.
2. **In `nextjs-haircraft`:** `npm run dev` (with `STORE_OPEN=true`), and open <http://localhost:3001>.
3. **A customer:** one with a **delivered** order helps. To make one:
   - place a cash-on-delivery order
   - in the admin panel set it to Processing
   - add shipping, then set it to Shipped and then Delivered

## A. Writing

1. **Signed out, open a product and press Write a review.** **Expected:** sign in, then back on the review form.
2. **The form:**
   - **Expected:** the product's photo and name, five stars, Title and Your review (both optional), "characters left".
   - **Expected:** "We check every review before it appears."
3. **Press Send review without stars.** **Expected:** "Choose from 1 to 5 stars."
4. **Choose 4 stars** (the word "Very good" shows), add a title and text, send.
   - **Expected:** back on the product's reviews, "Thank you! Your review will appear once it's approved."
   - **Expected:** **Edit your review**, with "Your review is waiting for approval."
5. **Keyboard:** on the form, Tab to the stars and use the arrow keys. **Expected:** the choice moves star by star.

## B. Verified purchase and orders

6. **Open the delivered order (My orders).** **Expected:** "How was it?" with **Review <product>**.
7. **Press it.**
   - **Expected:** "Your review will be marked Verified purchase."
   - **Expected:** after sending, back on the order.

## C. Moderation and My reviews

8. **My account → My reviews.** **Expected:** each review with its stars, text and **Waiting for approval**.
9. **Admin panel → Reviews:** approve one, reject another.
   - **Expected:** in My reviews, "Published" and "Not published" (with "You can edit it and send it again, or delete it").
   - **Expected:** the approved one appears on the product page within 2 minutes, with "Verified purchase" if it was.
10. **Edit** a published review and save.
    - **Expected:** "Review saved. It will appear again once it's approved."
    - **Expected:** back to "Waiting for approval", and it disappears from the product page until approved again.
11. **Delete** a review. **Expected:** it asks first, then "Review deleted."; you can write a new one for that product.

## D. Special cases

12. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** writing (click a star), editing and deleting work.
    - Re-enable JavaScript afterwards.
13. **Phone:** **Expected:** the stars are easy to tap and fill in; the form and My reviews fit the screen.
14. **API down:** stop the API and open My reviews. **Expected:** "We'll be right back". Start it again.

## E. Automated checks

15. **In `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 158 unit tests and 167 end-to-end tests pass.

## Results

| #   | Check             | Expected                                       | Result (Pass/Fail) | Notes |
| --- | ----------------- | ---------------------------------------------- | ------------------ | ----- |
| 1   | Guest             | sign in, back to the form                      |                    |       |
| 2–4 | Write             | form; stars needed; sent, waiting              |                    |       |
| 5   | Keyboard stars    | arrow keys move the choice                     |                    |       |
| 6–7 | Verified purchase | from the delivered order; marked verified      |                    |       |
| 8   | My reviews        | statuses shown                                 |                    |       |
| 9   | Moderation        | published / not published; on the product page |                    |       |
| 10  | Edit              | back to waiting                                |                    |       |
| 11  | Delete            | asks, deletes                                  |                    |       |
| 12  | No JavaScript     | write, edit, delete                            |                    |       |
| 13  | Phone             | stars tap and fill, fits                       |                    |       |
| 14  | API down          | calm message                                   |                    |       |
| 15  | Automated checks  | 158 + 167                                      |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
