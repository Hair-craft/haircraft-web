# Status: storefront redesign (emerald and gold)

Plan: [`plan`](../plan/2026-10-31-redesign-emerald.md). Testing: [`testing`](../testing/2026-10-31-redesign-emerald.md).

## Done

- **Look, on every page** (`globals.css`, `layout.tsx`):
  - Playfair Display and Plus Jakarta Sans.
  - Deep emerald `#0b291a`, antique gold `#b58b42`; new tokens `cream`, `sage`, `sage-ink`, `muted`, `line` and `deep-hover`.
  - Buttons, badges and product cards (white cards with a View button) are restyled.
- **Announcement bar:**
  - Four still points with gold ✦, no longer a marquee.
  - It shows two on phones, three on tablets and all four on desktop.
- **Header:**
  - White, with the logo and wordmark, and an underline on the current category.
  - A Consultation pill (WhatsApp) on wide screens.
- **Footer:** cream, four columns, with the payment methods as chips.
- **Home page** (`src/components/home/`):
  - Hero with three promise badges and a floating card for the best-rated product.
  - **Find your match** (`shade-matcher.tsx`, `match.ts`, `/bff/match`).
  - Categories in six columns, then bestsellers with pill tabs.
  - One real review (hidden if none).
  - Why HairCraft icon cards, the WhatsApp banner (`layout/consult-banner.tsx`), and our story beside the FAQ.
- **Shop pages** (`listing-page.tsx`, `filter-panel.tsx` `layout="bar"`):
  - A header card with category pills and counts.
  - A toolbar with drop-down filters.
  - A full-width grid, "Showing a–b of N", and the WhatsApp banner with the real policies.
- **Removed:**
  - The stacking "Why" cards, the range explorer, the 3D hero accent, the trust marquee and the promise strip.
  - The `why-*.webp` photos are no longer used; they are still in `public/images/home/`.

- **Product page** (`product-view.tsx`, `content.ts`): two white cards (photos and buying), real promises and delivery lines, the WhatsApp shade help, colour swatches, the folds and the reviews in white cards.

- **The other pages** (bag, checkout, account, orders, wishlist, sign-in, guides, information pages, errors): the same look through shared swaps: white text on deep green, rounded white cards, the warm grey `muted` for secondary text, `line` borders, and smaller semibold Playfair headings.
- **Gold text** uses `#7b5812` (about 6:1 on mint) so small gold labels pass the 4.5:1 contrast rule; the lighter gold stays for icons and stars.

## Not done, on purpose

Claims in the mock-ups that the shop can't back up were left out. See the plan for the list (ratings, customer counts, reply times, "7-day swap", ₹300 off and so on). Each can be added once the owner confirms it.

## Owner to confirm

- The wordmark tagline: "Premium human hair". The mock-up says "Luxury Human Hair Co.".
- The before/after photos for the review section, if wanted.
- The six home photos are still pending (hero and story are used; the four card photos are no longer needed).

## Later the same day

More mock-ups followed and were built: the same-to-same pass (colours, header, footer, cards), the product page, the bag drawer, the search panel, My account, My orders, sign in, sign up and checkout. The plan lists what each one changed and what was left out.

## Tests (2026-10-31)

- Unit tests: 229 passed. Types, lint and formatting are clean.
- Last full browser run: 218 of 219 passed. Failures since then were fixed, and their files reran green:
  - checkout, auth, accessibility and information pages: 44 of 44
  - size filter and screenshots: 6 of 6
- **Still failing: the slow-phone vitals check on the home page.**
  - LCP is about 2.95 s against a 2.5 s budget. It was already failing before the redesign (the hero photo).
  - TBT is about 1.29 s against 0.9 s, up from about 0.94 s because of the new "Find your match" section.
  - The owner is to choose between lightening the hero photo and loading the matcher only when it is scrolled to.
- **"Pay an unpaid order from its page" is occasionally slow:** 4 of 5 on its own, green in the last full runs.
