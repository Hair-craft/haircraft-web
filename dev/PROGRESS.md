# Storefront: progress tracker

One page to see how far the customer storefront is. Each phase is split into small steps; tick them as they are done. Details are in the linked plan, status and testing files.

**Last updated:** 2026-10-05 · **Phases built:** 0 of 17 · **QC sign-off:** 0 of 17 · **Roadmap:** [draft, awaiting review](plan/2026-10-05-storefront-roadmap.md)

Legend: ✅ done · 🔄 in progress · 📝 plan awaiting review · ⏳ not started

## Overview

| # | Phase | Plan | Built | Finished without errors? | Tests (unit / e2e) | QC |
|---|---|---|---|---|---|---|
| S1 | Foundation | 📝 [plan](plan/2026-10-05-phase-s1-foundation.md) | ⏳ | — | — | ⏳ |
| S2 | Home page | ⏳ | ⏳ | — | — | ⏳ |
| S3 | Product listing | ⏳ | ⏳ | — | — | ⏳ |
| S4 | Search | ⏳ | ⏳ | — | — | ⏳ |
| S5 | Product page | ⏳ | ⏳ | — | — | ⏳ |
| S6 | Sign-in and register | ⏳ | ⏳ | — | — | ⏳ |
| S7 | Cart | ⏳ | ⏳ | — | — | ⏳ |
| S8 | Wishlist | ⏳ | ⏳ | — | — | ⏳ |
| B9 | *Backend:* edit profile | ⏳ | ⏳ | — | — | ⏳ |
| S9 | My account | ⏳ | ⏳ | — | — | ⏳ |
| S10 | Checkout | ⏳ | ⏳ | — | — | ⏳ |
| S11 | Payment | ⏳ | ⏳ | — | — | ⏳ |
| S12 | My orders | ⏳ | ⏳ | — | — | ⏳ |
| S13 | Reviews | ⏳ | ⏳ | — | — | ⏳ |
| S14 | Information pages | ⏳ | ⏳ | — | — | ⏳ |
| S15 | SEO and performance | ⏳ | ⏳ | — | — | ⏳ |
| S16 | Launch readiness | ⏳ | ⏳ | — | — | ⏳ |

"Finished without errors" means that when the phase was handed over, all of these passed:
- typecheck, lint, formatting and the production build
- every unit and Playwright test, earlier phases included
- a screenshot click-through reviewed by eye

## Steps per phase

### S1 Foundation
- [ ] S1.1 Tooling: scripts, Prettier, Vitest, Playwright, port 3001, `.env.example`
- [ ] S1.2 Validated configuration (`API_BASE_URL`, `STORE_OPEN`, `SITE_URL`)
- [ ] S1.3 Typed server-side API client and error type
- [ ] S1.4 Session-cookie (BFF) skeleton
- [ ] S1.5 Coming-soon gate (`proxy.ts`)
- [ ] S1.6 Shop layout: header with categories, mobile menu, footer
- [ ] S1.7 UI components (button, inputs, price, skeleton, dialog, drawer, toast)
- [ ] S1.8 404, error and "API unreachable" states
- [ ] S1.9 Images from local uploads and Cloudinary
- [ ] S1.10 Tests, click-through, status, testing guide

### S2 Home page
- [ ] Plan approved
- [ ] Hero
- [ ] Shop by category
- [ ] New arrivals
- [ ] Best rated
- [ ] Brand promise strip
- [ ] Tests, click-through, docs

### S3 Product listing
- [ ] Plan approved
- [ ] `/shop` and `/shop/[category]`
- [ ] Product cards (image, price range, sale, stock, rating)
- [ ] Filters
- [ ] Sort
- [ ] Pagination
- [ ] URL state
- [ ] Empty states
- [ ] Tests, click-through, docs

### S4 Search
- [ ] Plan approved
- [ ] Header search
- [ ] Results page
- [ ] No-results help
- [ ] Tests, click-through, docs

### S5 Product page
- [ ] Plan approved
- [ ] Gallery
- [ ] Variant picker
- [ ] Price and stock
- [ ] Rating summary and reviews list
- [ ] Structured data
- [ ] Tests, click-through, docs

### S6 Sign-in and register
- [ ] Plan approved
- [ ] Register
- [ ] Sign in
- [ ] Sign out
- [ ] BFF refresh
- [ ] Protected routes
- [ ] Error messages (lockout, suspended)
- [ ] Tests, click-through, docs

### S7 Cart
- [ ] Plan approved
- [ ] Add to cart
- [ ] Drawer and page
- [ ] Quantities
- [ ] Cart problems shown
- [ ] Guest cart and merge on sign-in
- [ ] Tests, click-through, docs

### S8 Wishlist
- [ ] Plan approved
- [ ] Heart toggle
- [ ] Wishlist page
- [ ] Move to cart
- [ ] Tests, click-through, docs

### B9 Backend: edit profile (in `nestjs-haircraft`)
- [ ] Plan approved
- [ ] `PATCH /profile` and `PATCH /admin/profile`
- [ ] Tests, docs

### S9 My account
- [ ] Plan approved
- [ ] Profile view and edit
- [ ] Change password
- [ ] Sign out everywhere
- [ ] Address book
- [ ] Tests, click-through, docs

### S10 Checkout
- [ ] Plan approved
- [ ] Address step
- [ ] Coupon
- [ ] Summary
- [ ] Place order (idempotent)
- [ ] Price-changed and stock problems
- [ ] Cash on delivery (when switched on)
- [ ] Tests, click-through, docs

### S11 Payment
- [ ] Plan approved
- [ ] Razorpay Checkout
- [ ] Verify
- [ ] Failure and retry
- [ ] Confirmation page
- [ ] Pay later from the order page
- [ ] Real test-mode payment
- [ ] Tests, click-through, docs

### S12 My orders
- [ ] Plan approved
- [ ] Order list
- [ ] Detail, timeline and tracking
- [ ] Cancel
- [ ] Refund status
- [ ] Tests, click-through, docs

### S13 Reviews
- [ ] Plan approved
- [ ] Write, edit and delete
- [ ] Eligibility
- [ ] My reviews
- [ ] Tests, click-through, docs

### S14 Information pages
- [ ] Plan approved
- [ ] About
- [ ] Contact
- [ ] Shipping
- [ ] Returns
- [ ] Privacy
- [ ] Terms
- [ ] FAQ
- [ ] Owner's final copy in
- [ ] Docs

### S15 SEO and performance
- [ ] Plan approved
- [ ] Catalogue sitemap
- [ ] Metadata and Open Graph
- [ ] Structured data
- [ ] Image optimisation
- [ ] Web Vitals
- [ ] Accessibility audit
- [ ] Docs

### S16 Launch readiness
- [ ] Plan approved
- [ ] Production settings
- [ ] Security headers
- [ ] Error monitoring hook
- [ ] Gate switched off
- [ ] Launch checklist
- [ ] Docs

## Open items

| Item | Phase | Status |
|---|---|---|
| Review and approve the storefront roadmap and the S1 plan | — | 📝 waiting for the owner |
| Final hero images, brand story and information-page copy | S2, S14 | ⏳ owner, before S14 |
| Hosting choice (recommended: Vercel for the storefront) | S16 | ⏳ owner, at S16 |

## Change log

| Date | Change |
|---|---|
| 2026-10-05 | Tracker created with the storefront roadmap (draft) and the S1 plan (draft). |
