# Status: home reviews as React Bits' Bounce Cards (2026-11-23)

**Ask (owner):** "Use bounce cards for the review section from the react bits."

## Done

- **`src/components/home/review-bounce-cards.tsx`** (client, GSAP), with the logic in
  `src/lib/home/bounce-cards.ts`. React Bits' Bounce Cards, ported:
  - **Fan:** up to 5 cards in a stack, each with React Bits' own transform (`rotate(10deg)
    translate(-200px)` … `rotate(2deg) translate(200px)`; the offsets are widened from ±170px
    for the bigger cards). Fewer reviews take the middle of the fan.
  - **Bounce-in:** scale 0 → 1, stagger 0.06, `elastic.out(1, 0.8)`, 0.5s delay, played when
    the section comes into view. It runs on an inner layer (`.hc-bounce__pop`): on the card
    itself, GSAP wiped out the fan transform (found while checking).
  - **Hover / focus / tap:** the card straightens (`getNoRotationTransform`) and comes to the
    front. The others are pushed 160px aside (`getPushedTransform`), further ones 0.05s later
    each, with `back.out(1.4)` over 0.4s. Leaving the deck puts them back.
  - **Cards:** React Bits' 5px white border, 25px corners and shadow, 240 × 272px. A card
    shows the customer's photo when the review has one; otherwise the review itself (stars,
    Verified, title, 4 lines of the review, name, a link to the product).
- **`TestimonialsSection`:** now 5 featured reviews (was 1), a centred heading ("Loved by
  women like you") and the deck. Hidden with no reviews.
- **Phones:** the whole fan at 62% size.
- **Reduce motion:** upright cards in a sideways-scrolling row.
- **Tests:** `tests/unit/bounce-cards.test.ts` (fan picks, straighten, push).

## Checks

- 28 files, 268 tests pass; `tsc` and eslint are clean.
- Local site (2 reviews): the cards fan out turned and offset. Hovering the left card
  straightened it, brought it to the front and pushed the other one aside.
