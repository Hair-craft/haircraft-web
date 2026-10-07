# Status: Phase S15, SEO and performance

Tracks progress against [`plan/2026-10-07-phase-s15-seo-performance.md`](../plan/2026-10-07-phase-s15-seo-performance.md).

## 2026-10-07: implemented and verified, with one target not met

**Result: built.** Every in-scope step (S15.1–S15.7) is implemented. There were no backend changes.

**One target from the plan isn't met:** busy time (TBT) under 200 ms on a slowed-down phone. Google's other two measures (LCP, CLS) pass on every page, and the accessibility audit is clean. See "Speed" below for the numbers, the cause, and what the test checks instead.

**Verified by:**

- **Storefront:**
  - typecheck, ESLint, Prettier and the build clean
  - 194 unit tests (18 new) and 204 Playwright tests (15 new), all passing:
    - 9 SEO
    - 5 accessibility runs covering about 45 pages and states
    - 1 speed test
- **Screenshots reviewed by eye:**
  - both share images
  - a listing, the home page's story and a product on a phone, after the colour changes

Approved with the recommended options:

- axe-core and Playwright's own timings (no Lighthouse)
- the rating plus up to 5 reviews in product data
- a Search Console setting
- indexing off unless `ALLOW_INDEXING=true`
- social profiles added when the owner sends them

---

## What was built

### S15.1 Sitemap and robots

- **`robots.txt` follows the settings:**
  - with `ALLOW_INDEXING=true` (the live site only), search engines may crawl everything except the account, checkout, bag, wishlist, sign-in pages, the shop's own search results, review forms and `/bff/`, and are pointed at the sitemap
  - without it, nothing may be crawled, and every page says `noindex` too
- **The site address** comes from `SITE_URL`, not written into the code.
- **The sitemap** lists each product's photo (Google Images).
  - It can't give categories and products "last changed" dates, because the public API doesn't share them.

### S15.2 Link previews and page details

- **A branded 1200×630 share image** (logo, label, title in the brand font, haircraft.in) for every page without its own.
- **Categories:** each gets its own, with its first product's photo.
- **Products** keep their own photo.
- **While the shop is closed,** the images are still served.
- **Large-picture cards** for X; the site name and locale on every page's preview.
- **The page language** is `en-IN`.
- **`GOOGLE_SITE_VERIFICATION`** adds Search Console's verification tag when set.
- **Social profiles** (`src/content/business.ts`) appear in the footer and in Google's business details once filled in. There are none yet.

### S15.3 Structured data

- **Products:**
  - one offer per option (SKU, price, stock, address)
  - each offer has **delivery details**: free when the item reaches the free-delivery minimum, otherwise the charge (from B15); packing 1–2 days and delivery 3–7 days (S14)
  - each offer has **the returns policy**: 7 days, the customer pays return delivery (S14)
  - **up to 5 approved reviews** alongside the rating
- **The business:** contact email, area served (India), and the returns policy.
- **Categories and the shop:** a list of the products shown, in order.
- **Safety:** all structured data goes through one helper that escapes `<`.
  - A unit test caught an editing slip that had disabled that escaping. It's fixed, and the test stays.

### S15.4 Images

- **The logo was downloaded at full size (51 kB) on every page.** It's now requested at the size it's shown (about 4 kB).
- **Already in good shape:** every other photo has the right `sizes`, only the first big image loads early, and no image moves the layout (layout shift is 0 on every page but search).

### S15.5 Speed (Core Web Vitals)

Measured as a mid-range phone on slow 4G (Lighthouse's settings: 150 ms latency, 1.6 Mbit/s, CPU 4× slower), against the production build. Each page was loaded three times and the middle result counts.

| Page     | LCP (good < 2.5 s) | CLS (good < 0.1) | TBT (Google's good < 200 ms) | JavaScript       |
| -------- | ------------------ | ---------------- | ---------------------------- | ---------------- |
| Home     | 1.72 s             | 0                | 682 ms                       | 222 kB (was 262) |
| Shop     | 1.06 s             | 0                | 393 ms                       | 169 kB           |
| Category | 1.08 s             | 0                | 415 ms                       | 169 kB           |
| Product  | 1.17 s             | 0                | 466 ms                       | 173 kB           |
| Search   | 1.04 s             | 0.043            | 363 ms                       | 169 kB           |
| FAQ      | 1.07 s             | 0                | 178 ms                       | 165 kB           |

**Improvements:**

- **Home page:** 40 kB less JavaScript.
  - **Fade-ins:** plain CSS now, instead of Framer Motion.
  - **Framer Motion:** the tabs, range explorer and FAQ load its animation engine in the background, after the page is usable.
  - **GSAP:** the stacking-cards effect only runs on desktops, so only desktops download it.
- **Logo:** about 47 kB less per visit.

**Why busy time stays above 200 ms:**

- **Where the time goes:** profiling shows two tasks of about 220–250 ms on every page.
  - React starting up the page: about 200 ms.
  - The browser's first layout and styling, repeated once when the brand fonts arrive.
- **Even the smallest page** (FAQ, about 400 elements) has them.
- **Unthrottled, it's fine:** on this computer every page's busy time is 0–64 ms.
- **Getting under 200 ms in this test** would mean changing how pages become interactive (much less code in the browser), not tuning. I don't recommend that before launch.
- **Splitting the start-up into smaller parts made no measurable difference,** so I undid it.

**What the test now checks** (`tests/e2e/vitals.mobile.spec.ts`, run last and alone):

- **LCP and CLS:** Google's thresholds.
- **JavaScript:** within a few kB of today's size, so new weight is noticed.
- **Busy time:** a guard against big slowdowns (650 ms; 900 ms on the home page), not 200 ms.
- **The real measure** is INP from real visitors after launch (S16, with hosting).

### S15.6 Accessibility audit

- **axe-core (WCAG 2.2 A/AA and best practices) on about 45 pages and states, on a computer and a phone:**
  - guests: every page, plus the open menu, search suggestions, the photo viewer, the bag and form errors
  - signed in: account pages, checkout, a placed order waiting for payment, orders and reviews
  - the shop closed and the API down
- **Found:**
  - 33 colour-contrast findings
  - 3 invalid lists
  - 5 headings out of order
  - 1 duplicate landmark
  - 1 scrollable area keyboards couldn't reach
  - 1 too-small tap target
  - 1 piece of content outside a landmark
- **All fixed; the scan now finds nothing, minor findings included:**
  - **Secondary text** (the brand green at 50–65% strength, 3.7:1) is now at 70% (4.9:1 on mint, 4.5:1 or more on every background used). It looks nearly the same.
  - **A deeper gold** (`gold-ink`, #a8731c) for the gold words in headings ("confidence", "you").
  - **The filter count** in green.
  - **The range explorer's category names** are clearer.
  - **Disabled Previous/Next** are marked as disabled links, so screen readers say so.
  - **The order totals list** is valid.
  - **Products** have a hidden "Products" heading above them.
  - **The shop's category links** are named "Shop by category".
  - **The search panel** is a labelled region.
  - **The photo viewer** can be scrolled from the keyboard.
  - **The photo dots on phones** are 24 px targets (the dots look the same).
- **The scan stays as a test,** failing on any serious or critical finding. `A11Y_REPORT=1` lists everything.
- **Not done by me:**
  - **A screen-reader pass** (NVDA/VoiceOver) and **Windows High Contrast**: I can't run those here. They're in the QC guide.
  - **Already covered by earlier tests:** keyboard use throughout, 200% zoom and 320 px width.

## Problems found and fixed

1. **Disabled escaping:** the structured-data escaping was briefly disabled by an editing slip (caught by the new unit test before anything shipped).
2. **Missing share images:** home, shop and product pages lost the default share image and site name, because a page's own `openGraph` replaces the layout's. A helper (`openGraph()`) now fills them in.
3. **Font files on the server:** the share images' fonts must ship with the server build. `outputFileTracingIncludes` covers them, checked in the build output.

## Known and accepted

- **Busy time above Google's 200 ms in the lab** (above). It will be measured with real visitors after launch.
- **Search pages move slightly (CLS 0.043)** while results load. That's within "good".
- **The free-delivery amount is set twice.** It still exists in the storefront's own `FREE_SHIPPING_THRESHOLD` (offers strip, home promise, bag) as well as the API (S14 follow-up, planned for S16).
- **`ALLOW_INDEXING=true` must be set on the live site,** or Google won't index it. It's on the S16 checklist.

## Not done / follow-ups

- Real-user speed measurement (S16, with hosting).
- Search Console: you create the account and paste the code into `GOOGLE_SITE_VERIFICATION`, then submit `https://haircraft.in/sitemap.xml` (at launch).
- Social profile links, when you have them.
