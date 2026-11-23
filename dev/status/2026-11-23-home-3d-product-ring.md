# Status: Best sellers and Customer favourites as a 3D ring (2026-11-23)

Plan: `dev/plan/2026-11-23-home-3d-product-ring.md` (approved by the owner: "Yes do it").

## Done

- **`src/components/home/product-ring.tsx`** (client, GSAP 3.15):
  - drag/swipe to spin, with a flick carrying it on, then a snap to the nearest card;
  - ‹ › buttons and the ← → keys turn it one card; tabbing to a card turns it to the front;
  - a "2 / 8" counter;
  - rise-in (`y: 200 → 0`, stagger 0.1, `expo.out`) with a quarter-turn into place when
    the ring first scrolls into view;
  - parallax: each photo shifts up to ±28 px as its card turns;
  - hovering a card dims the others to 50% (mouse only, CSS `:has`).
- **The geometry is in CSS** (`globals.css`, `.hc-ring*`): the radius is
  `card / 2 / tan(180° / n) + 2.5rem`, so the server HTML already stands as a ring. The
  script only sets `--rot` and each card's `--px`.
- **Few products** go round more than once, so the ring always has at least 8 cards
  (`ringFaces`: 3 → 9, 4 → 8, 5 → 10).
  - The repeats are `aria-hidden` and `inert`, so screen readers and Tab see each product once.
  - The counter counts products, not cards.
- **Vertical page scrolling** works over the ring (`touch-action: pan-y`; a drag that starts
  vertical is left to the page). A click that ends a drag doesn't open the card.
- **Reduce motion:** a plain sideways row of each product once, with no arrows (CSS only).
- **Fewer than 3 products:** the old row (`ProductRow`).
- **Sections** (`sections.tsx`): Best sellers, and the Best rated and New arrivals tabs, use the ring.
- **Lib** `src/lib/home/ring.ts`: `ringFaces`, `faceAngle`, `frontIndex`, `rotationFor`,
  `restingRotation`, `parallaxShift`.

## Differences from the plan

- **Every real card can be tabbed to**, and focusing one turns it to the front (better than
  hiding the cards turned away). Only the repeats are hidden.
- **Repeats** were added after a look on the local site: 3 Best rated products made a
  3-card ring that showed one card at a time.

## Checks

| Check | Result |
|---|---|
| Unit tests | `tests/unit/product-ring.test.ts`, 8 tests; full suite passes. |
| `tsc` and eslint | Clean. |
| Local dev site, desktop (Browser 1) | Ring of 9 (3 products); drag turns it, counter follows, no navigation on drag. |
| Phone e2e | `tests/e2e/mobile-home.mobile.spec.ts` updated (arrows, swipe, no page overflow). Not run: heavy, ask the owner first. |

The automated Chrome ran at 2 frames a second, so animations looked slow there; GSAP's
lag smoothing stretches them at that rate. They run at normal speed (about 1.6 s for the
entrance) in a normal browser.

## Revision: "Please this way only" (owner, same day)

The owner resent the full sample (HTML, CSS and JS). The ring now follows it exactly:

- **Inside of the ring:** the panels stand on the inside of the ring, seen from outside it
  (`rotateY(-i·360/n) translateZ(-r)`, perspective 2000px). The front panel is the farthest
  away and the ones beside it curve towards you, as in the sample.
- **Panels:** 300 × 400 px on desktop (`clamp(8.5rem, 38vw, 18.75rem)` wide, 3:4), on a
  black stage (rounded from 640 px up).
- **Photos only:** the product photo fills the panel, with the name (h3) and price over a
  dark fade at its foot. The whole panel opens the product. The full product card (heart,
  Choose options, Add to bag) is no longer on the ring.
- **10 panels** as in the sample: 8 or more products fill the ring alone; fewer repeat to at
  least 10 (3 → 12, 5 → 10).
- **Parallax** ±40 px; photos scaled 1.3 inside their panels.
- **Fix:** the ring's own box sat in front of the panels and caught the mouse, so hover-dim and
  clicks didn't reach them. Now `pointer-events: none` on the ring, `auto` on the panels.
  Checked on the local site: hover dims the others to half, a click opens the product, a drag
  turns the ring without opening one.
- **Kept:** the ‹ › buttons and counter under the stage (for keyboard and people who don't
  drag); the sample has none.

## Revision 2 (owner, same day)

The owner asked for the site's background, a convex ring, smoother movement, and a click on
any card to open its product.

- **Background:** the black stage is gone; the ring sits on the page's own background.
  Panels have a soft green-tinted shadow.
- **Convex:** the panels stand on the outside of the ring
  (`translateZ(-r) rotateY(rot)` on the ring, `rotateY(i·360/n) translateZ(r)` on each
  panel). The front panel is nearest, and the ones beside it turn away.
- **Smooth:** while dragging, the ring glides after the finger (a 0.5 s `power2.out` tween to
  each new position, as the sample does) instead of jumping with it. Letting go eases it to
  the nearest panel over 1.1 s.
- **Clicks:** checked on the local site that clicking a side panel opens its product
  (Silky Straight Tape-ins).

## Revision 3 (owner, same day)

The owner asked for New arrivals to look like Best rated, a gentler curve and bigger cards.

- **Same look everywhere:** New arrivals has 8 products, so its ring had 8 panels (45° apart)
  and curved more than Best rated (3 products, repeated to 12, 30° apart). Every ring now has
  at least **16 panels** (`FULL_RING`; 3 → 18, 8 → 16, 12 → 24), about 22° apart, so all
  rings look alike and curve gently.
- **Bigger cards:** `--card: clamp(10.5rem, 46vw, 21.5rem)` (344 × 459 px on desktop, was
  300 × 400). Image `sizes` updated.
- **Checked** on the local site: the New arrivals tab shows the same gentle ring as Best rated.

## Revision 4 (owner, same day): cinematic fade

The owner asked for the middle card to be fully clear and the cards to darken towards the
left and right, like a film.

- **Per-panel shade:** each panel has a shade overlay (`.hc-ring-shade`). The script sets
  `--shade` from `shadeFor(angle)`:
  - 0 in the middle;
  - about 0.49 for the next panel (22.5° away), 0.85 at 45°, 0.92 at most;
  - updated every frame as the ring turns, so a panel brightens as it comes to the middle.
- **Gradient within each panel:** darker at the panel's outer edge (`--shade-to: left/right`),
  at 70% strength on the inner edge, in the site's deep green-black (`rgb(4 14 9)`).
- **Reduce motion:** no shade.
- **Checked** on the local site (New arrivals): the middle card is clear, its neighbours are
  dimmer, and the outer ones darker.

## Revision 5 (owner, same day): one gradient across the whole ring, soft ends

The owner asked for smooth ends instead of hard cut-offs, and one gradient across the whole
ring rather than one per card.

- **One gradient:** the darkness is now a function of screen position across the whole ring
  (`screenShade(x, half)`: clear within the middle 12%, then darkening smoothly to 0.9 at
  the ends).
  - Each panel's overlay runs from the value at its left edge to the value at its right edge.
  - The edges come from `panelEdges` (the panel's projected left and right x, using the
    ring's radius and the 2000px perspective), so the fade continues from one panel to the next.
  - Sizes are measured once and on resize, not every frame.
- **Soft ends:** the stage has a `mask-image` (transparent → solid over the outer 12% on each
  side), so the outermost panels melt into the page instead of stopping at a hard edge.
- **Reduce motion:** no mask, no shade.
- **Tests:**
  - `screenShade`: clear middle, symmetric, no jumps;
  - `panelEdges`: neighbours sit edge to edge on screen.
- **Checked** on the local site (New arrivals): the middle card is clear, the sides darken
  across the ring, and both ends fade into the page.

## Revision 6 (owner, same day): a light fade, like the end cards

The owner asked for the sides to grow lighter, in the same see-through way as the end cards,
not darker.

- **Dark shade removed:** the overlay, its script (`panelEdges`, `screenShade`, the size
  measuring) and its tests are gone.
- **One fade for the whole ring:** the stage's `mask-image` does it all. The middle 28% is
  fully clear (36–64%); then 0.8, 0.5 and 0.2 towards each end, and see-through at the very
  edges. So the cards grow lighter towards both ends and melt into the page, with no dark tint
  and no hard edge.
- **Checked** on the local site (New arrivals): a clear centre, light fading sides, soft ends.


## Auto-slide (owner, same day)

The owner asked for Shop by concern and Customer favourites to slide on their own ("with 0.3s"). An interval of 0.3s would be unreadable, so they move every **3s**, as chosen for Best sellers on phones; the owner was told it can change.

- **`src/components/home/use-auto-slide.ts`:** `useAutoSlide(box, onTick, enabled)` calls `onTick` every 3s. It waits while the mouse is over the slider, while something in it has focus, for 6s after a pointer, key or wheel use, off screen, and in a hidden tab, and never runs with "reduce motion".
- **Shop by concern:** moves to the next concern (the 0.9s eased move).
- **Customer favourites:** the ring turns by one card (0.7s glide); the dots follow.
- **Checked** on the local site: the spotlight moved from "Hair loss or full coverage" to "Want more length" by itself. The ring stayed still while the mouse was over it, then turned by itself once the mouse moved away.
