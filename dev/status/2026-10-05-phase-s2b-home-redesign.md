# Status: Phase S2b, home page redesign

Tracks progress against [`plan/2026-10-05-phase-s2b-home-redesign.md`](../plan/2026-10-05-phase-s2b-home-redesign.md) (with its 2026-10-06 amendment for 1hairstop.in).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (S2b.1–S2b.13) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build: all clean
- 31 unit tests (8 new) and 28 Playwright tests (all of S2's home tests rewritten for the new page, 8 new) against the real API, all passing
- screenshots at desktop and phone sizes, section by section, reviewed by eye against both references

The review by eye found and fixed four problems (below).

Approved with the recommended options:

- HairCraft's own colours and fonts (mint, deep green, gold; Cormorant and Geist), not the references'
- one 3D accent, desktop only, loaded after the page
- testimonials from real approved reviews only
- placeholder FAQ, "why" claims and story text, marked for the owner to review
- a catalogue photo in the hero for now

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## The page, top to bottom

| #   | Section                    | After          | Motion                                                                                 |
| --- | -------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| 1   | Announcement bar           | both           | slow CSS marquee; pauses on hover                                                      |
| 2   | Split hero                 | gemeriahair.in | CSS rise-in, photo settles from a slight zoom, **3D gold strands** (React Three Fiber) |
| 3   | Trust marquee              | gemeriahair.in | CSS marquee                                                                            |
| 4   | Shop by category (tiles)   | 1hairstop.in   | fade-up on scroll (Framer Motion), photo zoom on hover                                 |
| 5   | Most loved (tabs)          | both           | sliding gold underline, panels cross-fade (Framer Motion)                              |
| 6   | Why women choose HairCraft | gemeriahair.in | cards stick and stack; the card below shrinks and dims as you scroll (**GSAP**)        |
| 7   | Explore our range          | 1hairstop.in   | point at, focus or tap a category; its photo and text cross-fade (Framer Motion)       |
| 8   | Our promises (icon row)    | both           | fade-up on scroll                                                                      |
| 9   | Our story                  | 1hairstop.in   | fade-up on scroll                                                                      |
| 10  | Loved by women like you    | gemeriahair.in | fade-up on scroll; sideways scroll row                                                 |
| 11  | Frequently asked questions | gemeriahair.in | answers open and close smoothly, one at a time                                         |

Headings everywhere follow 1hairstop.in: a small spaced capital "eyebrow" line above a centred serif title.

## What was built

### S2b.1 Announcement bar (`components/layout/announcement-bar.tsx`)

- Dark-green strip above the header on every shop page: "Free shipping above ₹1,999" (from `FREE_SHIPPING_THRESHOLD`; "Free shipping on every order" for `0`, "Tracked delivery across India" when empty) · "100% human hair" · "Secure UPI, card & net banking payments".
- Built on a new **`Marquee`** component (`components/motion/marquee.tsx`): CSS only, no JavaScript. Screen readers hear each message once (the copies that make the loop seamless are hidden from them). It pauses on hover and keyboard focus. With "reduce motion" it stands still, centred, wrapping onto two lines if needed.

### S2b.2 Split hero (`components/home/hero.tsx`, `hero-accent*.tsx`)

- Left: "Premium human hair extensions", the `h1` "Hair extensions, _crafted for confidence_" over two lines, the promise, **Shop all** and **Shop wigs**. Centred on phones.
- Right: the newest product photo in a tall rounded frame, settling from a slight zoom.
- **3D accent:** six thin gold strands drifting slowly either side of the photo, fading out at the top and bottom.
  - Desktop only. It needs a wide screen, a mouse, no "reduce motion" and WebGL; otherwise it never downloads.
  - It is decided after the page has loaded (when the browser is idle), and it stops drawing when the hero is scrolled out of view.
  - Decorative: hidden from screen readers, and it never blocks clicks.

### S2b.3 Trust marquee

"100% human hair · Every length, colour and texture · Hand-checked before it ships · Secure payments · Delivered across India", in large italic serif on a warm sand strip.

### S2b.4 Shop by category

Tall photo tiles with the name, description (desktop) and product count on the photo, as on 1hairstop.in. Two per row on phones, four on desktop.

### S2b.5 Most loved (`product-tabs.tsx`)

- **Best rated** (reviewed products, highest first) and **New arrivals** (8 newest) as tabs over one product grid, with **View all** → `/shop`.
- Proper tabs for keyboard and screen readers: arrow keys, Home and End move between them.
- While no product has reviews there are no tabs, just the new arrivals.
- Cards are centred, so a short list (3 best-rated products today) doesn't leave a gap.

### S2b.6 Why women choose HairCraft (`why-stack.tsx`)

Four large photo-and-text cards (real human hair · comfortable all day · your shade and style · secure payments, tracked delivery). On desktop each card sticks near the top and the next slides over it, while GSAP ScrollTrigger gently shrinks and dims the one underneath. On phones and with "reduce motion" it is a plain list. GSAP is downloaded only after the page loads.

### S2b.7 Our promises

The S2 promise strip, now centred with round icons. Its region is renamed "Our promises" (it was "Why HairCraft", which is now the stacking-cards section).

### S2b.8 Testimonials

- Real approved reviews of the best-rated products: 4 and 5 stars, with a title or text, newest first, at most two per product, at most six.
- **The same words twice are shown once** (see problems found).
- Each shows the stars, the quote, the name, "Verified purchase" when true, and a link to the product.
- The section is hidden when there are no such reviews. Quotes are never invented.

### S2b.9 FAQ

Six questions; the first is open. One answer is open at a time. All answers are also given to search engines as `FAQPage` structured data, open or closed.

### S2b.10 Scroll reveals (`components/motion/reveal.tsx`)

Sections fade up gently as they scroll into view. The content is in the page from the start (search engines and no-JavaScript visitors see everything); only what starts below the first screen is hidden and then revealed. Nothing moves with "reduce motion".

### S2b.12 Explore our range (`range-explorer.tsx`)

The categories as large serif names on the left; pointing at, focusing or tapping one shows its photo, count, description and "Shop &lt;category&gt;" on the right. On phones the panel sits above the names.

### S2b.13 Our story

A photo and text split on the sand background: "Crafted for the way _you_ wear your hair", with **Discover the collection**.

## Placeholders for the owner (before launch)

All in [`src/components/home/content.ts`](../../src/components/home/content.ts) and the story in `sections.tsx`, marked `PLACEHOLDER — FOR THE OWNER`:

- the trust marquee lines and the four "why" cards
- the six FAQ answers (the returns answer says the policy will be published before launch)
- the "Our story" text

They make no claims about years in business, customer numbers, manufacturing or policies; a unit test fails if a number of years or customers appears in them.

Deferred until the owner supplies media: videos, store visit, press logos, founder story, before/after photos, and a real hero photo.

## Speed

Measured on the production build, desktop and Pixel 7, warm cache:

- **First paint:** about 0.2 s (desktop) and 0.15 s (phone).
- **JavaScript for the first screen:** about 194 KB compressed. Framer Motion is about 51 KB of it (the only new library loaded up front); the rest is the React and Next runtime that S2 already loaded. S2 did not record a figure, so this is the baseline from now on.
- **Loaded after the page, only when used:** GSAP about 44 KB (all sizes); three.js and React Three Fiber about 237 KB (desktop with WebGL only, never on phones).

## Problems found and fixed

1. **The hero heading read "Hair extensions,crafted for confidence"** (no space) to screen readers and search engines, because the line break swallowed the space. Fixed; the test checks the exact text.
2. **The 3D strands were invisible**, drawn entirely behind the photo, and when first moved out they were heavy and cut off at the canvas edge. They are now thin, sit either side of the photo, drift in place instead of swinging, and fade out at the edges.
3. **On phones the first testimonial and product card touched the screen edge**: snap scrolling lined them up with the row's edge, ignoring its padding. Fixed with scroll padding.
4. **The same review appeared twice.** The development database has five identical "Gorgeous waves" reviews by Kavya M. on Deep Wave Tape-ins (created minutes apart on 2026-10-05, most likely during Phase 8 review testing). The storefront now shows identical words only once. **The duplicate rows are still in the database**; delete them in the admin panel (Reviews) or leave them, as you prefer.

Also: two S1 header-menu tests looked for a "Clip-in Extensions" button anywhere on the page, and the range explorer now has one too; they now look inside the category menu only.

## Not done / follow-ups

- The owner's own words and photos for the placeholders above.
- The 3D accent's "stops drawing out of view" is checked by reading the code, not by an automated test.
- The duplicate test reviews in the development database (see 4).
