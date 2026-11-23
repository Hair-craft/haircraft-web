# Status: Shop by concern as a spotlight slider (2026-11-23)

Plan: `dev/plan/2026-11-23-concern-spotlight-slider.md` (approved: "Go ahead", with arrows and
auto-play as written).

## Done

- **`src/components/home/concern-spotlight.tsx`** (client), with the styles in
  `globals.css` (`.hc-spot*`):
  - **Spotlight:** the active concern fills the box, with a dark fade on the left. The one
    before stays full size underneath, so the next grows over it, as in the sample.
  - **Words:** the title, line and "Shop now" (to `/concern/<slug>`) rise in out of a 33px
    blur, 0, 0.3 and 0.6 s after each change (the sample's keyframes; re-keyed on each change).
  - **Waiting cards:** the next 3 wait on the right as small cards (184 × 240 px) with their
    titles. Tapping one brings it in; the rest wait hidden. Every move is 0.5 s.
  - **Moving on:** ‹ › (frosted round buttons at the foot), ← →, or a sideways swipe on
    touch screens (vertical scroll unaffected). It goes round.
  - **Auto-play:** every 6 s. It pauses under the mouse, with focus inside, off screen, in a
    hidden tab, and is off with "reduce motion".
  - **Phones:** a 32rem box, the words at the top, two small cards in the bottom right, and
    the buttons bottom left.
  - **Accessibility:** a labelled carousel, a polite live line on moves made by hand ("2 of 4:
    …"), and a visually hidden list of every concern as a plain link (for search engines and
    screen readers).
- **`src/lib/home/spotlight.ts`:** `spotSlot` and `spotStep`.
- **`ConcernSection`** uses it, with large photos (the concern's own, or its first
  category's). Admin data is unchanged. `concern-carousel.tsx` is kept but no longer used here.

## Checks

| Check | Result |
|---|---|
| Unit tests | 27 files, 264 tests pass, incl. `tests/unit/concern-spotlight.test.ts`. |
| `tsc`, eslint | Clean. |
| Local site, desktop | Shows like the sample; auto-play moved it on. Tapping the "Want more length" card brought it into the spotlight, with the address still `/`. |
| e2e | `home.spec.ts` (links and next/previous going round) and `mobile-home.mobile.spec.ts` (fits the phone) updated. Not run (heavy; ask the owner). |

## Revision: "This effect is so soothing, please use this effect only" (owner, same day)

The slider now follows the sample more closely:

- **No auto-play:** it moves only on ◁ ▷, the arrow keys, a swipe or a tap on a card, as in
  the sample. The pause logic is removed.
- **Waiting cards:** the sample's 200 × 250 px, 20 px apart, starting at the middle of the box
  (`--q: 50%`), with its heavier shadow (`0 30px 50px`).
- **Title:** bold capitals (40px on desktop), as the sample's `.name`.
- **Buttons:** the sample's ◁ ▷: small rounded squares, see-through white with a dark rim,
  growing on hover and focus.
- **Kept:** the soft dark fade on the left. Without it the white title can't be read on the
  shop's light photos.
- **Checked** on the local site: no movement over 14 s; it looks like the sample.

## Revision: "The design should be same" (owner, same day)

The slider now copies the sample's design:

- **Box:** twice as wide as tall (`aspect-ratio: 2/1`, at most 38rem tall), 20px corners,
  `#f5f5f5`, `box-shadow: 0 30px 50px #dbdbdb`.
- **Cards:** 20px corners, `0 30px 50px #505050`, no titles on them; the dark fade is removed.
- **Words:** 100px from the left, 300px wide, system-ui; the name 40px bold capitals; the line
  with 10px above and 20px below; a **"See More"** button (10 × 20px padding, 10px corners,
  `rgba(255,255,255,.673)`, white on hover). It opens the concern's page.
- **One change for the shop's photos:** the sample's light-grey text vanished on the shop's
  white-background photos (checked), so the words are the shop's deep green with a soft white
  glow, which reads on light and dark photos.
- **e2e:** the tests look for "See More".
- **Checked** on the local site: it looks like the sample and the words are clear.

## Revision: the sample's exact motion, arrows without boxes (owner, same day)

- **Exact motion:**
  - every panel has the sample's `transition: all 0.5s` (default ease);
  - small cards are centred the sample's way (`top: 50%; transform: translate(0, -50%)`), and
    full-size panels are `top: 0; left: 0; 100% × 100%; transform: translate(0, 0)`;
  - the queue sits at `50%`, `+220px` and `+440px`, with later ones at `+660px`, invisible.
  - So the movement between places is the sample's own.
- **Words:** the sample's `animate` keyframes (1 s ease-in-out at 0, 0.3 and 0.6 s), as before.
- **◁ ▷:** the box is invisible (no border, no background). Only the arrows show, in the deep
  green with a white glow, 40 × 35, 5px margins, 20px apart and 20px from the foot, as in the
  sample. They grow to 1.1 on hover and focus (0.3 s).
- **Phones:** the small cards' `top` is adjusted for the translate.
- **Checked** on the local site: after ▷ the computed transition is `all 0.5s`, the small cards
  are `translate(0, -125px)` and the full panels `translate(0, 0)`; the button background is
  transparent with no border.

## Revision: the sample's box, cards running outside it (owner, same day)

The owner pointed out that the small cards sat inside the big photo. In the sample the
container has no `overflow: hidden`: it's an 800 × 400px box in the middle, and the waiting
cards (from its middle at 50%, +220px, +440px) run out past its right edge onto the page.

- **Box:** `.hc-spot` is now `width: min(800px, 100%)`, `height: 400px`, centred, with no
  overflow hidden. Cards are 200 × 250px, 20px apart.
- **Page edge:** the section clips sideways (`overflow-x: clip`), so the cards never widen the page.
- **Phones (under 640px):** unchanged. The box is the full width, 32rem tall, with two small
  cards inside at the bottom right (the sample has no phone layout).
- **Checked** on the local site (1536px wide): the box is 800 × 400 in the middle, the second
  card runs past its right edge, the full photo has the sample's dark shadow, and the page
  doesn't scroll sideways.

## Revision: as wide as the screen, slower and softer (owner, same day)

- **Box:** as wide as the screen, 1rem in from each side (`calc(100vw - 2rem)`, breaking out
  of the page's content width), 460px tall.
  - It clips sideways only (`overflow-x: clip`), so a card waiting past the screen edge never
    makes the page scroll sideways (checked: 0px), and the sample's shadow still shows below.
  - Phones keep the content width.
- **Smoother:** the panels move over 0.9s with `cubic-bezier(0.65, 0, 0.35, 1)` (eases in and
  out), instead of the sample's 0.5s.
- **Words:** no text shadows. The rise takes 1.4s, with the line at 0.4s and "See More" at 0.8s.
- **Checked** on the local site (1536px): the box is 1504px wide from 8px, the title has no
  shadow, the transition is 0.9s eased, and the page has no sideways scroll.

## Revision: a little narrower, light shadows, cards at the right edge (owner, same day)

- **Width:** `--bw: min(100vw − 6rem, 1400px)`, centred. That's wider than the page's content
  but not the whole screen: 1400px on a 1536px screen, 3rem in from each side on smaller ones.
- **Shadows:**
  - the big photo has none, so the dark band under the box is gone;
  - the box has a faint green-tinted shadow;
  - the small cards have a light one (`0 18px 36px -12px rgba(0,0,0,.28)`).
- **Small cards at the right edge:** they line up so the last one ends 40px from the box's
  right edge. The script sets `--qn` (how many wait: `waitingCards(count)`, 0–3), and the
  CSS places the first at `100% − 40px − qn·(200 + 20) + 20`.
- **Test:** `waitingCards` matches the number of waiting slots for 1–8 concerns (265 tests pass).
- **Checked** on the local site (1536px): the box is 60–1460px, the last card ends at 1420px
  (40px in), with no dark shade and no sideways scroll.

- **Narrower again** (owner, same day: "lil more narrower"): at most 1300px (was 1400).
- **Then** (owner, same day): at most 1200px wide, 520px tall, and the last small card ends right at the box's edge (was 40px in).
- **Then** (owner, same day: "the small one is outside of the card like the last one"): the cards hang past the edge again, as in the sample. The last waiting card is centred on the box's right edge (half outside). The section is now full width with `overflow-x: clip` (its usual width moved to an inner div), so the hanging card never widens the page. Checked: box 160–1360px, last card 1260–1460px, no sideways scroll.

## Revision: the whole photo in the big card (owner, same day)

The concern photos are portrait, so filling the wide big card cut off the girl and the concern
areas (crown, parting). Each panel now has three layers of the same photo:

- **`hc-spot__photo`** (cover) shows in the small cards;
- **`hc-spot__blur`** (cover, `blur(28px)`, scaled 1.15, 85%) fills the big card;
- **`hc-spot__whole`** (`object-contain`) shows the whole photo, uncropped, in the middle of
  the big card.

They cross-fade over 0.9s as a card grows or shrinks (instantly with "reduce motion"). The
browser fetches the photo once (same URL and size). Checked on the local site: the whole girl
shows in the middle of the big card, with soft blurred sides, the title on the left and the
small cards on the right.

## Revision: two small cards at a time (owner, same day)

- `spotSlot` no longer has a third waiting place: the concern 3 ahead now waits out of sight (`out`). `waitingCards` is at most 2, so the second card still hangs half past the box's edge.
- Unit tests updated (layouts for 6 concerns; `waitingCards` matches the shown cards for 1–8).


## Auto-slide (owner, same day)

The owner asked for Shop by concern and Customer favourites to slide on their own ("with 0.3s"). An interval of 0.3s would be unreadable, so they move every **3s**, as chosen for Best sellers on phones; the owner was told it can change.

- **`src/components/home/use-auto-slide.ts`:** `useAutoSlide(box, onTick, enabled)` calls `onTick` every 3s. It waits while the mouse is over the slider, while something in it has focus, for 6s after a pointer, key or wheel use, off screen, and in a hidden tab, and never runs with "reduce motion".
- **Shop by concern:** moves to the next concern (the 0.9s eased move).
- **Customer favourites:** the ring turns by one card (0.7s glide); the dots follow.
- **Checked** on the local site: the spotlight moved from "Hair loss or full coverage" to "Want more length" by itself. The ring stayed still while the mouse was over it, then turned by itself once the mouse moved away.

## The promise strip under Shop by concern (owner, same day)

The owner gave four points ("No out sourcing / No middle man / Directly from factory / 15+ years of crafting expertise") to run like the strip above the header, rephrased, under Shop by concern.

- `PromiseStrip` in `sections.tsx` uses the same `Marquee` as the top strip (deep green, white capitals, gold ✦ between, 36 s a loop, pauses on hover, still with "reduce motion"), slightly larger. Its label is "Why HairCraft".
- Points (`promiseItems`):
  - "Crafted in our own workshop, never outsourced"
  - "No middlemen, just honest prices"
  - "Straight from our factory to you"
  - "15+ years of hair-crafting expertise"
- It sits in `page.tsx` right after `ConcernSection`, outside its `Suspense`, so it shows even if that section is hidden.
- Checked on the local site: it runs between Shop by concern and Our best sellers.
