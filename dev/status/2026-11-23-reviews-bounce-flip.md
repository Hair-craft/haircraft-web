# Status: home reviews: Bounce Cards with photos that flip to the review, 8 reviews (2026-11-23)

**Ask (owner):** keep the Bounce Cards (the fanned stack); the image should fill the card;
up to 8 reviews; clicking a card rotates it to show the customer's review on the back.
(A Tilted Card grid with a pop-up was tried in between and dropped at the owner's word.)

## Done

- **`src/components/home/review-bounce-cards.tsx`**, logic in `src/lib/home/bounce-cards.ts`:
  - **Fan of up to 8** (`HOME_REVIEW_COUNT = 8`): `bounceTransforms(count, step)` centres the
    cards `step` px apart; 5 cards 100 px apart is React Bits' own fan exactly. Other counts
    are tipped outwards at the ends (10° … -10°) with a little wobble between.
  - **Bounce-in and hover** as before (elastic pop, hovered card straightens and comes to the
    front, neighbours pushed aside: 160 px, or 120 px for more than 5 cards).
  - **Front:** the photo fills the card (`object-cover`): the customer's photo, else the
    product's main photo. Stars, name and "Tap to read ↻" over a dark fade at the bottom.
  - **Flip:** clicking or tapping a card lifts it and turns it over (3D `rotateY(180deg)`,
    0.7 s with a little overshoot). **Back:** stars, Verified, title, the whole review
    (scrolls inside the card if long), name, date (India time), product link and
    "↺ Back to photo". Clicking again flips it back; another card coming forward, or the
    pointer leaving the deck, turns it back too. The hidden face is `inert` (no tabbing into it).
  - **Phones:** tighter fan (30 px apart for 6–8 cards), push 70 px, the deck at 78%.
  - **Reduce motion:** upright cards in a row that scrolls; the flip is instant.
- **API:** `GET /reviews/featured` allows `limit` up to 8 (was 6). **Admin:** note says up to 8.

## Checks

- Shop: `tsc`, eslint clean; 28 files, 273 unit tests pass (`tests/unit/bounce-cards.test.ts`).
- Local site (6 reviews chosen): fan bounces in with photos filling the cards; clicking the
  left card lifted it and flipped it to "Gorgeous waves", the review, Kavya M., date, product
  and "Back to photo". Phone width not checked in the browser (window would not resize).

## To deploy

Deploy the **API first**: the live API still refuses `limit=8`, and then the home page hides
the reviews section.
