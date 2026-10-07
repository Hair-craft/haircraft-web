# Plan: Phase S1, storefront foundation

**Status: Approved (2026-10-05)** with the recommended options (gate off in production, header categories from the API).

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). The ground every later page stands on. **The customer sees nothing new on haircraft.in**: the coming-soon page stays live.

## Context

The project is a single coming-soon page. Before any shop page can be built it needs:

- tooling and tests
- a safe, typed way to call the API from the server
- a session-cookie skeleton for sign-in later
- the shop layout (header, footer, mobile menu)
- a small set of reusable components in the brand style
- error and not-found pages
- a switch that keeps Coming soon live until launch

## Scope

**In scope**, as small steps (each is a checkbox in `PROGRESS.md`):

1. **S1.1 Tooling:**
   - scripts: `typecheck`, `lint`, `format`, `format:check`, `test` (Vitest), `test:e2e` (Playwright)
   - Prettier
   - dev server on port **3001**
   - `.env.example`
2. **S1.2 Configuration:**
   - server-only settings, validated at startup: `API_BASE_URL` (default `http://localhost:3000/api/v1`), `STORE_OPEN`, `SITE_URL`
   - a clear error when one is wrong
3. **S1.3 API client (server side):**
   - `apiFetch()` unwraps the API's `{ success, data, meta }` envelope and returns typed data, or throws `ApiError` (status, `code`, `message`, field errors)
   - timeouts and the request id are handled
   - typed models for the catalogue responses used by S2–S5
4. **S1.4 BFF skeleton:**
   - session-cookie helpers (httpOnly, Secure in production, SameSite=Lax) and a server-side `getSession()` that returns no user yet
   - a route-handler pattern for later client calls
   - no sign-in UI yet (S6)
5. **S1.5 Coming-soon gate:**
   - `proxy.ts` sends every route to the existing coming-soon page while `STORE_OPEN=false`
   - `robots` and the sitemap stay as they are
   - production default: `false`
6. **S1.6 Shop layout:**
   - **Header:** logo, categories from `GET /categories`, search icon, account and cart icons as placeholders.
   - **Mobile:** menu drawer.
   - **Footer:** brand, links (placeholders for S14), payment badges.
   - **Accessibility:** a skip-to-content link.
7. **S1.7 Components:**
   - Button, Link, Input, Select, Checkbox, Badge, Price (₹ formatting from decimal strings), Skeleton, Dialog, Drawer, Toast
   - all keyboard-accessible, with a visible focus ring
8. **S1.8 States:**
   - `not-found`
   - `error` (friendly, with a retry)
   - loading skeletons
   - an "API unreachable" message instead of a crash
9. **S1.9 Images:** `next/image` allowed for the API's local uploads (development) and Cloudinary (production).
10. **S1.10 Tests and docs:**
    - unit tests (config validation, API client, price formatting, gate rules)
    - Playwright smoke tests (the gate on and off, header categories from the real API, 404 page, mobile menu)
    - a screenshot click-through
    - status, testing guide, `PROGRESS.md`, README

**Out of scope:** real shop pages (S2 onwards), sign-in (S6), and any backend change.

## Approach

- **Source structure** (`src/`):
  - `app/` (routes; `(shop)` route group for the shop layout; the existing coming-soon page kept)
  - `lib/api/` (client, errors, types)
  - `lib/session/`
  - `lib/config.ts`
  - `components/ui/`, `components/layout/`
- **Server-only code** is marked `import 'server-only'`, so secrets and the API URL never reach the browser bundle.
- **Data fetching:**
  - Server Components call `apiFetch` directly.
  - Catalogue data is cached briefly. Categories are revalidated every few minutes, following the caching guide in the installed Next.js docs.
- **The coming-soon page stays byte-for-byte the same.** Only the gate decides when it is shown.
- **Design:** the existing tokens (mint, deep green, gold), Cormorant Garamond for headings, Geist for text. Generous whitespace and a premium, calm feel, matching the coming-soon page.

## Files (new or changed)

```
package.json, .prettierrc, vitest.config.ts, playwright.config.ts, .env.example
src/proxy.ts                               coming-soon gate
src/lib/config.ts, src/lib/api/*, src/lib/session/*, src/lib/format.ts
src/components/ui/*, src/components/layout/*
src/app/(shop)/layout.tsx, src/app/(shop)/page.tsx (temporary "shop home" placeholder until S2)
src/app/not-found.tsx, src/app/error.tsx
tests/unit/*, tests/e2e/*
dev/status/…-phase-s1-foundation.md, dev/testing/…-phase-s1-foundation.md, dev/PROGRESS.md, README.md
```

## Verification

1. `typecheck`, `lint`, `format:check`, `build`: clean.
2. **Unit tests:**
   - config errors
   - `apiFetch` success, an API error with fields, timeout, unreachable API
   - `₹` formatting (`"18397.00"` → `₹18,397`)
   - gate decisions
3. **Playwright, against the real API:**
   - `STORE_OPEN=false` → every URL shows Coming soon
   - `STORE_OPEN=true` → the shop layout with the real category names
   - unknown URL → the 404 page
   - mobile menu opens and closes with the keyboard
   - API stopped → the friendly message
4. **Click-through** at desktop and mobile widths, screenshots reviewed.
5. Status report and QC guide written; `PROGRESS.md` updated.

## Open questions

1. **Gate default.** Recommended: **`STORE_OPEN=false` in production, `true` locally** (roadmap question 1).
2. **Header categories.** Recommended: **top-level categories from the API** (Clip-in extensions, Tape-in extensions, Wigs, Ponytails), with their sub-categories in a dropdown.
