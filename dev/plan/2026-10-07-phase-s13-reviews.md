# Plan: Phase S13, reviews

**Status: Approved (2026-10-07)** with the recommended options: any signed-in customer may review (moderated, Verified purchase for buyers); a review page per product; rejected reviews shown to their writer as Not published; the home wording goes in with S14.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S5 (reviews shown on product pages), S9 (the account area) and S12 (order pages).

## Context

Product pages and the home page already show approved reviews (S5, S2b). S13 lets customers **write** them, and edit or delete their own.

**What the API offers** (built in backend phase 8):

- **Who:** any signed-in customer may review a product, once per product (`409 REVIEW_ALREADY_EXISTS` points to the existing one).
- **The review:** a rating of 1–5, an optional title (up to 150 characters) and optional text (up to 5,000).
- **Verified purchase:** set automatically when the customer received the product in a delivered order.
- **Moderation:** every new or edited review waits for a moderator (`PENDING`) before it appears; moderators approve or reject in the admin panel (built).
- **Calls:**
  - `GET /products/:id/reviews/eligibility`: can I review this; my existing review; would it be verified
  - `POST /products/:id/reviews`
  - `GET /reviews/mine` (with status: pending, published, not published)
  - `PATCH /reviews/:id`
  - `DELETE /reviews/:id`

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S13.1 Write a review:**
   - a review page per product, `/product/<slug>/review` (open question 2), showing the product's photo and name
   - the form: tap 1–5 stars (each with its meaning: Poor, Fair, Good, Very good, Excellent), a title and the review, with characters left
   - "Your review will be marked Verified purchase" when it will be
   - on sending: "Thank you! Your review will appear once it's approved." and back to the product
   - guests are asked to sign in first and come back to the form
2. **S13.2 Where to start one:**
   - **Write a review** in the product page's reviews section, or **Edit your review** if they've written one
   - **Review this item** next to each item of a delivered order (S12 order page)
   - **My reviews** in the account
3. **S13.3 My reviews** `/account/reviews`:
   - the customer's reviews, newest first, each with the product, stars, title, text, date and status:
     - "Waiting for approval"
     - "Published"
     - "Not published" (open question 3)
   - **Edit** (the same form, filled in: "Changes are checked again before they appear") and **Delete** (asks first)
4. **S13.4 Product page touches:**
   - "Verified purchase" on reviews (already shown)
   - a line under the reviews summary when the shopper's own review is waiting: "Your review is waiting for approval"
5. **S13.5 Tests, click-through, docs:**
   - unit tests for the rules
   - Playwright, listed under Testing
   - screenshots
   - status, QC guide, PROGRESS, boss doc

**Out of scope:**

- photos in reviews (no API)
- replies from the shop (no API)
- "Was this helpful?" votes (no API)
- the home page's placeholder wording (open question 4)

## Design

- **The review page** is a calm single column:
  - the product's photo and name at the top
  - five large stars (keyboard: arrow keys move between them, as a radio group)
  - the title and text boxes, and **Send review**
- **My reviews:** cards like My orders, each with the product's photo, stars and a status badge (gold Waiting, green Published, grey Not published).
- **How it works:**
  - plain forms posting to server actions, so they work without JavaScript
  - the API's words for problems
  - the API is the only record

## Files

```
src/app/(shop)/product/[slug]/review/page.tsx
src/app/(shop)/account/reviews/page.tsx
src/components/reviews/…            star input, review form, my-review card
src/lib/reviews/…                   API calls, server actions, rules (pure: star words, limits, statuses)
src/components/product-page/…       Write / Edit your review, "waiting for approval"
src/app/(shop)/account/orders/[orderNumber]/page.tsx   Review this item (delivered orders)
src/components/account/account-nav.tsx                 My reviews
tests/unit/reviews.test.ts, tests/e2e/reviews.spec.ts, tests/e2e/reviews.mobile.spec.ts
dev/status/…-phase-s13-…, dev/testing/…-phase-s13-…, dev/PROGRESS.md
```

## Testing

1. **Unit:** star words, the form's checks (a rating is needed; limits), status labels, the API's errors as messages.
2. **Playwright (test API):**
   - **write:** "waiting for approval"; once approved through the admin API it appears on the product page
   - **verified purchase:** shown after a delivered order
   - **one review per product:** Write becomes Edit
   - **edit and delete** from My reviews (edit goes back to waiting)
   - **guests:** sign in, then back to the form
   - **the order page:** Review this item on a delivered order
   - keyboard (stars with arrow keys), no JavaScript, phones, API down
3. **By eye:** the review page, My reviews in each status, and the product page with "Write a review", on a computer and a phone.

## Risks

- **Reviews from people who didn't buy:** the API allows any signed-in customer (open question 1). Every review is moderated, and only buyers get "Verified purchase".
- **Test reviews on the development database:** the earlier duplicate-review clean-up is still waiting to be run; tests use their own database.

## Open questions

1. **Who may review.** Recommended: **as the API allows: any signed-in customer**, with "Verified purchase" for buyers and every review approved by staff first. This is common practice and lets people who bought in person review too. The alternative is buyers only, which needs a small backend change.
2. **Where reviews are written.** Recommended: **a review page per product** (`/product/<slug>/review`), linked from the product page, the order page and My reviews. It works the same everywhere, without JavaScript and on phones. The alternative is a pop-up form on the product page.
3. **Showing rejected reviews to their writer.** Recommended: **yes, as "Not published"**, with Edit (which sends it for approval again) and Delete, so nobody wonders where their review went. The alternative is hiding rejected reviews from My reviews.
4. **The home page's placeholder wording** (the FAQ answers, the "Why HairCraft" cards and the story, written as safe defaults in S2b). Recommended: **send me your wording any time and I'll put it in with S14** (the information pages, which also need your text), so all the shop's words are done together. The alternative is doing it in this phase if you have the text ready.
