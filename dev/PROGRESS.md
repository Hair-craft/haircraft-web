# Storefront: progress tracker

One page to see how far the customer storefront is. Each phase is split into small steps; tick them as they are done. Details are in the linked plan, status and testing files.

**Last updated:** 2026-10-07 · **Phases built:** 13 of 17, plus the S2b home redesign · **QC sign-off:** 0 of 17 · **Roadmap:** [approved 2026-10-05](plan/2026-10-05-storefront-roadmap.md)

Legend: ✅ done · 🔄 in progress · 📝 plan awaiting review · ⏳ not started

## Overview

| #    | Phase                                                         | Plan                                                      | Built                                                                                         | Finished without errors? | Tests (unit / e2e)                         | QC                                                            |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| S1   | Foundation                                                    | ✅ [plan](plan/2026-10-05-phase-s1-foundation.md)         | ✅ 2026-10-05 · [status](status/2026-10-05-phase-s1-foundation.md)                            | ✅ yes                   | 16 / 12                                    | ⏳ [guide](testing/2026-10-05-phase-s1-foundation.md)         |
| S2   | Home page                                                     | ✅ [plan](plan/2026-10-05-phase-s2-home-page.md)          | ✅ 2026-10-05 · [status](status/2026-10-05-phase-s2-home-page.md)                             | ✅ yes                   | 23 / 20                                    | ⏳ [guide](testing/2026-10-05-phase-s2-home-page.md)          |
| S2b  | Home page redesign (references: gemeriahair.in, 1hairstop.in) | ✅ [plan](plan/2026-10-05-phase-s2b-home-redesign.md)     | ✅ 2026-10-06 · [status](status/2026-10-05-phase-s2b-home-redesign.md)                        | ✅ yes                   | 31 / 28                                    | ⏳ [guide](testing/2026-10-05-phase-s2b-home-redesign.md)     |
| S3   | Product listing                                               | ✅ [plan](plan/2026-10-06-phase-s3-product-listing.md)    | ✅ 2026-10-06 · [status](status/2026-10-06-phase-s3-product-listing.md)                       | ✅ yes                   | 49 / 47 (+ backend 306 / 260)              | ⏳ [guide](testing/2026-10-06-phase-s3-product-listing.md)    |
| S4   | Search                                                        | ✅ [plan](plan/2026-10-06-phase-s4-search.md)             | ✅ 2026-10-06 · [status](status/2026-10-06-phase-s4-search.md)                                | ✅ yes                   | 59 / 61 (+ backend 310 / 269)              | ⏳ [guide](testing/2026-10-06-phase-s4-search.md)             |
| S5   | Product page                                                  | ✅ [plan](plan/2026-10-06-phase-s5-product-page.md)       | ✅ 2026-10-06 · [status](status/2026-10-06-phase-s5-product-page.md)                          | ✅ yes                   | 69 / 72                                    | ⏳ [guide](testing/2026-10-06-phase-s5-product-page.md)       |
| S6   | Sign-in and register                                          | ✅ [plan](plan/2026-10-06-phase-s6-sign-in.md)            | ✅ 2026-10-06 · [status](status/2026-10-06-phase-s6-sign-in.md)                               | ✅ yes                   | 83 / 86                                    | ⏳ [guide](testing/2026-10-06-phase-s6-sign-in.md)            |
| S7   | Cart                                                          | ✅ [plan](plan/2026-10-06-phase-s7-cart.md)               | ✅ 2026-10-06 · [status](status/2026-10-06-phase-s7-cart.md)                                  | ✅ yes                   | 95 / 98 (+ backend 310 / 273)              | ⏳ [guide](testing/2026-10-06-phase-s7-cart.md)               |
| S8   | Wishlist                                                      | ✅ [plan](plan/2026-10-06-phase-s8-wishlist.md)           | ✅ 2026-10-06 · [status](status/2026-10-06-phase-s8-wishlist.md)                              | ✅ yes                   | 107 / 110 (no backend change)              | ⏳ [guide](testing/2026-10-06-phase-s8-wishlist.md)           |
| B9   | _Backend:_ edit profile                                       | ✅ [plan](plan/2026-10-06-phase-b9-edit-profile.md)       | ✅ 2026-10-06 · [status](status/2026-10-06-phase-b9-edit-profile.md)                          | ✅ yes                   | backend 316 / 282                          | ⏳ [guide](testing/2026-10-06-phase-b9-edit-profile.md)       |
| S9   | My account                                                    | ✅ [plan](plan/2026-10-07-phase-s9-my-account.md)         | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s9-my-account.md)                            | ✅ yes                   | 122 / 122 (no backend change)              | ⏳ [guide](testing/2026-10-07-phase-s9-my-account.md)         |
| S10  | Checkout                                                      | ✅ [plan](plan/2026-10-07-phase-s10-checkout.md)          | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s10-checkout.md)                             | ✅ yes                   | 131 / 138 (no backend change)              | ⏳ [guide](testing/2026-10-07-phase-s10-checkout.md)          |
| S11  | Payment                                                       | ✅ [plan](plan/2026-10-07-phase-s11-payment.md)           | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s11-payment.md)                              | ✅ yes                   | 142 / 145 (+ backend 317 / 287)            | ⏳ [guide](testing/2026-10-07-phase-s11-payment.md)           |
| S12  | My orders                                                     | ✅ [plan](plan/2026-10-07-phase-s12-my-orders.md)         | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s12-my-orders.md)                            | ✅ yes                   | 152 / 158 (no backend change)              | ⏳ [guide](testing/2026-10-07-phase-s12-my-orders.md)         |
| S13  | Reviews                                                       | ✅ [plan](plan/2026-10-07-phase-s13-reviews.md)           | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s13-reviews.md)                              | ✅ yes                   | 158 / 167 (no backend change)              | ⏳ [guide](testing/2026-10-07-phase-s13-reviews.md)           |
| S13b | Review photos and featured reviews (+ B14, admin)             | ✅ [plan](plan/2026-10-07-phase-s13b-review-photos.md)    | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s13b-review-photos.md)                       | ✅ yes                   | 159 / 171 (+ backend 317 / 292, admin 472) | ⏳ [guide](testing/2026-10-07-phase-s13b-review-photos.md)    |
| S14  | Information pages (+ B15)                                     | ✅ [plan](plan/2026-10-07-phase-s14-information-pages.md) | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s14-information-pages.md) (drafts)           | ✅ yes                   | 176 / 189 (+ backend 320 / 294)            | ⏳ [guide](testing/2026-10-07-phase-s14-information-pages.md) |
| S15  | SEO and performance                                           | ✅ [plan](plan/2026-10-07-phase-s15-seo-performance.md)   | ✅ 2026-10-07 · [status](status/2026-10-07-phase-s15-seo-performance.md) (TBT target not met) | ✅ yes                   | 194 / 204                                  | ⏳ [guide](testing/2026-10-07-phase-s15-seo-performance.md)   |
| S15b | SEO content and keywords (owner request)                      | ✅ [plan](plan/2026-10-08-phase-s15b-seo-content.md)      | ✅ 2026-10-08 · [status](status/2026-10-08-phase-s15b-seo-content.md) (drafts)                | ✅ yes                   | 207 / 211                                  | ⏳ [guide](testing/2026-10-08-phase-s15b-seo-content.md)      |
| S16  | Launch readiness (+ B16)                                      | 📝 [plan](plan/2026-10-08-phase-s16-launch-readiness.md)  | ⏳                                                                                            | —                        | —                                          | ⏳                                                            |

"Finished without errors" means that when the phase was handed over, all of these passed:

- typecheck, lint, formatting and the production build
- every unit and Playwright test, earlier phases included
- a screenshot click-through reviewed by eye

## Steps per phase

### S1 Foundation

- [x] S1.1 Tooling: scripts, Prettier, Vitest, Playwright, port 3001, `.env.example`
- [x] S1.2 Validated configuration (`API_BASE_URL`, `STORE_OPEN`, `SITE_URL`)
- [x] S1.3 Typed server-side API client and error type
- [x] S1.4 Session-cookie (BFF) skeleton
- [x] S1.5 Coming-soon gate (`proxy.ts`)
- [x] S1.6 Shop layout: header with categories, mobile menu, footer
- [x] S1.7 UI components (button, inputs, price, skeleton, dialog, drawer, toast)
- [x] S1.8 404, error and "API unreachable" states
- [x] S1.9 Images from local uploads and Cloudinary
- [x] S1.10 Tests, click-through, status, testing guide

### S2 Home page

- [x] Plan approved
- [x] S2.1 Product card (photo, price range, sale, sold out, rating)
- [x] S2.2 Hero
- [x] S2.3 Shop by category with photos
- [x] S2.4 New arrivals
- [x] S2.5 Best rated
- [x] S2.6 Brand promise strip
- [x] S2.7 SEO (metadata, structured data)
- [x] S2.8 Streaming sections, skeletons, API-down state
- [x] S2.9 Tests, click-through, status, testing guide

### S2b Home page redesign (references: gemeriahair.in, 1hairstop.in)

- [x] Plan approved
- [x] S2b.1 Announcement bar
- [x] S2b.2 Split hero (+ 3D accent if approved)
- [x] S2b.3 Trust marquee
- [x] S2b.4 Category photo tiles
- [x] S2b.5 Most loved, tabbed
- [x] S2b.6 Why HairCraft, stacking cards
- [x] S2b.7 Icon row
- [x] S2b.8 Testimonials from real reviews
- [x] S2b.9 FAQ accordion
- [x] S2b.10 Scroll reveals
- [x] S2b.12 Range explorer (from 1hairstop.in)
- [x] S2b.13 Our story block (from 1hairstop.in)
- [x] S2b.11 Tests, performance check, click-through, docs

### S3 Product listing

- [x] Plan approved
- [x] B10 (backend) Filter options endpoint (if approved)
- [x] S3.1 Routes: `/shop` and `/shop/[category]`
- [x] S3.2 Page header: breadcrumbs, heading, sub-category chips, count
- [x] S3.3 Product grid
- [x] S3.4 Filters: length, colour, texture, price, in stock; active chips
- [x] S3.5 Sort
- [x] S3.6 Pagination
- [x] S3.7 Address (URL) state
- [x] S3.8 Phone filter panel
- [x] S3.9 Empty and error states
- [x] S3.10 SEO
- [x] S3.11 Tests, click-through, docs

### S4 Search

- [x] Plan approved
- [x] B11 (backend) Smarter search, suggestions, did-you-mean (if approved)
- [x] S4.1 Header search with suggestions
- [x] S4.2 Suggestions route (BFF)
- [x] S4.3 Results page
- [x] S4.4 No-results help
- [x] S4.5 SEO and privacy
- [x] S4.6 Tests, click-through, docs

### S5 Product page

- [x] Plan approved
- [x] S5.1 Route and breadcrumbs
- [x] S5.2 Gallery (thumbnails, swipe, full-screen view)
- [x] S5.3 Variant picker
- [x] S5.4 Price and stock
- [x] S5.5 Details
- [x] S5.6 Rating summary and reviews list
- [x] S5.7 Related products
- [x] S5.8 SEO (structured data, sitemap)
- [x] S5.9 Tests, click-through, docs

### S6 Sign-in and register

- [x] Plan approved
- [x] S6.1 Register
- [x] S6.2 Sign in
- [x] S6.3 Session in the BFF (cookies, refresh)
- [x] S6.4 Sign out (this device, everywhere)
- [x] S6.5 Protected routes (account placeholder)
- [x] S6.6 Header account menu
- [x] S6.7 Tests, click-through, docs

### S7 Cart

- [x] Plan approved
- [x] B12 (backend) Guest cart preview (if approved)
- [x] S7.1 Add to bag (product page)
- [x] S7.2 Cart drawer and page
- [x] S7.3 Quantities
- [x] S7.4 Cart problems (stock, unavailable, price changed)
- [x] S7.5 Guest cart and merge on sign-in
- [x] S7.6 Tests, click-through, docs

### S8 Wishlist

- [x] Plan approved
- [x] S8.1 Heart toggle (cards, product page, guests)
- [x] S8.2 Filled hearts and header count
- [x] S8.3 Wishlist page
- [x] S8.4 Move to bag
- [x] S8.5 Tests, click-through, docs

### B9 Backend: edit profile (in `nestjs-haircraft`)

- [x] Plan approved
- [x] B9.1 `PATCH /profile` and `PATCH /admin/profile`
- [x] B9.2 Tests, docs

### S9 My account

- [x] Plan approved
- [x] S9.1 Account layout (overview, profile, addresses, security pages)
- [x] S9.2 Overview
- [x] S9.3 Profile view and edit
- [x] S9.4 Address book
- [x] S9.5 Change password and sign out everywhere
- [x] S9.6 Tests, click-through, docs

### S10 Checkout

- [x] Plan approved
- [x] S10.1 Opening checkout (sign-in, empty bag)
- [x] S10.2 Delivery address
- [x] S10.3 Coupon
- [x] S10.4 Payment method and summary
- [x] S10.5 Place order (idempotency, price changed)
- [x] S10.6 Confirmation page
- [x] S10.7 Tests, click-through, docs

### S11 Payment (with backend B13)

- [x] Plan approved
- [x] B13 (backend) Stand-in Razorpay for tests and demos
- [x] S11.1 Pay after placing (Razorpay's window)
- [x] S11.2 Success (verify, confirmed)
- [x] S11.3 Failure and retry
- [x] S11.4 Pay later from the order's page
- [x] S11.5 Without JavaScript
- [x] S11.6 Tests and docs (the real test-mode payment by hand is in the QC guide)

### S12 My orders

- [x] Plan approved
- [x] S12.1 Orders list (filters, pages)
- [x] S12.2 Order page (progress, tracking, payment panel)
- [x] S12.3 Cancel (reason, refund note)
- [x] S12.4 Refund status
- [x] S12.5 Buy again
- [x] S12.6 Confirmation page links to the order
- [x] S12.7 Tests, click-through, docs

### S13 Reviews

- [x] Plan approved
- [x] S13.1 Write a review (review page, stars, verified purchase)
- [x] S13.2 Where to start one (product page, delivered orders, account)
- [x] S13.3 My reviews (status, edit, delete)
- [x] S13.4 Product page touches
- [x] S13.5 Tests, click-through, docs

### S13b Review photos and featured reviews (with backend B14 and the admin panel)

- [x] Plan approved
- [x] B14.1 (backend) Review photos (up to 3, moderated)
- [x] B14.2 (backend) Featured reviews and the Most relevant sort
- [x] Admin panel: photos in moderation
- [x] S13b.1 Adding photos to a review
- [x] S13b.2 Photos on the product page (thumbnails, lightbox, Customer photos, Most relevant)
- [x] S13b.3 The home page's 3 featured reviews
- [x] S13b.4 Tests, click-through, docs

### S14 Information pages

- [x] Plan approved
- [x] B15 shop policies API
- [x] About
- [x] Contact
- [x] Shipping
- [x] Returns
- [x] Privacy
- [x] Terms
- [x] FAQ
- [ ] Owner's final copy in
- [x] Docs

### S15 SEO and performance

- [x] Plan approved
- [x] Catalogue sitemap
- [x] Metadata and Open Graph
- [x] Structured data
- [x] Image optimisation
- [x] Web Vitals
- [x] Accessibility audit
- [x] Docs

### S15b SEO content and keywords

- [x] Plan approved
- [x] S15b.1 Keyword-led titles and descriptions
- [x] S15b.2 Category buying guides
- [x] S15b.3 Hair guides (/guides, five drafts)
- [x] S15b.4 Internal links
- [x] S15b.5 OnlineStore, Bing verification, sitemap
- [x] S15b.6 Tests, click-through, docs
- [ ] Owner's review of the guide and buying-guide text

### S16 Launch readiness

- [ ] Plan approved
- [ ] Production settings
- [ ] Security headers
- [ ] Error monitoring hook
- [ ] Gate switched off
- [ ] Launch checklist
- [ ] Docs

## Open items

| Item                                                                                                                                                                                                                                                                      | Phase    | Status                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| QC run of the S1 testing guide                                                                                                                                                                                                                                            | S1       | ⏳ QC                                                                                                          |
| QC run of the S2 testing guide                                                                                                                                                                                                                                            | S2       | ⏳ QC                                                                                                          |
| Regenerate the Razorpay test keys pasted in chat (2026-10-07) and replace them in `nestjs-haircraft/.env`                                                                                                                                                                 | S11      | ⏳ owner                                                                                                       |
| Apply the ReviewImages migration to the development database (`npm run migration:run` in nestjs-haircraft), then restart the API                                                                                                                                          | S13b     | ⏳ owner (reviews fail in development until then)                                                              |
| QC run of the S13b testing guide                                                                                                                                                                                                                                          | S13b     | ⏳ QC                                                                                                          |
| QC run of the S14 testing guide                                                                                                                                                                                                                                           | S14      | ⏳ QC                                                                                                          |
| QC run of the S15 testing guide (includes a screen-reader and High Contrast pass)                                                                                                                                                                                         | S15      | ⏳ QC                                                                                                          |
| QC run of the S15b testing guide, and the owner's read-through of the five hair guides and four buying guides (`src/content/guides/`, `src/content/categories.ts`)                                                                                                        | S15b     | ⏳ QC / owner                                                                                                  |
| Toppers category description in the catalogue reads like tape-ins ("Semi-permanent extensions that last 6–8 weeks"): correct it in the admin panel                                                                                                                        | S15b     | ⏳ owner                                                                                                       |
| A Tape-in category (links to tape-ins open a search today); then set its address in `src/content/shop-links.ts`                                                                                                                                                           | S15b     | ⏳ owner (optional)                                                                                            |
| Set `ALLOW_INDEXING=true` on the live site (without it Google won't index the shop); Search Console: paste the code into `GOOGLE_SITE_VERIFICATION`, submit the sitemap                                                                                                   | S15      | ⏳ S16 / owner at launch                                                                                       |
| Busy time (TBT) on a slowed-down phone is 180–680 ms against Google's 200 ms (React start-up and first layout); LCP and CLS are good. Measure INP from real visitors after launch                                                                                         | S15      | ⏳ S16 (hosting analytics)                                                                                     |
| Social profile links (footer and Google's business details): send them when ready                                                                                                                                                                                         | S15      | ⏳ owner                                                                                                       |
| Qualified (legal) review of the privacy policy and terms of use                                                                                                                                                                                                           | S14      | ⏳ owner, before launch (S16)                                                                                  |
| The free-delivery amount: the offers strip, home promise and bag read the storefront's own `FREE_SHIPPING_THRESHOLD`; switch them to the API's `/shop/policies` (B15) so they can't differ from checkout                                                                  | S14      | ⏳ S16 (until then keep both settings equal)                                                                   |
| Open the policy pages (privacy, terms, returns, shipping, contact) while the shop is closed, for Razorpay's live-account check, once their text is final                                                                                                                  | S14      | ⏳ S16                                                                                                         |
| QC run of the S13 testing guide                                                                                                                                                                                                                                           | S13      | ⏳ QC                                                                                                          |
| QC run of the S12 testing guide                                                                                                                                                                                                                                           | S12      | ⏳ QC                                                                                                          |
| My orders: a combined "In progress" filter (needs the API to accept several statuses)                                                                                                                                                                                     | S12      | ⏳ optional, ask any time                                                                                      |
| QC run of the S11 testing guide, including a real Razorpay test-mode payment (after regenerating the keys)                                                                                                                                                                | S11      | ⏳ QC                                                                                                          |
| QC run of the S10 testing guide (create a coupon first; COD_ENABLED=true to try cash on delivery)                                                                                                                                                                         | S10      | ⏳ QC                                                                                                          |
| QC run of the S9 testing guide                                                                                                                                                                                                                                            | S9       | ⏳ QC                                                                                                          |
| QC run of the B9 testing guide                                                                                                                                                                                                                                            | B9       | ⏳ QC                                                                                                          |
| Admin panel: an Edit button on My profile (uses `PATCH /admin/profile`)                                                                                                                                                                                                   | B9       | ⏳ optional, ask any time                                                                                      |
| QC run of the S8 testing guide                                                                                                                                                                                                                                            | S8       | ⏳ QC                                                                                                          |
| QC run of the S7 testing guide (and B12)                                                                                                                                                                                                                                  | S7       | ⏳ QC                                                                                                          |
| QC run of the S6 testing guide                                                                                                                                                                                                                                            | S6       | ⏳ QC                                                                                                          |
| QC run of the S5 testing guide                                                                                                                                                                                                                                            | S5       | ⏳ QC                                                                                                          |
| Owner text for "Delivery & returns" on product pages                                                                                                                                                                                                                      | S5       | ✅ 2026-10-07: short, true and linked to the policies (S14); its numbers follow `src/content/returns-rules.ts` |
| QC run of the S4 testing guide (and B11)                                                                                                                                                                                                                                  | S4       | ⏳ QC                                                                                                          |
| QC run of the S3 testing guide (and B10)                                                                                                                                                                                                                                  | S3       | ⏳ QC                                                                                                          |
| QC run of the S2b testing guide                                                                                                                                                                                                                                           | S2b      | ⏳ QC                                                                                                          |
| Owner's words for the FAQ, "why" cards and our story (now `src/content/faq.ts`, `about.ts`; cards in `src/components/home/content.ts`)                                                                                                                                    | S2b, S14 | ⏳ owner: drafts in place, marked DRAFT — OWNER TO CONFIRM                                                     |
| Five duplicate test reviews ("Gorgeous waves", Kavya M.) in the development database: keep 1, delete 4 (approved 2026-10-06)                                                                                                                                              | S2b      | ⏳ waiting for the cleanup to be run                                                                           |
| Owner's text for the information pages: business details (legal name, address, GSTIN, phone/WhatsApp, hours), grievance officer, courier and delivery times, returns rules, story, FAQ (list in the S14 plan, "What I need from you"); confirm `care@haircraft.in` exists | S14      | ⏳ owner, before launch (blocks S16)                                                                           |
| Shared API rate limit: every shopper reaches the API from the storefront server (100 requests/minute in total); give the storefront its own allowance (and sign-ins: 10 a minute for the whole shop)                                                                      | S16      | ⏳ decided 2026-10-06: fix in S16                                                                              |
| Hosting choice (recommended: Vercel for the storefront)                                                                                                                                                                                                                   | S16      | ⏳ owner, at S16                                                                                               |

## Change log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-05 | Tracker created with the storefront roadmap (draft) and the S1 plan (draft).                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-10-05 | Roadmap and S1 approved. S1 built and verified: 16 unit + 12 e2e tests, click-through reviewed.                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-10-05 | S2 (home page) approved, built and verified: 23 unit + 20 e2e tests. Click-through found and fixed missing photos in local production runs and a phone-width bug.                                                                                                                                                                                                                                                                                                                                     |
| 2026-10-06 | S2b (home redesign after gemeriahair.in and 1hairstop.in) approved, built and verified: 31 unit + 28 e2e tests. Review by eye fixed the hero heading spacing, invisible 3D strands, cards touching the phone edge and a repeated review.                                                                                                                                                                                                                                                              |
| 2026-10-06 | S3 (product listing) approved, built and verified with backend B10 (filter options): storefront 49 unit + 47 e2e, backend 306 + 260. Fixed: streaming hid real 404/redirect status codes and broke no-JavaScript forms; a doubled header on the shop's 404; uneven price bands; the phone panel keeping abandoned ticks.                                                                                                                                                                              |
| 2026-10-06 | S4 (search) approved, built and verified with backend B11 (smarter search, suggestions, did-you-mean): storefront 59 unit + 61 e2e, backend 310 + 269. Fixed: filter options failing for searches (unused SQL parameters), the phone search panel not full screen (frosted header), a no-results heading hidden from screen readers, stale cached API data in tests.                                                                                                                                  |
| 2026-10-06 | S5 (product page) approved, built and verified: 69 unit + 72 e2e (no backend changes). Fixed: a test that hung a run for 21 minutes; e2e tests tripping the API rate limit (answers now fetched once per file); a repeated review count. Changed from the plan: options that exist only with other choices are dashed and selectable, not disabled.                                                                                                                                                   |
| 2026-10-06 | S6 (sign-in and register) approved, built and verified: 83 unit + 86 e2e (no backend changes). End-to-end tests now run on their own API (port 3100) and database `hc_e2e` (`scripts/setup-e2e-db.ps1`). Fixed: a suspended account hitting the error page, an unconfirmed "signed out everywhere", the sign-out note not showing.                                                                                                                                                                    |
| 2026-10-06 | S7 (cart) approved, built and verified with backend B12 (guest cart preview): storefront 95 unit + 98 e2e, backend 310 + 273. Fixed: a text-injection hole in cart-page messages (now codes only), a crash on `?problem=constructor`, a stale header count after sign-out, a sign-out that kept the guest bag.                                                                                                                                                                                        |
| 2026-10-06 | S8 (wishlist) approved, built and verified: 107 unit + 110 e2e (no backend changes). Hearts on cards and product pages, a sign-in panel for guests (saved afterwards), the wishlist page with Move to bag. Fixed: a stale heading count after Remove, uneven buttons, hearts under 44 px on phones.                                                                                                                                                                                                   |
| 2026-10-06 | B9 (backend: edit profile) approved, built and verified: `PATCH /profile` and `PATCH /admin/profile` (name and phone, audit-logged), backend 316 unit + 282 e2e. No email changes (needs email verification); the admin panel's edit form is an optional follow-up.                                                                                                                                                                                                                                   |
| 2026-10-07 | S9 (My account) approved, built and verified: 122 unit + 122 e2e (no backend changes). Overview, profile, address book and password and security pages. Fixed: the State list emptying after a failed submit, a too-wide phone layout, Delete from the confirmation doing nothing, two Sign out buttons on computers.                                                                                                                                                                                 |
| 2026-10-07 | S10 (checkout) approved, built and verified: 131 unit + 138 e2e (no backend changes; the test API now has cash on delivery on). One checkout page with address, coupon, payment, summary and Place order (one order per attempt; price changes explained), and a confirmation page. Online orders show "Awaiting payment" until S11.                                                                                                                                                                  |
| 2026-10-07 | S11 (payment) approved, built and verified with backend B13 (stand-in Razorpay for tests, refused in production): storefront 142 unit + 145 e2e, backend 317 + 287. Razorpay's window opens after Place order; success, decline, close, retry, pay later and cancelled are handled. The real test-mode payment is left to QC.                                                                                                                                                                         |
| 2026-10-07 | S12 (My orders) approved, built and verified: 152 unit + 158 e2e (no backend changes). Orders list with filters and pages, the order page (progress, tracking, payment panel, cancel with a reason, refund status), Buy again, and View your order from checkout. Fixed: a cancel reason lost after a problem (React form reset).                                                                                                                                                                     |
| 2026-10-07 | S13 (reviews) approved, built and verified: 158 unit + 167 e2e (no backend changes). A review page per product (stars, title, text, Verified purchase), Write/Edit on product pages, Review this item on delivered orders, and My reviews with status, edit and delete. The home page's wording moves to S14.                                                                                                                                                                                         |
| 2026-10-07 | S13b (review photos and featured reviews) approved, built and verified with backend B14 and the admin panel: storefront 159 unit + 171 e2e, backend 317 + 292, admin 472. Up to 3 moderated photos per review, Customer photos and Most relevant on product pages, and the home page's 3 featured 5-star reviews. Reviews' cache time is now a setting (`REVIEWS_CACHE_SECONDS`).                                                                                                                     |
| 2026-10-07 | S14 (information pages) approved, built and verified with backend B15 (`GET /shop/policies`): storefront 176 unit + 189 e2e, backend 320 + 294. Shipping, Returns & refunds, FAQ (16 questions), Contact (grievance officer), About, Privacy and Terms, as marked drafts in `src/content/`; policy links in the bag, checkout, orders and product pages; the home FAQ and story link to the full pages. Owner's text and a legal review still to come.                                                |
| 2026-10-07 | S15 (SEO and performance) approved, built and verified: 194 unit + 204 e2e. robots.txt and noindex follow `ALLOW_INDEXING`; branded 1200×630 share images (site and per category); product data with offers per option, delivery, returns and reviews; category product lists; logo 51 kB → ~4 kB; home page 40 kB less JavaScript; accessibility audit (axe-core, ~45 pages and states) clean after contrast and structure fixes. Lab TBT stays above 200 ms (framework start-up); LCP and CLS good. |
| 2026-10-08 | S15b (SEO content, owner request) approved, built and verified on dev-esha only (main untouched, nothing pushed): 207 unit + 211 e2e. Keyword-led titles and descriptions ("… in India", "— Human Hair, 20–24 inch", "from ₹…"), buying guides on category pages, five drafted hair guides at /guides with Article data and share images, categories and guides in the footer, Helpful guides on products, OnlineStore, BING_SITE_VERIFICATION. S16 on hold.                                          |
