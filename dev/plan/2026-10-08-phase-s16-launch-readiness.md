# Plan: Phase S16, launch readiness (with backend B16)

**Status: Waiting for approval.** The owner's choices are under "Open questions", each with a recommendation.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). The last storefront phase: it makes the shop safe and ready to switch on. **Deploying it (hosting accounts, domains, servers) is a separate step** done with you after this phase, following the checklist this phase produces.

## Context

**Ready already:**

- **The API refuses unsafe production settings:**
  - test Razorpay keys, the stand-in Razorpay, and photos stored on the server's own disk
  - it sends security headers (helmet) and has a deliberate proxy-trust setting
  - its development pages answer "not found" in production
- **The storefront validates its settings,** is closed (Coming soon) by default in production, keeps search engines out unless `ALLOW_INDEXING=true` (S15), and has a health check (`/bff/health`).
- **The `/shopnow` marketplace page is live on `main`** (the Coming soon site). It isn't on `dev-esha` yet.

**Not ready:**

1. **The storefront sends no security headers:**
   - no Content-Security-Policy
   - no HSTS (which keeps browsers on HTTPS)
   - no protection against being framed
2. **No error monitoring:** if a page breaks for a customer, nobody finds out.
3. **One rate limit for the whole shop:** every shopper reaches the API through the storefront server, so the API sees one visitor.
   - It allows that visitor 100 requests a minute and 10 sign-ins a minute for the entire shop. A busy hour would start refusing real customers.
   - The storefront passes on the shopper's address only when signing in, and the API can't tell a genuine storefront from someone pretending.
4. **The free-delivery amount is set twice:** in the API (`FREE_SHIPPING_THRESHOLD`) and in the storefront's own setting (offers strip, home promise, bag). They can disagree.
5. **The policy pages can't be shown before launch:** Razorpay's live-account check and Google usually want them reachable while the shop is still closed.
6. **`/shopnow` would disappear at launch,** because `dev-esha` doesn't have it.
7. **Nobody measures real speed:** S15 measured in the lab. Real visitors' INP and LCP aren't recorded yet.
8. **No launch checklist** covers the three apps' settings, the owner's items and the switch-on steps.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **B16 (backend) A trusted storefront:**
   - the storefront sends a shared secret (`STOREFRONT_API_KEY`, in both apps' settings, never sent to browsers) with every API call
   - with it, the API takes the shopper's own address from `X-Forwarded-For` for rate limits, so each shopper gets their own allowance (100 a minute, 10 sign-ins a minute), as on a direct connection
   - without it, the header is ignored, so nobody can fake addresses
   - production refuses to start without the key on both sides
2. **S16.1 Production settings:**
   - the storefront refuses unsafe production settings: an `http://` site or API address, `localhost`, or a missing storefront key
   - `.env.production.example` for each app, listing every setting with its live value or where to get it
   - the storefront's `FREE_SHIPPING_THRESHOLD` is removed; the offers strip, home promise and bag read B15's rules, so they always match checkout
3. **S16.2 Security headers** (storefront, every response):
   - **Content-Security-Policy with a per-request nonce:**
     - scripts only from the shop itself and Razorpay
     - images from the shop, Cloudinary and Razorpay
     - frames only for Razorpay's payment window
     - forms post only to the shop
   - **HSTS** for 2 years, including sub-domains (open question 3)
   - **No framing:** `frame-ancestors 'none'` and `X-Frame-Options: DENY`
   - **Other headers:** `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` that switches off the camera, microphone and location (except the file chooser for review photos, which needs none)
   - **Reporting:** policy violations are reported to `/bff/csp-report` and logged, so anything the policy blocks by mistake is noticed
4. **S16.3 Error monitoring hook:**
   - **server errors** (Next.js `onRequestError`) and **browser errors** (the error pages report to `/bff/client-error`) become one structured log line each:
     - the time, the page, the error's digest and message, and the browser
     - no cookies, tokens, form data or personal details
   - **limits:** small and rate-limited, so the endpoint can't be abused
   - **Sentry, optional** (open question 2): if `SENTRY_DSN` is set, the same errors also go to Sentry, with alerts by email
5. **S16.4 Real-user speed:**
   - each visitor's Core Web Vitals (LCP, INP, CLS) for the page they viewed go to `/bff/vitals` and are logged as one line, for 1 in 10 page views
   - no cookies, no personal data
   - hosting analytics can replace it later (open question 4)
6. **S16.5 Before and at launch:**
   - **`SHOW_POLICIES_WHILE_CLOSED=true`** serves the seven information pages while the shop shows Coming soon (for Razorpay's check), once their text is final
   - **`/shopnow`** (Amazon and Flipkart, with the Flipkart dropdown) is brought across from `main`, served whether the shop is open or closed, and linked from the Coming soon page
   - **switching on** is settings only: `STORE_OPEN=true`, `ALLOW_INDEXING=true`, then a restart; switching back is the same
7. **S16.6 The launch checklist** `dev/LAUNCH.md`:
   - **every setting** for the API, admin panel and storefront (what, where from, live value)
   - **the owner's items:**
     - texts, legal review, business details
     - live Razorpay keys and webhook
     - Cloudinary
     - the super admin
     - backups
   - **the switch-on steps**
   - **a 15-minute smoke test after launch:** a real ₹1 payment and refund, a review, sign-in, a phone check
   - **who to call if something breaks**
8. **S16.7 Tests, click-through, docs.**

**Out of scope:**

- creating hosting accounts, domains, DNS and servers (the deployment step after this phase)
- order emails to customers (open question 5)
- returns from My orders
- a contact form

## Design

Nothing changes visually.

**How it works:**

- **The nonce:** `src/proxy.ts`, which already runs before every page, adds the security headers with a fresh nonce. Next.js puts that nonce on its own scripts.
  - Pages are already rendered per request (sessions), so this costs nothing extra.
- **The storefront key** is added by the one API client (`src/lib/api/client.ts`), so every call has it. The API checks it in constant time and never logs it.
- **The reporting endpoints** (`/bff/client-error`, `/bff/csp-report`, `/bff/vitals`) are protected:
  - they accept only small JSON bodies
  - they're limited per visitor
  - they refuse cross-site posts

## Files

```
nestjs-haircraft/src/common/security/…        B16: storefront key check, trusted forwarded address for rate limits
nestjs-haircraft/src/config/env.validation.ts STOREFRONT_API_KEY (required in production)
src/proxy.ts, src/lib/security/headers.ts     security headers and the nonce
src/instrumentation.ts                        server error hook
src/app/bff/{client-error,csp-report,vitals}/ reporting endpoints
src/lib/monitoring/…                          one log format; optional Sentry
src/lib/env.ts                                production checks; SHOW_POLICIES_WHILE_CLOSED; STOREFRONT_API_KEY; SENTRY_DSN
src/lib/gate.ts                               policy pages and /shopnow while closed
src/app/(shop)/shopnow/…, coming-soon         the marketplace page from main
src/components/layout/announcement-bar.tsx, home, cart   free delivery from B15
.env.production.example (all three apps), dev/LAUNCH.md
tests/unit/security.test.ts, tests/e2e/security.spec.ts, tests/e2e/launch.spec.ts
```

## Testing

1. **Backend:**
   - the key is required in production
   - with the key, rate limits follow the forwarded address; without it, they don't
   - a wrong key is refused
2. **Unit:**
   - the CSP for production and for tests (the stand-in Razorpay)
   - the production settings checks
   - the gate with policy pages and `/shopnow`
   - error log lines leave out personal data
3. **Playwright:**
   - every page answers with the security headers
   - **no CSP violation on any page**, including Razorpay's payment window (the stand-in), the photo viewer, review photo uploads and share images
   - a broken page reports its error; the reporting endpoints refuse large or cross-site posts
   - two shoppers each get their own rate-limit allowance
   - the closed shop serves the policy pages and `/shopnow` when asked to
   - the free-delivery amount everywhere follows the API's setting
4. **By eye:** a production build with production-like settings, checked in Chrome's console for CSP warnings.

## Risks

- **A too-strict security policy can block something real** (a Razorpay payment step, a font). The tests cover the payment window, and violations are reported.
  - **Before launch:** a real Razorpay test-mode payment on a production-like setup is on the checklist.
- **The storefront key must match in both apps.** If it's missing, production refuses to start (a loud failure, not a quiet one).

## Open questions

1. **Order emails.** The shop sends **no emails**: no order confirmation, shipping or refund notices. Most customers expect at least a confirmation.
   Recommended: **a short phase before launch (B17/S17)** for:
   - order placed, paid, shipped, delivered, cancelled and refunded emails
   - password reset by email (today it's done by staff)

   It needs an email service (for example Amazon SES, Resend or Zoho). The alternative is launching without emails and adding them soon after.

2. **Error alerts.** Recommended: **the built-in hook writing to the server logs now, plus Sentry's free plan** (set `SENTRY_DSN`; emails you when something breaks). The alternative is logs only, which someone has to read.
3. **HSTS for sub-domains.** Recommended: **yes, include sub-domains** (and later "preload"), as long as every haircraft.in address (admin, api) is HTTPS, which the checklist confirms. The alternative is HSTS for the main site only.
4. **Real-user speed.** Recommended: **the built-in sampled logging now**; if the storefront is hosted on Vercel, switch to Vercel Speed Insights at deployment. The alternative is to add nothing until hosting is chosen.
5. **Hosting** (for the checklist; decided at deployment). Recommended:
   - **Vercel** for the storefront
   - a container host (for example Render or Railway) or a small VPS for the API and admin panel
   - **a managed Postgres with daily backups**

   The alternative is everything on one VPS (cheaper, more upkeep).
