# Status: Phase S13b, review photos and featured reviews (with backend B14 and the admin panel)

Tracks progress against [`plan/2026-10-07-phase-s13b-review-photos.md`](../plan/2026-10-07-phase-s13b-review-photos.md).

## 2026-10-07: implemented and verified

**Result: done.** Every in-scope item is implemented in the three apps:

- B14.1, B14.2: the backend
- the admin panel step
- S13b.1–S13b.4: the storefront

**Verified by:**

- **Backend:** typecheck, ESLint and the build clean; 317 unit tests and 292 e2e tests (5 new), all passing.
- **Admin panel:** lint and the production build clean; 472 unit tests (2 new), all passing. Its own end-to-end tests weren't re-run (they need the development API; see "Known and accepted").
- **Storefront:** typecheck, ESLint, Prettier and the build clean; 159 unit tests and 171 Playwright tests, all passing:
  - unit: 9 new, and 4 removed that tested the old home-page review picker, which the API now replaces
  - Playwright: 4 new, 1 extended
- **Screenshots reviewed by eye:**
  - the home page's three featured reviews with photos
  - a product's reviews with photos and the Customer photos strip
  - the full-screen photo view
  - the review form with saved photos (one ticked to remove)
  - the admin moderation card with three photos
  - a phone

**Photo storage:** all test photos went to the test API's local folder; nothing was uploaded to Cloudinary.

Approved with the recommended options:

- the featured reviews show on the home page
- "most relevant" = approved 5-star reviews with words, those with photos first, then verified purchases, then the newest, one per product
- up to 3 photos of up to 5 MB each (JPEG, PNG or WebP)
- moderators see the photos

---

## What was built

### B14.1 (backend) Review photos

- **`POST /reviews/:id/photos`** (multipart, field `files`) adds photos to my review, up to **3 in all**.
  - Files are checked by their content (JPEG, PNG or WebP; anything else is 415), up to 5 MB each (413).
  - If any file is refused, none are saved; stored files are removed again if saving fails.
- **`DELETE /reviews/:id/photos/:photoId`** removes one.
- **Moderation:** adding or removing a photo sends the review back for approval, like any edit. A published review stops counting towards the product's rating until approved again.
- **Where photos appear:**
  - public reviews, My reviews and the admin's reviews include `photos` (thumbnail, medium, large and original URLs, and the size)
  - deleting a review deletes its photos (rows and files)
- **Storage:** photos are stored like product photos (Cloudinary in production, local files otherwise) under `reviews/<review id>`, in a new `review_images` table (migration `ReviewImages`).
- **Shared code:** the file checks are now one function shared by product and review photos.

### B14.2 (backend) Featured reviews and the Most relevant sort

- **`GET /reviews/featured?limit=3`** (public, 1–6) returns approved **5-star** reviews that say something (a title or text), **one per product**, with **photos first**, then **verified purchases**, then the **newest**, each with its product.
- **`sort=relevant`** for a product's reviews: photos first, then verified purchases, then those with more to say (40+ characters), the newest first within each.

### Admin panel: photos in moderation

- Each review card in Reviews shows its photos as 96 px thumbnails. Each opens the large photo in a new tab ("Open photo 1 of 3 (new tab)"), so moderators see them before publishing.

### S13b.1 Adding photos

- **The review form has "Photos (optional)":**
  - the saved photos, each with a **Remove** tick box
  - a file chooser (camera or gallery on phones) for new ones: "Add up to 3 photos in all: JPEG, PNG or WebP, up to 5 MB each"
  - previews of the chosen photos
- **Checked at once:**
  - "You can add up to 3 photos in all. Choose 1 or fewer."
  - "\"notes.txt\" isn't a photo we can use…"
  - "\"big.jpg\" is larger than 5 MB…"
- **Checked again on the server and by the API:** if the API still refuses a photo, the review is kept and the form says so ("Your review is saved, but a photo wasn't a JPEG, PNG or WebP image, so the photos weren't added."), so the shopper can try again.
- **Without JavaScript** the same fields work as plain form fields.
- **The upload limit:** the storefront's server actions accept up to 16 MB, for 3 photos of 5 MB plus the form.

### S13b.2 Photos on the product page

- **On each review:** photos as 72 px thumbnails ("Photo 1 of 2 by Anjali R. (opens large)"), opening the S5 full-screen viewer (swipe or arrows, Escape closes).
- **Customer photos:** a strip of up to 8 thumbnails above the reviews when there are any.
- **Sorting:** **Most relevant** is the first and default sort.

### S13b.3 The home page

- **"Loved by women like you"** shows the **3 featured reviews** (it showed up to 6 before): each card shows the stars, title, text, name and Verified purchase, and the product. When the review has a photo, the first photo fills the whole card (framed from the top, so faces aren't cut off), with the words in white over a dark fade at the bottom; this was changed after the owner's review. All cards are at least 480 px tall.
- **Hidden** when there are none.

## Problems found and fixed

1. **The test database didn't have the new table:**
   - the test API doesn't apply migrations itself, so every review call failed ("We can't reach the shop") and the S13 tests failed with the new ones
   - fixed by applying the migration to `hc_e2e`
   - the same applies to the development database (see below)
2. **Approved reviews could appear late in tests:** reviews are cached for 2 minutes. There's now a setting, `REVIEWS_CACHE_SECONDS` (default 120), and the test servers use 0.
3. **An S13 test needed updating:** the S13 "edited review" test compared the whole review and now also sees `photos: []`. Updated.

Test fixes (not app fixes):

- the backend's approve call answers 200, not 201
- one test waited for the review page's own address instead of the thank-you note
- the phone check looks for the photo field

## Changed from the plan

- **Uploads go through server actions,** not a separate storefront route. They work without JavaScript, and the browser still never talks to the storage service.
- **"Customer photos"** is drawn from the reviews loaded so far (Most relevant puts reviews with photos first), not from a separate list of all photos.

## Known and accepted

- **The development database needs the new table** before reviews work in development: **run the migration** (command below). Your development API reloaded with the new code and needs it.
- **Phone photos over 5 MB are refused,** with a clear message. Shrinking photos in the browser before upload is a possible follow-up.
- **The admin panel's own end-to-end tests** (25, Playwright against the development API) weren't re-run this time. Its unit tests, lint and build were. They can run once the development database is migrated.
- **A flaky backend test:** one full backend run had a Razorpay timing test fail ("confirms an expired order that was actually paid"), during a run that was unusually slow. The same test passed in the next full run (292/292). It isn't related to reviews.
- **Server log noise:** "The destination stream closed early" appears in full storefront test runs. No test fails.

## Not done / follow-ups

- Shrinking photos in the browser before upload.
- Staff "pinning" featured reviews by hand.
- Videos.
- "Was this helpful?" votes.
