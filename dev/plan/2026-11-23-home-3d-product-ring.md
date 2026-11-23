# Plan: Best sellers and Customer favourites as a 3D ring slider (2026-11-23)

**Ask (owner):** "The best seller and the customer favourite one will be the slider, like we can
slide with some animation, use the given code and make it something like this." The owner
pasted a GSAP 3D image ring: cards stand around a circle, and dragging spins it. Each photo
shifts slightly as it turns (parallax), cards rise in one after another, and hovering one dims
the others.

## What visitors see

- **The ring:**
  - The section's products stand around a 3D ring.
  - Drag (mouse) or swipe (finger) left or right to spin it. It keeps turning a little after
    you let go, then eases to stop with one card facing front.
  - Each product photo shifts slightly as its card turns (the parallax in the given code).
  - When the section scrolls into view, the cards rise in one after another (the code's
    `y:200, opacity:0, stagger` entrance).
  - **Hover** a card on a computer and the other cards fade to half, as in the code.
- **Each card:**
  - The same product card as today: photo, name, price, badges, rating.
  - A tap or click (not a drag) opens the product page.
  - "Add to bag" and the wishlist heart still work.
- **Arrows:**
  - Round ‹ › buttons under the ring turn it by one card, for people who don't drag.
  - The ← → keys do the same when the ring is focused.
  - Tabbing to a card turns the ring so that card faces front.
- **Background:** the site's own light background, not the black of the sample. Cards cast a
  soft shadow.
- **Sizes:**
  - Phones: card about 62% of the screen width; the cards on each side show at an angle.
    Vertical page scrolling still works over the ring; only sideways swipes spin it.
  - Desktop: card about 260 px; about 3 to 5 cards visible at once.
  - Ring size follows the number of products, so 4 "Best rated" and 8 "Best sellers" both
    close neatly. With 1 or 2 products, the normal row is shown, since a ring needs at least 3.
- **"Reduce motion" set on the device:** the normal row as today, with no spinning or rising.

## Where

| Section | Change |
|---|---|
| Best sellers | The ring replaces the 4-column grid. |
| Customer favourites | Each tab ("Best rated", "New arrivals") shows its own ring; switching tabs fades between them as now. |

## Build

- **New `src/components/home/product-ring.tsx`** (client):
  - GSAP (already a dependency, 3.15) for the ring's rotation, the drag momentum, the snap,
    the rise-in and the hover fade;
  - CSS `perspective` and `preserve-3d`, as in the given code.
- **`ProductRow` in `sections.tsx`:** renders `ProductRing`, falling back to today's row for
  reduced motion or fewer than 3 products.
- **The server still renders the cards**, so search engines and slow phones get real product
  links at once; the ring arranges them once its script loads.
- **Accessibility:**
  - the ring is a labelled region ("Best sellers, 8 products");
  - the arrows have names;
  - cards facing away are hidden from screen readers and can't be tabbed to.
- **Tests:**
  - unit tests for the ring geometry (angle per card, radius, snap to nearest card) and the
    fallback rules;
  - the current tests for the sections keep passing.

## Not in this plan

- Other sections (concerns, categories) stay as they are.
- No change to which products appear: Best sellers are still those ticked in the admin.
