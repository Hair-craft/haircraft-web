# Plan: Phase S15, SEO and performance

**Status: Approved (2026-10-07)** with the recommended options: axe-core for Playwright and Playwright's own speed timings (no Lighthouse); the rating plus up to 5 approved reviews in product data; a Search Console verification setting; indexing off unless `ALLOW_INDEXING=true`; social profiles added when the owner sends them.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on every earlier phase; no backend changes are expected.

## Context

**Much is already in place from earlier phases:**

| Area                         | Already done                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Page titles and descriptions | every page; private pages (account, bag, checkout, sign-in, wishlist) are marked "don't index"                    |
| Canonical addresses          | home, shop, categories (filtered views point to the plain list), products (options share one address), info pages |
| Sitemap                      | home always; shop, categories, products and the information pages while the shop is open                          |
| Structured data              | the site and organisation; products (price range, stock, rating); breadcrumbs; the FAQ                            |
| Images                       | `next/image` everywhere (sized, lazy below the fold); the 3D hero accent loads only in the browser                |
| Motion                       | reduced-motion respected throughout (S2b)                                                                         |

**What's missing or could be better:**

1. **`robots.txt`:**
   - it names `haircraft.in` directly instead of the configured site address
   - it doesn't keep search engines out of private areas (account, checkout, `/bff`)
   - it would let a test or preview copy of the site be indexed
2. **Sharing on WhatsApp, Instagram and Facebook** shows the logo (an odd shape) on every page except products. There's no 1200×630 share image and no large-picture card for X/Twitter.
3. **Google's product listings** can show delivery cost, the returns window and review snippets. The shop now has those facts (S14, B15), but the product data doesn't include them yet. It also has no SKU or per-option offers.
4. **Speed has never been measured** on a phone-like connection. The home page carries the most code (3D accent, GSAP, Framer Motion).
5. **Accessibility has been checked by hand each phase,** but never with an automated audit across every page.
6. **Small things:**
   - the page language is `en` (could be `en-IN`)
   - the site address is written twice (the root layout and `robots.ts`) instead of read from settings
   - the sitemap doesn't list product photos

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S15.1 Catalogue sitemap and robots:**
   - **`robots.txt` from settings:**
     - the configured site address for the sitemap link
     - private paths kept out (`/account`, `/checkout`, `/cart`, `/wishlist`, `/bff`, sign-in pages)
     - everything blocked unless a new setting `ALLOW_INDEXING=true` (on for the live site only), so test and preview copies never appear in Google (open question 4)
   - **The sitemap** lists each product's photos (Google Images), and categories and products get "last changed" dates when the API gives them.
2. **S15.2 Metadata and Open Graph:**
   - **share images:** a branded 1200×630 share image for the home page, shop and information pages; each category's own image (its first product photo, with the category's name); products keep their photo
   - **large-picture cards** for X/Twitter
   - **the site address** read from settings in one place; `lang="en-IN"`
   - an optional Google Search Console verification setting (open question 3)
3. **S15.3 Structured data:**
   - **products:**
     - SKU and one offer per option (price, stock), instead of only a range
     - **delivery details** (charge and free-delivery minimum from B15, delivery times from S14)
     - **the returns policy** (7 days, from S14's rules)
     - up to 5 approved reviews (open question 2)
   - **the organisation:** contact email, return policy and, when given, social profiles (open question 5)
   - **categories:** a list of their products
   - **checked:** every kind validated in tests against Google's required fields
4. **S15.4 Image optimisation:**
   - check every image's `sizes`, so phones never download desktop-sized photos
   - the first big image on each page (the hero, the product's first photo) loaded first (`priority`/`fetchPriority`), and nothing else
   - fixed space for every image so nothing jumps while loading
   - AVIF and WebP served where browsers accept them
5. **S15.5 Core Web Vitals:**
   - **measure first:** a repeatable test that loads the home page, shop, a category, a product, search and the bag as a mid-range phone on a slow 4G connection (Playwright with network and CPU slowed down), and records:
     - **LCP:** how long until the main content shows
     - **CLS:** how much the layout jumps
     - **TBT:** how long the page is too busy to respond, standing in for INP
     - **JavaScript downloaded**
   - **then fix what it finds.** Likely candidates:
     - load the 3D accent, GSAP and Framer Motion only where and when they're needed
     - trim font weights
     - make sure cached API data is reused
   - **budgets** (Google's "good" thresholds) **become tests**, so later changes can't quietly slow the shop down:
     - LCP under 2.5 s
     - CLS under 0.1
     - TBT under 200 ms
     - a JavaScript limit per page
   - **real-user measurement after launch** is decided with hosting in S16 (open question 1)
6. **S15.6 Accessibility audit:**
   - **automated:** an axe-core scan in Playwright (open question 1) of every page type and state, on a computer and a phone:
     - home, shop with filters open, product and its photo viewer, search with suggestions
     - bag, sign-in, register
     - account pages, checkout, payment, order pages, reviews
     - the information pages, errors, Coming soon
   - **fix every serious and critical finding,** and the moderate ones where sensible
   - **by hand:** keyboard-only through a whole purchase; 200% zoom and 320 px wide screens; Windows High Contrast; heading and landmark order
   - **the result** recorded in the status file, and the scan kept as a test
7. **S15.7 Tests, click-through, docs:** status, QC guide, PROGRESS, project doc.

**Out of scope:**

- security headers, error monitoring and hosting analytics (S16)
- paid search, ads or tracking pixels
- other languages
- content writing for SEO (the owner's text, S14)

## Design

Nothing changes visually except fixes the audit calls for (most likely small colour-contrast adjustments, kept within the brand palette).

**How it works:**

- **Share images** are made by Next.js at build time from the logo, brand colours and fonts, with no design tool needed. Categories' images are made when first requested, then cached.
- **The speed test** runs against the production build (as the e2e tests do), so it measures what customers get.
- **Speed limits leave some room:** tests on this computer vary from run to run, so each limit is set somewhat below the "good" threshold, and a run fails only after a repeat.

## Files

```
src/app/robots.ts, src/app/sitemap.ts                     settings-driven; private paths; photos
src/app/opengraph-image.tsx, src/app/(shop)/shop/[category]/opengraph-image.tsx   share images
src/app/layout.tsx                                         site address from settings, en-IN, cards, verification
src/lib/env.ts                                             ALLOW_INDEXING, GOOGLE_SITE_VERIFICATION
src/lib/product/structured-data.ts, src/lib/seo/…          offers per option, delivery, returns, reviews, organisation, category list
src/components/…                                           image sizes/priority; lazy-loaded motion; audit fixes
tests/unit/seo.test.ts
tests/e2e/seo.spec.ts, tests/e2e/a11y.spec.ts, tests/e2e/a11y.mobile.spec.ts, tests/e2e/vitals.spec.ts
dev/status/…-phase-s15-…, dev/testing/…-phase-s15-…, dev/PROGRESS.md
```

## Testing

1. **Unit:**
   - robots for the live site, a preview and while closed
   - structured data: required fields; delivery and returns from the rules; offers per option; reviews only when approved
   - sitemap entries
2. **Playwright:**
   - **robots and sitemap** on the test servers
   - **every share image** answers 1200×630
   - **every page's metadata** (title, description, canonical, share image)
   - **structured data** parses and has Google's required fields
   - **axe-core** on every page type, on desktop and phone
   - **speed budgets** on a slowed-down phone
3. **By eye:**
   - share previews (how a link looks in WhatsApp and on X), using each service's preview tool once the site is live, and the generated images now
   - before-and-after speed numbers in the status file

## Risks

- **Speed numbers vary on this computer.** Limits leave room and repeat before failing. The real measure is real users after launch (S16).
- **Audit fixes could touch the look:** colour changes stay within the brand palette and are shown in screenshots before and after.
- **Blocking indexing by default:** if `ALLOW_INDEXING` isn't set on the live site, Google won't index it. It goes on the S16 launch checklist, and the robots test shows the difference.

## Open questions

1. **Tools added for testing only** (they don't ship to customers): Recommended: **axe-core for Playwright** (the standard accessibility checker), and speed measured with Playwright's own browser timings rather than installing Lighthouse. That gives the same Core Web Vitals with one small tool. The alternative is adding Lighthouse CI as well, which is larger and slower but produces Google's familiar score reports.
2. **Reviews in Google's product results.** Recommended: **yes**: the rating (already there) plus up to 5 approved reviews per product, which Google may show as stars and quotes in search. The alternative is the rating only.
3. **Google Search Console.** Recommended: **add a setting** for its verification code (`GOOGLE_SITE_VERIFICATION`). You create the Search Console account at launch and paste the code into the settings, then submit the sitemap there. The alternative is verifying through your domain's DNS instead (no setting needed).
4. **Keeping test and preview copies out of Google.** Recommended: **indexing off unless `ALLOW_INDEXING=true`**, set only on the live site. The alternative is to allow indexing everywhere and rely on preview addresses not being found.
5. **Social profiles** (Instagram, Facebook, YouTube, Pinterest…). Recommended: **send the links when you have them.** They go into the organisation's structured data (so Google links them to HairCraft) and the footer. Until then they're left out. The alternative is skipping them.
