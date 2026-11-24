# Status: Phase 1, home page visuals (2026-11-24)

Plan: `nestjs-haircraft/dev/plan/2026-11-24-home-updates-and-gst-invoices.md`, Phase 1
(approved: "Yes, start with Phase 1").

## Done

- **Customer favourites as a Photo Deck** (`components/home/photo-deck.tsx`,
  `lib/home/photo-deck.ts`), one deck per tab (up to 8 Best rated, 8 New arrivals). Rebuilt
  from 21st.dev's description with framer-motion; its source needs an account.
  - **Prints:** a stack of photo prints, fanned left and right behind the top one.
  - **Moving:** drag or flick (more than 80px), ‹ ›, or ← →. The top print flies off with a tilt;
    going back flies the previous one in from the left.
  - **Counter:** "03 / 08" rolls like an odometer.
  - **Caption:** hands over line by line: name, short line, price, **Shop now**.
  - **Auto-slide:** every 3s (`useAutoSlide`).
  - **Reduce motion:** fades only.
  - The deck's area clips sideways: at 375px the fanned prints made the page 403px wide
    (found while checking).
- **Short line:** the API's product cards now carry `summary` (the short description, else
  the headline, else null), used by the deck.
- **Best sellers:** the hover numbers are removed.
- **Running lines:** "Exclusively Crafted In-House", "From Our Hands to Yours", "Direct
  from Our Factory", "15+ Years of Crafting Excellence".
- **Banners:** `public/images/home/hero-banner-desktop.webp` and `-mobile.webp`, from the
  owner's SVGs (2240 × 1260, WebP q88, 98 KB and 114 KB, down from 2.7 MB each). The hero
  uses a `<picture>` (`getImageProps`, art direction): desktop from 768px, mobile below.
  Each screen preloads only its own (`preload` with a media query, `fetchPriority: high`).

## Checks

| Check | Result |
|---|---|
| Shop unit tests | Pass (incl. the new `tests/unit/photo-deck.test.ts`). |
| `tsc`, eslint | Clean. |
| API | Unit 374 pass; catalog e2e 49 pass (the card test now includes `summary`). |
| Local site, desktop | Desktop banner; new running lines; deck with counter, name, price, Shop now; Next moved to the next product; no Best seller numbers. |
| Local site, 375px | Mobile banner (the whole table); page 375px wide. |
| Short line | Not seen locally: the local API wasn't restarted. Covered by the e2e test; check after the deploy. |

## Update: the banner SVGs as is, framed hand to stand (owner, 2026-11-24)

- The hero uses the owner's SVG files themselves (`public/images/home/hero-banner-desktop.svg`
  and `-mobile.svg`, 2.7 MB each) instead of the WebP copies, which are removed. Uploaded
  banners from the admin still go through next/image.
- **Framing:** from her raised hand at the top down to the table's stand.
  - From tablets up, the banner is as tall as the screen allows (`min(48vw, 100svh − 7.5rem)`)
    and the picture is sized by its height on the right, so the stand is above the fold and
    the sliding panel.
  - On phones there is a square window on the stylist and the table (4:3 from 640 px), under
    the words rather than behind them. A strip of the banner's green (`#e0e9d2`) sits under the
    stand for the panel to cover.
- **Cost:** each screen downloads 2.7 MB for the banner (the WebP was about 100 KB), so the
  home page's largest picture loads more slowly, mostly on phones.
