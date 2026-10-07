# Plan: Phase S2b, home page redesign (reference: gemeriahair.in)

**Status: Approved (2026-10-05)** with the recommended options: HairCraft colours, one desktop-only 3D accent, real reviews as testimonials, placeholder FAQ and claims marked for review, catalogue hero photo for now.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). It reworks the S2 home page after the owner's request (2026-10-05) to follow the layout and feel of [gemeriahair.in](https://gemeriahair.in/), with small, tasteful animations (Framer Motion, GSAP, React Three Fiber), keeping it "decent and simple".

## What the reference does (studied 2026-10-05, desktop and phone screenshots)

Top to bottom:

1. **Announcement bar:** "Free shipping over ₹599", scrolling slowly (a marquee).
2. **Header:** centred logo, menu left, search and cart right. A thin "Loved by 200,000+ women since 2013" strip under it.
3. **Hero, split:** small caps line, a bold headline with one **outlined** word ("Compromises"), a one-line promise, and a large lifestyle photo on the right (photo below the text on phones). Soft grey background.
4. **Trust marquee:** "10+ Years Wig Making Expertise · In-House Manufacturing", scrolling.
5. **Shop by concern:** four tall photo tiles with captions on the photo.
6. **Real results:** a sideways strip of short before/after videos.
7. **Visit our atelier:** a large photo with text.
8. **Most loved:** product cards with **Best sellers / New arrivals** tabs.
9. **Why women trust us:** large image + text cards that **stack as you scroll** (sticky).
10. **Icon row:** easy returns, delivery, WhatsApp support, in-house manufacturing.
11. **Featured in:** press logos.
12. **Testimonials:** customer quotes in a sideways strip.
13. **Why we exist:** brand story with a photo.
14. **Explore our solutions:** a photo grid of categories.
15. **FAQ:** an accordion.
16. **Footer.**

**Feel:**

- lots of white space and neutral backgrounds
- one clean sans-serif typeface
- photos do the talking
- motion is gentle: marquees, fade-in on scroll, sticky stacking

The reference uses **no GSAP, no 3D and no canvas**; its liveliness comes from photos, videos and simple CSS motion.

## Scope

**In scope:** the home page rebuilt in that spirit, with HairCraft's own content and brand. Small steps:

1. **S2b.1 Announcement bar** (every page, above the header):
   - a slow marquee: free shipping above ₹1,999 · 100% human hair · secure payments
   - pauses on hover and for reduced motion
2. **S2b.2 Hero, split:**
   - small caps line, headline with one outlined (or gold) word, promise line, **Shop all / Shop wigs**
   - a large photo on the right (on phones, the photo comes after the text)
   - staggered fade-up of the text (Framer Motion) and a slow zoom of the photo
   - one small 3D accent (open question 2)
3. **S2b.3 Trust marquee:** e.g. "100% human hair · Hand-finished · Shipped across India · Secure payments", in the reference's style.
4. **S2b.4 Shop by category:** tall photo tiles (four across, two per row on phones), caption on the photo, a gentle zoom on hover, fade-in as they scroll into view.
5. **S2b.5 Most loved, tabbed:**
   - **Best rated / New arrivals** tabs over one product grid, using the S2 product card
   - an animated tab underline and a soft cross-fade between tabs
   - keyboard-accessible tabs
6. **S2b.6 Why HairCraft, stacking cards:**
   - three or four large cards (photo + short text, e.g. "Looks like real hair, because it is", "Comfortable all day", "Matched to your shade") that stick and stack as you scroll
   - GSAP ScrollTrigger on desktop; on phones and for reduced motion, a simple list
7. **S2b.7 Icon row:** the S2 promises (human hair, free shipping, secure payments, help), restyled like the reference's icon row.
8. **S2b.8 Testimonials:**
   - real approved reviews from the catalogue (quote, first name and initial, stars, product)
   - shown in a sideways strip
   - hidden when there are none
9. **S2b.9 FAQ accordion:**
   - 5–6 common questions (care, how long extensions last, colouring, choosing length, delivery, returns), with smooth open and close
   - FAQ structured data for search engines
   - wording is a placeholder until you confirm it (open question 4)
10. **S2b.10 Scroll reveals:** sections fade and rise in once as they enter the screen, all through one small helper so the motion is consistent.
11. **S2b.11 Tests, click-through, docs:**
    - S2's tests adapted
    - new tests for the tabs, accordion, marquee pause and reduced motion
    - a performance check: first screen load and JavaScript size compared with S2
    - status and QC guide

**Left out until you have the material:**

- the before/after videos
- the store-visit section
- "Featured in" press logos
- the founder story

The layout has room for them; each can be added in a small step later.

## Approach

- **Brand:** keep HairCraft's colours (mint, deep green, gold) and Cormorant/Geist type, but adopt the reference's layout, spacing and calm rhythm: more white, bigger photos, fewer boxes (open question 1).
- **Motion libraries**, each used where it is best:
  - **Framer Motion** (already installed): reveals, the hero entrance, tabs and the accordion. Small, and React-friendly.
  - **GSAP + ScrollTrigger:** the stacking cards only, which need precise pinned-scroll behaviour.
  - **React Three Fiber (three.js):** one small 3D accent in the hero (open question 2). three.js is large (about 150 kB compressed), so it is **lazy-loaded after the page is visible, desktop only, paused when off-screen**, and never shown with reduced motion. The page never waits for it.
- **Everyone, every device:**
  - every animation respects "reduce motion"
  - nothing important is hidden behind an animation (content renders on the server, the motion only decorates it)
  - phones get lighter versions (no 3D, no pinned scrolling)
- **Speed budget:**
  - the first screen must not get slower than S2
  - the extra JavaScript for the home page stays under about 60 kB compressed, without the lazily loaded 3D accent
  - measured and reported in the status file
- **Data:**
  - testimonials come from the existing public review endpoints: the reviews of the best-rated products, combined and cached (no backend change)
  - everything else is unchanged from S2

## Files (new or changed)

```
package.json                                gsap, @react-three/fiber, three (+ types)
src/components/layout/announcement-bar.tsx  every page
src/components/home/*                        hero (split), marquee, category tiles, tabbed products,
                                             stacking cards (GSAP), icon row, testimonials, FAQ, reveal helper
src/components/home/hero-accent.tsx          the lazy 3D accent (React Three Fiber)
src/app/(shop)/page.tsx                      new section order
src/lib/api/catalog.ts                       featured reviews
tests/unit/*, tests/e2e/home.spec.ts         adapted + new
dev/status/…-phase-s2b-…, dev/testing/…-phase-s2b-…, dev/PROGRESS.md
```

## Verification

1. typecheck, lint, format and build: clean; all earlier tests still pass.
2. **Unit tests:** marquee and FAQ data, testimonial selection (approved only, short quotes, no surnames), the reduced-motion rules.
3. **Playwright:**
   - the sections in order, with real data
   - tabs switch with mouse and keyboard
   - the FAQ opens and closes
   - the marquee pauses on hover
   - reduced-motion mode shows everything without animation
   - phones: no sideways page scroll (the S2 check), no 3D canvas, no pinned scrolling
   - API down: the calm states
4. **Click-through:**
   - desktop and phone screenshots, plus a short scroll recording to check the motion feels smooth
   - side by side with the reference for layout and spacing
5. **Performance:** first-screen time and JavaScript size compared with S2, reported.

## Open questions

1. **Colours.** Recommended: **keep HairCraft's mint, deep green and gold**, adopting the reference's layout and calm spacing (it is your brand, already on the live coming-soon page). The alternative is to switch to the reference's neutral white and grey look.
2. **The 3D accent (React Three Fiber).** The reference has none, and 3D is heavy on phones. Recommended: **one small, slow 3D accent in the hero on desktop only** (e.g. softly floating gold strands or a glossy ribbon of "hair" catching the light), lazy-loaded, paused off-screen and absent with reduced motion. The alternative is to skip 3D and keep the page lighter.
3. **Testimonials.** Recommended: **real approved reviews from the catalogue** (honest, and they grow with the shop). The alternative is hand-written quotes you supply.
4. **FAQ wording and the "Why HairCraft" claims.** Recommended: **I write sensible placeholder answers and claims now** (care, durability, colouring, sizing, delivery, returns), clearly marked for your review before launch. Claims like "10+ years" or "in-house manufacturing" are used only if you confirm they are true.
5. **Hero photo.** As in S2: **a catalogue photo for now**, replaced by a lifestyle photo (a person wearing HairCraft hair, like the reference) when you have one. That photo is the single biggest step towards the reference's look.

## Amendment (2026-10-06): second reference, 1hairstop.in

The owner added [1hairstop.in](https://1hairstop.in/) as a second reference while S2b was being built. It shares the calm, photo-led style; we take these ideas from it:

- **Centred section headings with a small caps line above** (e.g. "Be your own hair stylist" over "100% human hair for every need"), used for every home section.
- **S2b.12 Range explorer** (from "Industry-leading solutions for your hair"):
  - large category names listed on the left; hovering or choosing one cross-fades the photo and its short description on the right (Framer Motion)
  - keyboard- and touch-friendly
  - on phones, the photo sits above the list
- **S2b.13 Our story block** (from "Our story"): a split photo-and-text block on a warm sand background. The text is a placeholder for the owner's own story, clearly marked, like the FAQ.

Not taken, for now (they need the owner's own media): shoppable video reels and before/after transformation strips.

Section order after the amendment:

1. announcement bar
2. split hero
3. trust marquee
4. shop by category
5. most loved (tabs)
6. why HairCraft (stacking cards)
7. range explorer
8. icon row
9. our story
10. testimonials
11. FAQ
