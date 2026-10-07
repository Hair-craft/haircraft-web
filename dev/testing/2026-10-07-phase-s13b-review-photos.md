# Testing: Phase S13b, review photos and featured reviews

Pairs with [`plan`](../plan/2026-10-07-phase-s13b-review-photos.md) and [`status`](../status/2026-10-07-phase-s13b-review-photos.md).

**What this phase delivers:**

- photos on reviews (up to 3), seen by moderators before they're published
- photos on product pages, with "Customer photos" and **Most relevant** first
- the home page's three featured reviews

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar). Have a few photos ready, including one over 5 MB if you can.

## 0. Setup

1. **Apply the new migration** to the development database (once).
   - In `nestjs-haircraft`: `npm run migration:run`
   - **Expected:** "Migration ReviewImages… has been executed successfully".
2. **Restart the API:** `npm run start:dev`. Then start the admin panel (`npm start` in `angular-haircraft`) and the shop (`npm run dev` in `nextjs-haircraft`, with `STORE_OPEN=true`).
3. **A customer** signed in to the shop, and the admin panel signed in as an admin.

## A. Adding photos

1. **Open a product → Write a review.** **Expected:** "Photos (optional)" with "Add up to 3 photos in all: JPEG, PNG or WebP, up to 5 MB each".
2. **Choose 2 photos.** **Expected:** previews of both.
3. **Choose 4 photos.** **Expected:** "You can add up to 3 photos in all. Choose 3 or fewer."
4. **Choose a PDF or a photo over 5 MB.** **Expected:** a message naming the file.
5. **Choose 2 good photos, give 5 stars, a title and a few lines, and send.**
   - **Expected:** "Thank you! Your review will appear once it's approved."
   - **Expected:** My reviews shows the review, "Waiting for approval", with its 2 photos.

## B. Moderation

6. **Admin panel → Reviews (Waiting).**
   - **Expected:** the review with its 2 photos.
   - **Expected:** each opens large in a new tab.
   - Press **Publish**.
7. **The product page, Customer reviews** (within 2 minutes of publishing):
   - **Expected:** the review with its photo thumbnails, and "Customer photos" above the reviews.
   - **Expected:** the sort shows **Most relevant**, and reviews with photos come first.
8. **Press a photo.** **Expected:** it opens full screen; swipe or use the arrows; Escape or × closes.
9. **The home page, "Loved by women like you":**
   - **Expected:** up to 3 reviews, 5-star only, one per product, those with photos first. A review with a photo fills its whole card with the photo, faces not cut off, and its words are readable over it.

## C. Editing

10. **My reviews → Edit:** tick **Remove** on one photo, add another, **Save review**.
    - **Expected:** "Review saved…", back to "Waiting for approval".
    - **Expected:** the photos are the kept one and the new one.
    - **Expected:** in the admin panel it's waiting again.
11. **Delete the review** (My reviews → Delete → Delete review). **Expected:** the review and its photos are gone.

## D. Special cases

12. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** a review with a photo can be sent; the photo appears in My reviews.
    - Re-enable JavaScript afterwards.
13. **Phone:** **Expected:** Choose files offers the camera and gallery; thumbnails and the full-screen view work by touch; everything fits.
14. **Keyboard:** Tab to a review photo and press Enter. **Expected:** it opens full screen; Escape closes it.

## E. Automated checks

15. **Backend:** `npm test` and `npm run test:e2e` in `nestjs-haircraft`. **Expected:** 317 and 292 pass.
16. **Admin panel:** `npm test` in `angular-haircraft`. **Expected:** 472 pass.
17. **Storefront:** `npm run check` and `npm run test:e2e` in `nextjs-haircraft`.
    - The test database needs the migration too: `scripts\setup-e2e-db.ps1`, or `npm run migration:run` with `DATABASE_NAME=hc_e2e`.
    - **Expected:** 159 and 171 pass.

## Results

| #     | Check            | Expected                                                | Result (Pass/Fail) | Notes |
| ----- | ---------------- | ------------------------------------------------------- | ------------------ | ----- |
| 1–2   | Photo field      | shown; previews                                         |                    |       |
| 3–4   | Checks           | too many / wrong kind / too large explained             |                    |       |
| 5     | Send with photos | saved, waiting, photos in My reviews                    |                    |       |
| 6     | Moderation       | photos shown, open large; publish                       |                    |       |
| 7–8   | Product page     | thumbnails, Customer photos, Most relevant, full screen |                    |       |
| 9     | Home page        | 3 featured, 5-star, photos first                        |                    |       |
| 10    | Edit photos      | remove and add; waiting again                           |                    |       |
| 11    | Delete           | review and photos gone                                  |                    |       |
| 12    | No JavaScript    | photo sent                                              |                    |       |
| 13    | Phone            | camera/gallery, touch, fits                             |                    |       |
| 14    | Keyboard         | open and close a photo                                  |                    |       |
| 15–17 | Automated checks | 317+292, 472, 159+171                                   |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
