# haircraft-web

The HairCraft storefront: the customer shop for haircraft.in. Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4, on top of the HairCraft NestJS API.

**Status:** phases S1–S15 are done (foundation, home page, product listing, search, product page, sign-in, cart, wishlist, my account, checkout, payment, my orders, reviews with photos, information pages, SEO and performance); the shop is being built phase by phase. Until launch, haircraft.in shows **Coming soon** (see the switch below). Progress: [`dev/PROGRESS.md`](dev/PROGRESS.md).

## Getting started

1. Start the API (`../nestjs-haircraft`: `npm run start:dev`, on http://localhost:3000).
2. In this folder:
   ```bash
   npm install
   cp .env.example .env.local   # Windows: copy .env.example .env.local
   npm run dev                  # http://localhost:3001
   ```

## Settings (`.env.local`)

| Setting                    | Meaning                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_BASE_URL`             | The API, including `/api/v1`. Default `http://localhost:3000/api/v1`.                                                                          |
| `STORE_OPEN`               | `true` shows the shop; `false` shows Coming soon at every address. Default: **false in production**, true in development.                      |
| `SITE_URL`                 | Public address (links, metadata). Default haircraft.in in production.                                                                          |
| `API_TIMEOUT_MS`           | Time limit for one API call (default 10000).                                                                                                   |
| `ALLOW_INDEXING`           | `true` lets search engines index the site. Default **false**: set it on the live site only, so test and preview copies never appear in Google. |
| `GOOGLE_SITE_VERIFICATION` | Search Console's HTML-tag verification code (optional).                                                                                        |

None of these are sent to the browser.

## Scripts

| Command                       | What it does                                    |
| ----------------------------- | ----------------------------------------------- |
| `npm run dev`                 | Development server on port 3001                 |
| `npm run build` / `npm start` | Production build / serve it on port 3001        |
| `npm run check`               | Typecheck, lint, format check and unit tests    |
| `npm test`                    | Unit tests (Vitest)                             |
| `npm run test:e2e`            | Production build + Playwright tests (see below) |
| `npm run format`              | Format the code (Prettier)                      |

## End-to-end tests

The Playwright tests start their own copy of the API (port 3100, compiled into `../nestjs-haircraft/dist-e2e`) with relaxed rate limits, cash on delivery switched on, the stand-in Razorpay (`RAZORPAY_FAKE`, so no real payment is ever made) and a separate test database, `hc_e2e`, so test accounts never reach the development database. Prepare that database once (and again whenever you want it clean):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-e2e-db.ps1
```

It needs the Postgres superuser password in `%USERPROFILE%\.hc\postgres-superuser.txt`. Then `npm run test:e2e`. Your own API on port 3000 can keep running.

## How it works

- **Server-first:** pages are React Server Components that call the API from the server (`src/lib/api/`). The browser never talks to the API directly.
- **Sessions:** the API's tokens are kept in httpOnly cookies set by this server (backend-for-frontend), never in JavaScript. `src/proxy.ts` renews an expired access token before the page renders; sign-in, register and sign-out are server actions (`src/lib/session/`).
- **Coming-soon gate:** `src/proxy.ts` also shows `src/app/coming-soon/` at every address while `STORE_OPEN=false`.
- **Structure:**
  - `src/app/(shop)/`: shop pages and their layout
  - `src/app/bff/`: server routes for the browser
  - `src/components/`: `ui/` building blocks, `layout/` header, footer and menus
  - `src/lib/`: settings, API client, formatting, session
- **Search engines and sharing:** robots.txt and `noindex` follow `ALLOW_INDEXING`; link previews are drawn by `src/app/opengraph-image.tsx` (and one per category) with the fonts in `assets/fonts/`; structured data lives in `src/lib/seo/`.
- **Speed and accessibility are tested:** `tests/e2e/vitals.mobile.spec.ts` (Core Web Vitals on a slowed-down phone, run last and alone) and `tests/e2e/a11y*.spec.ts` (axe-core on every page type). `A11Y_REPORT=1` lists every finding instead of failing.
- **Brand:** mint `#edf9e5`, deep green `#16362a`, gold; Cormorant Garamond for headings, Geist for text (`src/app/globals.css`).

Development process (plan → build → status → QC guide): [`dev/README.md`](dev/README.md).
