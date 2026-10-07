# Status: Phase S13, reviews

Tracks progress against [`plan/2026-10-07-phase-s13-reviews.md`](../plan/2026-10-07-phase-s13-reviews.md).

## 2026-10-07: implemented and verified

**Result: done.** Every in-scope item (S13.1–S13.5) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 158 unit tests (6 new) and 167 Playwright tests (9 new) against the test API, all passing
- **backend:** no changes
- screenshots reviewed by eye:
  - the review form with a problem
  - My reviews with a published, a waiting and a not-published review
  - the product page's "Edit your review / waiting for approval"
  - the phone form (stars checked to fill correctly after a tap)

Approved with the recommended options:

- any signed-in customer may review (moderated; Verified purchase for buyers)
- a review page per product
- rejected reviews shown to their writer as Not published
- the home page's wording goes in with S14

---

## What was built

### S13.1 Write a review `/product/<slug>/review`

- **The page:** the product's photo and name, then the form:
  - **Your rating:** five large stars in a radio group (tap, click, or the arrow keys), with the word for the choice (Poor, Fair, Good, Very good, Excellent)
  - **Title (optional)** and **Your review (optional)**, with characters left
- **The note under the form:** "Your review will be marked Verified purchase." when the API says it will be, and "We check every review before it appears."
- **Sending:**
  - without stars, "Choose from 1 to 5 stars."
  - on success, back where the shopper came from (the product's reviews, the order, or My reviews), with "Thank you! Your review will appear once it's approved."
- **Guests** sign in first and come back to the form.
- **One review per product:** if one exists, the same page edits it.

### S13.2 Where to start one

- **Product page:** **Write a review** under "Customer reviews", or **Edit your review**, with "Your review is waiting for approval." or "Your review wasn't published. You can edit it." The empty state now says "No reviews yet. Be the first to share how it looks and feels."
- **A delivered order:** "How was it?" with **Review <product>** for each product in it.
- **The account menu:** **My reviews**.

### S13.3 My reviews `/account/reviews`

- Each review as a card:
  - the product (a link), the stars, the date, Verified purchase
  - the title and text
  - a status badge with a line about it:
    - gold "Waiting for approval": "…usually within a day or two"
    - green "Published"
    - grey "Not published": "…You can edit it and send it again, or delete it"
- **Edit** opens the review page filled in, with "Changes are checked again before they appear." Saving sends it back for approval.
- **Delete** asks first ("Delete this review? This can't be undone.") and works without JavaScript.

### S13.4 Product page

- The shopper's own review is looked up only for signed-in shoppers (two small API calls), to offer Edit and show its status.

## Problems found and fixed

None in the app. Test fixes only: a star is clicked through its label (its radio button is hidden), and the Delete toggle is found as the element itself (its words include text for screen readers). A phone screenshot taken mid-fade looked like an unfilled star; checked again after the fade: correct.

## Changed from the plan

- **No product photo on My reviews cards:** the API's review list doesn't include one. The product name is a link to its page instead.

## Known and accepted

- **An approved review appears on the product page within 2 minutes,** because product pages cache their reviews (the same as prices and stock text). The QC guide says so.
- **Moderators approve reviews in the admin panel** (built in the admin phase). The shop doesn't email the writer when that happens; no email service yet.
- **Anyone signed in may review** (approved option 1). Every review is moderated, and only buyers get "Verified purchase".
- **Server log noise:** "The destination stream closed early" appears in full test runs. No test fails.

## Not done / follow-ups

- **Photos in reviews, replies from the shop, "Was this helpful?":** none of these has an API.
- **The home page's wording:** the FAQ, the "Why HairCraft" cards and the story wait for the owner's text, to go in with S14.
