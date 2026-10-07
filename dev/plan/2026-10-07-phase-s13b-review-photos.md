# Plan: Phase S13b, review photos and featured reviews (with backend B14 and an admin-panel update)

**Status: Approved (2026-10-07)** with the recommended options: featured reviews on the home page; relevance = approved 5-star with words, photos first, then verified, then newest, one per product; up to 3 photos of 5 MB (JPEG/PNG/WebP); moderators see photos in the admin panel in this phase.

An addition to S13, asked for by the owner on 2026-10-07: "The review section will contain images, and the most relevant three or newest 5-star ratings will be shown on the page."

## Context

- **Reviews today** are text only (rating, title, text). The API has nowhere to keep review photos.
- **The home page's review section** shows up to six approved 4- and 5-star reviews, newest first, at most two per product.
- **Product pages** list reviews 5 at a time, sorted Newest, Highest or Lowest.
- **Photo storage** already exists for product photos: Cloudinary in production, local files in development and tests. It checks the file type and size and makes thumbnail, medium and large sizes. Review photos can use the same storage.
- **Every review is moderated** in the admin panel. Photos must be seen by the moderator before they're published, so the admin panel needs to show them.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **B14.1 (backend) Review photos:**
   - customers add **up to 3 photos** to their review (JPEG, PNG or WebP, up to 5 MB each; open question 3), and remove them; adding or removing sends the review back for approval, like any edit
   - photos are checked and resized like product photos, and stored the same way
   - public reviews, My reviews and the admin's reviews include the photos (thumbnail, medium, large)
   - deleting a review deletes its photos
2. **B14.2 (backend) Featured reviews:** `GET /reviews/featured?limit=3` returns the three "most relevant" approved 5-star reviews across the shop (open question 2), with their product and photos. There's also a **Most relevant** sort for a product's reviews.
3. **A (admin panel) Photos in moderation:** the Reviews screen shows each review's photos (tap to enlarge), so moderators see them before approving.
4. **S13b.1 Adding photos:**
   - the review form gets **Add photos (up to 3)**, with previews, a remove button on each, and plain messages for a wrong type or too large a file
   - editing shows the review's photos to keep or remove
   - works on phones (camera or gallery)
5. **S13b.2 Photos on the product page:**
   - each review shows its photos as small thumbnails; tapping one opens it large (the S5 lightbox)
   - a **Customer photos** strip above the reviews when there are any
   - **Most relevant** becomes the first sort
6. **S13b.3 The home page's review section:**
   - shows the **3 featured reviews** (open question 1): stars, title, text, name, Verified purchase, the product, and the first photo when there is one
   - hidden when there are none (never invented reviews)
7. **S13b.4 Tests, click-through, docs:**
   - backend unit and e2e
   - admin panel tests
   - storefront unit and Playwright (uploading test photos to the local test storage, never Cloudinary)
   - screenshots
   - status, QC guide, PROGRESS, boss doc

**Out of scope:**

- videos
- staff choosing ("pinning") the featured reviews by hand (open question 2)
- "Was this helpful?" votes

## Design

- **On a review:** up to three square thumbnails under the text (64 px, rounded, like the bag's photos).
- **Customer photos strip:** up to 8 thumbnails in a row that scrolls sideways on phones.
- **Home section:** three cards side by side on computers, stacked on phones:
  - the photo on top when there is one
  - then the stars, title, a few lines of text and the name with "Verified purchase"
  - then "On Deep Wave Tape-ins" linking to the product
- **How it works:**
  - photos go to the API through the storefront (the browser never talks to the storage service)
  - the API checks each one before keeping it

## Files

```
nestjs-haircraft:
  src/database/migrations/…-ReviewImages.ts           review_images table
  src/modules/reviews/…                                photos (add, remove), featured, most-relevant sort, DTOs
  test/reviews-photos.e2e-spec.ts, README.md, dev/PROGRESS.md
angular-haircraft:
  src/app/features/reviews/…                           photos in the moderation screen, tests
nextjs-haircraft:
  src/components/reviews/…, src/components/product-page/reviews.tsx, src/components/home/sections.tsx
  src/lib/reviews/…, src/lib/api/catalog.ts
  src/app/bff/reviews/…/photos/route.ts                upload through the storefront
  tests/unit/…, tests/e2e/reviews-photos.spec.ts
  dev/status/…-phase-s13b-…, dev/testing/…-phase-s13b-…, dev/PROGRESS.md
```

## Testing

1. **Backend:**
   - photo limits (count, type, size; a renamed non-image refused)
   - edits go back for approval
   - photos are deleted with their review
   - featured: only approved 5-star reviews, the order rules, at most one per product
   - the Most relevant sort
2. **Admin panel:** photos show in the queue and the detail; approving still works.
3. **Storefront (Playwright, test API with local photo storage):**
   - add 2 photos, remove one, send; once approved, the photo shows on the product page and opens large
   - too many or too large photos are explained
   - the home page shows the 3 featured reviews with their photos
   - the Customer photos strip; the Most relevant sort
   - phones; no JavaScript (photos are optional; the review still sends); API down
4. **By eye:** the form with photos, the product page's reviews and strip, the home section, the admin moderation screen, on a computer and a phone.

## Risks

- **Photos can show faces or unsuitable content:** every photo is seen by a moderator before it's published (hence the admin-panel step).
- **Storage costs on Cloudinary:** at most 3 photos per review, resized; tests and development use local files only. No uploads to Cloudinary without the owner's go-ahead.
- **Phone photos are large** (often 3–8 MB): the 5 MB limit may refuse some. The form says so clearly; resizing in the browser before uploading is a possible follow-up.

## Open questions

1. **Which page shows the three featured reviews.** Recommended: **the home page's review section**, which replaces today's six newest. Product pages keep all reviews, with photos and **Most relevant** first. The alternative is showing three featured reviews at the top of each product's reviews too.
2. **What "most relevant" means.** Recommended:
   - only approved **5-star** reviews that say something (a title or text)
   - those with **photos** first, then **Verified purchase**, then the **newest**
   - **at most one per product**, so three different products appear
   - fewer than three 5-star reviews means fewer are shown, and none hides the section

   The alternatives are simply the 3 newest 5-star reviews, or letting staff pin the reviews they want (an extra admin feature).

3. **Photo limits.** Recommended: **up to 3 photos per review, up to 5 MB each, JPEG/PNG/WebP**. The alternative is a different number or size.
4. **Moderators see photos.** Recommended: **yes, in this phase** (the admin panel's Reviews screen), so nothing is published unseen. Leaving it out would mean approving photos without seeing them, which isn't advisable.
