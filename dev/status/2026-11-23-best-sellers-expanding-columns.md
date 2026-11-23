# Status: Best sellers as expanding columns with a quick view (2026-11-23)

Plan: `dev/plan/2026-11-23-best-sellers-expanding-columns.md` (approved: "Go ahead", 5 columns).

## Done

- **`src/components/home/best-seller-columns.tsx`** (client), with the styles in
  `globals.css` (`.hc-cols`, `.hc-col*`), ported from the sample:
  - 5 tall photo columns (`getBestSellers(5)`), the name in the middle;
  - **rise-in** when the section comes into view: each column 0.1 s after the last, with the
    photo moving the other way;
  - **hover:** the box dims and the hovered column brightens, and its number rises from the foot;
  - **click:** the column slides left (0.6 s) and widens to full (0.7 s) while the others shrink
    to half and fade. The quick view then fades in.
  - **close:** ✕, Esc or the back button (opening adds a history step with the **same
    address**). Focus goes back to the column.
- **The quick view:**
  - the product page's own `ProductView` (gallery, options, stock, Add to bag, Buy now,
    heart, details), loaded by the server action `quickView(slug)`
    (`src/lib/home/quick-view.ts`) while the column grows;
  - `ProductView` has a new `quickView` option: it doesn't write the chosen option into the
    address, the name is an h2 that labels the dialog, and the rating isn't a link to
    `#reviews`.
- **Columns are still real links** to the product, for search engines and Ctrl/⌘-click (a
  new tab). A plain click opens the quick view instead. They carry `data-no-progress`, so the
  top loading bar doesn't start (found while checking).
- **Phones:** the names read upwards on the narrow strips.
- **Reduce motion:** no transitions.

## Customer favourites (owner, mid-build)

The ring's ‹ › arrows and "1 / 3" counter are replaced by dots, one per product. The dot for
the product at the front is a filled pill; tapping a dot turns the ring the short way to the
nearest panel showing that product. The ← → keys still work. The phone e2e test now clicks a dot.

## Checks

| Check | Result |
|---|---|
| Unit tests | 26 files, 260 tests pass, incl. `tests/unit/quick-view.test.ts` (product and safe description, bad slug, gone and API-down messages). `vi.fn` with rejected promises misbehaved there, so the mock is a plain function. |
| `tsc`, eslint | Clean. |
| Local site, desktop | 5 columns rise in. Clicking Hair Topper grew it and showed its details; the address stayed `/` and focus moved to ✕. Esc closed it and focus went back to the column. |
| Local site, dots | Tapping dot 2 turned the ring to product 2, and dot 2 became the pill. |
| Phone e2e | Not run (heavy; ask the owner). |

## Phones: an auto-opening accordion (owner, same day)

The owner asked for the first column to stand open on phones, with the next ones opening one
by one automatically. Timing (owner's choice): each opens in 0.3s and stays open about 3s.

- **Layout under 640px:** the columns sit in a flex row, 0.5rem apart, `min(78svh, 34rem)`
  tall.
  - The open column (`data-wide`) has `flex-grow: 5` and shows its name across the foot.
  - The others are narrow strips, with names reading upwards.
  - Opening is a 0.3s `flex-grow` transition.
- **Moving on:** the script moves the open column every 3s (`WIDE_MS`), going round. It waits
  while a quick view is open, for 6s after a touch, off screen, in a hidden tab, and with
  "reduce motion". Desktop is unchanged.
- **Quick view on phones:** tapping a column still opens it. That column takes the whole box
  and the others fold to nothing (checked: active 343px = box 343px; "Oval Topper with Bangs"
  showed; address `/`).
- **Fixes found while checking:**
  - the open column's name flipped late, after the desktop 1.2s transform delay; on phones only
    the fade is delayed now;
  - the strips have less padding, so their names fit.
- Checked in a 390px frame on the local site.

- **Shorter on phones, with the whole photo** (owner, same day):
  - the open column takes 8 of 12 shares of the width (the strips one each);
  - the box is `(100vw − 4rem − 2rem) × 8/12 × 1.25` tall, 272px on a 390px phone (was about
    34rem);
  - the photo layer has no extra 5% above and below (`inset: 0`).
  - Checked in a 390px frame: the open column is about 204 × 272px, which shows the whole
    3:4 product photo (390 × 520) with nothing cut off, and the strips show their names.

## Phones: the quick view as a full-screen sheet (owner, same day)

The owner reported the quick view wasn't mobile friendly; it opened inside the 272px column.

- **Under 640px:** tapping a column opens the product view as a full-screen sheet (`createPortal` to `body`, `.hc-col__sheet`). It slides up in 0.3s and the page behind stops scrolling. ✕, Esc and back close it. The columns stay as they are, with no grow.
- **Desktop:** unchanged.
- **Checked** in a 390px frame: the sheet is 390 × 780; Round Topper's gallery, price and options are full width; the address stays `/`; the page doesn't scroll sideways.
