# Plan: HC storefront roadmap (customer pages)

**Status: Approved (2026-10-05)** with the recommended options for all four open questions. Each phase gets its own plan file, approved before its code is written.

## Goal

Build the **Hair Craft customer storefront** in `nextjs-haircraft`, on top of the finished NestJS API. Everything a customer needs, from the architecture document (§2, "Customer Application"):

- register and sign in
- browse, search and filter products
- view products and pick variants
- cart, wishlist, checkout and addresses
- place and pay for orders (Razorpay)
- track and cancel orders
- write reviews and manage their profile

The work is split into **small phases** so each one can be planned, built, tested and signed off on its own. Every phase is:

- production-quality
- tested (unit, end-to-end and a browser click-through with screenshots)
- documented with a plan, a status report and a QC testing guide

## Context

| App                    | Folder                            | State                                                                                                                                                                          |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NestJS API             | `../nestjs-haircraft`             | **Done** (8 phases). The authority for data, prices, stock, auth and payments.                                                                                                 |
| Angular admin panel    | `../angular-haircraft`            | **Done** (A1–A12).                                                                                                                                                             |
| **Next.js storefront** | `nextjs-haircraft` (this project) | A live **Coming soon** page at haircraft.in. Next.js 16.3, React 19, Tailwind 4, Framer Motion; brand: mint `#edf9e5`, deep green `#16362a`, gold; Cormorant Garamond + Geist. |

## Architectural decisions (proposed)

- **D1. Next.js 16 App Router, server-first.**
  - Pages are React Server Components; client components are used only where interaction needs them (variant picker, cart, forms).
  - Product and category pages are rendered on the server, so they are fast and indexable (SEO matters for a D2C shop).
  - The installed Next.js docs (`node_modules/next/dist/docs/`) are read before each phase, as this version differs from older ones (e.g. `proxy.ts` replaces middleware).
- **D2. Backend-for-frontend (BFF) for sessions** (as decided in backend Phase 3).
  - The browser talks only to the storefront. The storefront's server calls the API.
  - Access and refresh tokens live in **httpOnly, Secure, SameSite=Lax cookies**, never in JavaScript or localStorage, so XSS cannot steal a session.
  - Expired access tokens are refreshed on the server (one refresh at a time per session).
  - No CORS needed in production.
- **D3. The API stays the authority.**
  - Prices, totals, stock, coupons and payment results always come from the API.
  - The storefront only displays them: money stays as the API's decimal strings, formatted for display.
- **D4. Typed API layer.**
  - One server-side client returns the unwrapped `data`, or a typed `ApiError` with `code`, `message` and field errors.
  - Field errors map onto form fields; customers see friendly messages, never raw errors.
- **D5. URL-driven state for browsing.** Filters, sort, search and page live in the URL, so they can be shared and bookmarked and the back button works.
- **D6. Guest cart.**
  - Guests keep a cart in a cookie (variant ids and quantities only).
  - It is merged into their account on sign-in (`POST /cart/merge`, built in backend Phase 5).
- **D7. Coming-soon gate.**
  - The live site keeps showing **Coming soon** until launch.
  - A server setting (`STORE_OPEN=false` in production) sends every shop route to the coming-soon page.
  - Development and preview run with `STORE_OPEN=true`.
- **D8. Styling.**
  - Tailwind 4 with the existing brand tokens, plus a small set of our own components (button, input, select, dialog, drawer, toast, skeleton).
  - No heavy UI kit.
  - Framer Motion for small, simple animations (owner preference). Accessibility: keyboard, focus and contrast (WCAG AA).
- **D9. Quality gates per phase.**
  - typecheck, ESLint, Prettier, production build
  - Vitest (unit)
  - Playwright end-to-end against the real API
  - a screenshot click-through, reviewed by eye
- **D10. Ports.** API `:3000` (unchanged), storefront `:3001` (already allowed by the API's CORS list for local tools).

## Phases (small, one plan each)

| #       | Phase                   | What the customer gets                                                                                                                                             | Needs from the backend                 |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| **S1**  | Foundation              | Project tooling, config, typed API client, BFF proxy skeleton, coming-soon gate, base layout (header, footer, mobile menu), design components, error and 404 pages | —                                      |
| **S2**  | Home page               | Hero, shop-by-category, new arrivals and best-rated, brand promise, newsletter-free footer                                                                         | Catalogue (done)                       |
| **S3**  | Product listing         | `/shop` and `/shop/[category]`: product cards, filters (length, colour, texture, price, in stock), sort, pagination                                                | Catalogue (done)                       |
| **S4**  | Search                  | Header search with suggestions, `/search?q=` results, "no results" help                                                                                            | Catalogue (done)                       |
| **S5**  | Product page            | Image gallery, variant picker (length/colour/texture), price and sale, stock, rating summary and reviews list, product structured data                             | Catalogue, reviews (done)              |
| **S6**  | Sign-in and register    | Register, sign in, sign out, session refresh in the BFF, protected account routes, friendly lockout/suspension messages                                            | Auth (done)                            |
| **S7**  | Cart                    | Add to cart, cart drawer and page, quantity changes, live problems (out of stock, price changed), guest cart merged on sign-in                                     | Cart (done)                            |
| **S8**  | Wishlist                | Heart on cards and product page, wishlist page, move to cart                                                                                                       | Wishlist (done)                        |
| **B9**  | _Backend:_ edit profile | `PATCH /profile` (name, phone) for customers and admins                                                                                                            | **New, small** (in `nestjs-haircraft`) |
| **S9**  | My account              | Profile (view, edit), change password, sign out everywhere, address book (add, edit, default, delete)                                                              | Profile (B9), addresses (done)         |
| **S10** | Checkout                | Address step, coupon, price summary (shipping, GST included), place order with an idempotency key, cash on delivery when switched on                               | Checkout (done)                        |
| **S11** | Payment                 | Razorpay Checkout, verify, failure and retry, "paid" confirmation page, pay-later from the order page                                                              | Payments (done)                        |
| **S12** | My orders               | Order list, order detail with timeline and tracking, cancel, refund status                                                                                         | Orders (done)                          |
| **S13** | Reviews                 | Write, edit and delete a review from the product and order pages; "my reviews"                                                                                     | Reviews (done)                         |
| **S14** | Information pages       | About, contact, shipping, returns, privacy, terms, FAQ (content from the owner)                                                                                    | —                                      |
| **S15** | SEO and performance     | Sitemap from the catalogue, metadata and Open Graph per page, structured data, image optimisation, Core Web Vitals, accessibility audit                            | —                                      |
| **S16** | Launch readiness        | Production settings, security headers, error monitoring hook, switching off the coming-soon gate, launch checklist                                                 | Deployment (separate)                  |

Order of work: S1 → S8, then B9 → S9, then S10 → S16. Each phase stops for owner review, as before.

## Tracking

- [`dev/PROGRESS.md`](../PROGRESS.md) lists every phase with its small steps as checkboxes, the test results and QC sign-off.
- [`dev/README.md`](../README.md) holds the process and the index of plan, status and testing files (same rules as the backend and admin panel).

## Out of scope (until planned separately)

These need email or SMS, which the backend does not send yet:

- forgot/reset password
- email verification
- order emails

Also out of scope: Hindi or other languages, a blog, gift cards, returns and exchanges, live chat, and analytics or marketing pixels (needs a consent decision).

## Open questions

1. **Coming-soon gate (D7).** Recommended: **keep haircraft.in on Coming soon until launch**, and build and review the shop locally (or on a private preview URL). Alternatively, show the shop publicly as soon as each phase is done.
2. **Session storage (D2).** Recommended: **httpOnly cookies via the storefront server (BFF)**, as decided in backend Phase 3. (The admin panel keeps its own approach.)
3. **Content and photos.** Hero images, brand story and information pages (S2, S14). Recommended: **I use tasteful placeholders and the product photos from the catalogue now**; you send the final copy and images before S14/S16.
4. **Hosting** (needed for S16, not before). Recommended: **Vercel** for the storefront (built for Next.js) and the API on a server or container host. To be decided at S16.
