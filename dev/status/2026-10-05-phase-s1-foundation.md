# Status: Phase S1, storefront foundation

Tracks progress against [`plan/2026-10-05-phase-s1-foundation.md`](../plan/2026-10-05-phase-s1-foundation.md).

## 2026-10-05: implemented and verified

**Result: done.** Every in-scope item (S1.1–S1.10) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build: all clean
- 16 unit tests (Vitest)
- 12 Playwright end-to-end tests against the real NestJS API (desktop and phone)
- a screenshot click-through at desktop and phone sizes, reviewed by eye

**haircraft.in is unchanged:** the coming-soon page file is byte-for-byte the original, and in production every address still shows it.

Approved with the recommended options:

- the gate is closed in production and open locally
- the header shows the top-level categories from the API, with sub-categories in a dropdown

---

## What was built

### S1.1 Tooling

- **Scripts:**
  - `dev` / `start` on port **3001**
  - `typecheck` (`next typegen` + `tsc`)
  - `lint`, `format`, `format:check`
  - `test` (Vitest), `test:e2e` (production build + Playwright)
  - `check` (everything but e2e)
- **Prettier** with the Tailwind plugin, reading our stylesheet for class order. The coming-soon component is excluded, so it stays exactly as launched.
- **Dependencies:**
  - `@types/node` raised to v24 to match Node 24 (the v20 types blocked Vitest)
  - new dev tools: Vitest, @vitejs/plugin-react, Playwright, Prettier, cross-env
  - `server-only` added
- **Settings files:** `.env.example` (committed; `.gitignore` now allows it) and `.env.local` for development.

### S1.2 Settings (`src/lib/env.ts`)

- **Settings:** `API_BASE_URL`, `STORE_OPEN`, `SITE_URL` and `API_TIMEOUT_MS`.
- **Validation:** every problem is listed at once with a clear message (e.g. "STORE_OPEN must be true or false").
- **Safe defaults:** in production the shop is **closed** unless `STORE_OPEN=true`; in development it is open. The site address defaults to haircraft.in in production and localhost:3001 otherwise.
- **Nothing reaches the browser:** no `NEXT_PUBLIC_` settings.

### S1.3 API client (`src/lib/api/`)

- **`apiFetch` / `apiFetchPage`** (server-only) unwrap the API's `{ success, data, meta }` envelope.
- **Errors** become a typed `ApiError` with:
  - status, `code`, message
  - field errors (`messagesFor('email')`)
  - `data` and the API's request id
  - `unavailable` for outages
- **Failures that never reach the API** get their own codes: `API_UNREACHABLE`, `API_TIMEOUT` (10 s, configurable) and `API_BAD_RESPONSE` (e.g. an HTML error page from a proxy).
- **Caching:** public catalogue reads can be cached with `revalidate` (categories: 5 minutes). Anything with a customer token is **never** cached, even if asked.
- **`friendlyMessage()`:**
  - API messages (written for customers) are shown as they are
  - outages, 5xx and 429 get calm wording
  - technical details are never shown
- **Typed models** for categories and product cards, ready for S2–S5.

### S1.4 Session skeleton (BFF, `src/lib/session/`, `src/lib/bff/`)

- **Cookie names** (`hc_at`, `hc_rt`) and options: **httpOnly always, Secure in production, SameSite=Lax**, path `/`.
- **`getSession()`** returns a guest for now. Sign-in, token checks and refresh arrive in S6. The shop layout already reads it, so shop pages render per request (the header will show the account and cart).
- **`bff()` / `bffError()`:** the pattern for route handlers under `/bff/…`. They return JSON with a friendly message and `no-store`, and API outages answer 503.
- **First route:** `GET /bff/health` (storefront and API reachability).

### S1.5 Coming-soon gate (`src/proxy.ts`, `src/lib/gate.ts`)

- **Next 16 Proxy** (formerly middleware). While the shop is closed, every page **shows the coming-soon page at its own URL** (a rewrite, not a redirect).
- **Always served:** `robots.txt`, `sitemap.xml`, the icons and `/bff/health`.
- **Once open:** old `/coming-soon` links redirect to `/`.
- **The coming-soon page moved** to `src/app/coming-soon/` and keeps its own title, description, canonical `/` and social cards.
- **The root layout** now has neutral defaults: a title template `%s | HairCraft` and the WebSite/Organization structured data.

### S1.6 Shop layout (`src/app/(shop)/`, `src/components/layout/`)

- **Header:**
  - logo, categories from `GET /categories` (empty branches hidden)
  - a dropdown for sub-categories (click, hover, Enter, Escape returns focus, closes when focus leaves)
  - labelled icons: Search, Wishlist, Account, Cart
  - sticky, with a translucent mint background
- **Phones:** a menu button opens a drawer with all categories. It closes with Escape, the close button, the backdrop, or after choosing a page.
- **Footer:** brand line, payment methods, and links reserved for the information pages (S14), with "GST included".
- **Keyboard:** a "Skip to content" link.
- **Temporary home page:** a welcome and "Shop by category" from the API, until S2.

### S1.7 Components (`src/components/ui/`)

- **Basics:** Button and ButtonLink (primary, secondary, ghost, gold; loading state), Input, Select, Checkbox (label, hint, error connected with `aria-describedby` / `aria-invalid`).
- **Prices:** Price (sale price with the old price struck through, read out as "Sale price…, was…") and PriceRange.
- **Feedback:** Badge, Skeleton, Toast (polite status; errors as alerts; dismissable).
- **Dialog / drawer** on the native `<dialog>`: focus is trapped and returned, Escape and backdrop close it, and the page doesn't scroll behind.
- **Icons:** line icons.
- **Formatting:** `formatPrice` keeps the API's decimal strings, never floats, with Indian digit grouping (`₹18,39,700`).

### S1.8 States

- **404:** inside the shop layout, with links home and to the shop (status 404, not indexed).
- **Error page:** for shop pages (calm message, reference id, "Try again" using Next 16's `retry()`), plus a self-contained `global-error`.
- **Loading skeleton.**
- **API down:** a notice under the header and a "We'll be right back" panel instead of a crash. The page still answers 200 and the layout works.

### S1.9 Images

`next/image` allows:

- **Cloudinary**
- **the API's `/uploads`** (development)

Next 16 refuses images from private addresses, so `dangerouslyAllowLocalIP` is switched on **only** when the API is on this machine and either running in development or with `ALLOW_LOCAL_IMAGES=true` (local test builds). It is never switched on on a server.

---

## Deviations from the plan, and why

| Plan                                      | Built                                                                | Reason                                                                                                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caching per the Next.js docs              | The fetch-`revalidate` model (Cache Components not enabled)          | Cache Components is optional in Next 16 and requires restructuring every page around Suspense. The simpler model fits a shop whose pages read the session cookie; it can be revisited in S15. |
| —                                         | `/bff/health` route                                                  | A concrete first BFF route, and lets monitoring check the storefront and API even while the gate is closed.                                                                                   |
| —                                         | `cross-env` dev dependency                                           | npm scripts run under Windows `cmd`, where `VAR=value command` doesn't work.                                                                                                                  |
| "Coming-soon page byte-for-byte the same" | The component file is identical, but the page moved to its own route | The gate needs it at a fixed address (`/coming-soon`) to show it everywhere. The visitor sees the same page and metadata at the same URLs.                                                    |

## Issues found and fixed during implementation

1. **Clicking a category in the menu with a mouse closed it immediately** (found by Playwright): hovering opened it, then the click toggled it shut. Now a click right after the hover keeps it open, and keyboard toggling is unchanged.
2. **Prettier's Tailwind plugin re-ordered classes in the live coming-soon component.** The look was identical, but the file must stay as launched. The file was restored from git and excluded from formatting, and the plugin now reads our stylesheet so brand colours sort correctly.
3. **Menus closed after navigation via an effect**, which React's lint flags as cascading renders. They now use React's "adjust state while rendering" pattern.
4. **The error component used `unstable_retry`** (Next 16.2's name). The installed 16.3 docs name it `retry`.
5. **Unstyled screenshots in one click-through run.** An old server from an earlier run was still on the port, serving pages that pointed at CSS from a replaced build. The servers were stopped by port and the run repeated; not a code problem.
6. **Vitest warning about the config's module type:** renamed to `vitest.config.mts`.

## Verification results

| Check                                                                                                                                                                                                                                       | Result               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `npm run typecheck`                                                                                                                                                                                                                         | ✅ clean             |
| `npm run lint`                                                                                                                                                                                                                              | ✅ clean             |
| `npm run format:check`                                                                                                                                                                                                                      | ✅ clean             |
| `npm run build` (production)                                                                                                                                                                                                                | ✅                   |
| `npm test`: 16 unit tests (settings and defaults, gate decisions, ₹ formatting, session cookie options, category menu, API client: URLs, data, lists, field errors, request id, unreachable, timeout, unreadable answer, friendly messages) | ✅                   |
| `npm run test:e2e`: 12 Playwright tests on three servers (open, closed, API down), desktop and Pixel 7                                                                                                                                      | ✅                   |
| `npm audit --omit=dev` (what ships)                                                                                                                                                                                                         | ✅ 0 vulnerabilities |
| Screenshot click-through (desktop 1366 px, iPhone 13)                                                                                                                                                                                       | ✅ reviewed          |

**End-to-end tests:**

- **Shop closed:**
  - `/`, `/shop`, `/shop/wigs`, `/account` and a made-up address all show Coming soon (200, same URL, original title, no shop header)
  - robots, sitemap and health still work
- **Shop open:**
  - the real categories in the header, 4 category cards linking to `/shop/<slug>`
  - labelled icons, footer
  - dropdown by click, Escape and Enter
  - skip link
  - 404 page inside the layout with a working "home" link
  - `/coming-soon` → `/`
  - health check `no-store`
- **API down:**
  - the home page still answers 200 with the notice and "We'll be right back"
  - `/bff/health` answers 503 `API_UNREACHABLE` with the friendly message
- **Phone:**
  - drawer opens and closes with Escape (focus returns) and the close button
  - choosing "Wigs" navigates and closes it
  - no sideways scrolling

**Click-through:**

- closed: coming soon, desktop and phone
- open: home, category dropdown, skip link, 404
- API down
- phone: home, menu drawer
- After the first look, the logo was enlarged (it was too small to read "HAIR CRAFT"); re-checked.

## Known limitations / deferred

- **Links to pages that come later** go to the 404 page for now: category pages (`/shop/...`, S3), search (S4), account (S6/S9), wishlist (S8), cart (S7), and the information pages (S14).
- **The home page is temporary** (S2 replaces it).
- **Sign-in:** `getSession()` always returns a guest until S6.
- **`npm audit` (all dependencies)** reports 5 high findings in `eslint-config-next`'s lint tooling (`braces` via `fast-glob`). It is development-only and was there before this phase; the only fix offered downgrades Next's lint config to v14, so it was not applied.
- **Git:** a commit "Storefront phase S1 foundation (work in progress)" appeared on a new branch `dev-esha` during this phase. It was not made by this work session. The work since then is uncommitted, as usual, until you commit.
