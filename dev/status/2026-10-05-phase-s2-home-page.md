# Status: Phase S2, home page

Tracks progress against [`plan/2026-10-05-phase-s2-home-page.md`](../plan/2026-10-05-phase-s2-home-page.md).

## 2026-10-05: implemented and verified

**Result: done.** Every in-scope item (S2.1–S2.9) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build: all clean
- 23 unit tests (7 new) and 20 Playwright tests (8 new) against the real API, all passing
- a screenshot click-through at desktop and phone sizes, reviewed by eye

The click-through and its follow-up checks found and fixed two real problems (below).

Approved with the recommended options:

- a catalogue photo in the hero
- the free-shipping amount from a storefront setting
- any reviewed product in Best rated

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What was built

### S2.1 Product card (`src/components/product/`)

- **Contents:** photo (`next/image`, fitting sizes per screen width, lazy unless marked first on the page), name, price range ("₹3,999 – ₹4,999", read out as "From …").
- **Labels:**
  - **Sale** when a variant is on sale
  - **Sold out** when nothing is in stock (it wins over Sale, and the photo is dimmed)
- **Stars:** shown only when the product has reviews, rounded to the nearest half star. Screen readers hear the exact value ("Rated 4.3 out of 5, 12 reviews"). The half stars use a clipped SVG, so the same element ids are not repeated in every card.
- **One link:** the whole card is a single link to `/product/<slug>` (the product page is S5): one stop for keyboard users.

### S2.2 Hero

- **Text:** headline "Hair extensions, crafted for _confidence_" (the page's only `h1`) and a short promise.
- **Buttons:** **Shop all** and **Shop wigs**.
- **Photo:** the newest product that has one, in a round white frame with a gold ring and soft mint and gold glows, like the coming-soon page. It is preloaded.
- **Animation:** one gentle rise-in, in CSS. It is switched off for people who prefer reduced motion.
- **API down:** the text still stands alone without the photo.

### S2.3 Shop by category

- **Cards:** the top-level categories as photo cards (the newest product photo of each category, under a deep-green gradient), with name, description and product count, linking to `/shop/<slug>`.
- **Layout:** two per row on phones (descriptions hidden there to stay compact), four on desktop.

### S2.4 New arrivals and S2.5 Best rated

- **New arrivals:** the 8 newest products (`sort=createdAt:desc`), with **View all** → `/shop`.
- **Best rated:**
  - up to 4 products with reviews, highest rated first
  - **the whole section is hidden while no product has reviews**
  - **See more** → `/shop?sort=rating:desc`
- **Layout:** a grid on desktop; on phones a row that scrolls sideways, snapping card by card, with the next card peeking in.

### S2.6 Brand promise strip

"Why HairCraft", four promises with icons:

- 100% human hair
- **Free shipping on orders above ₹1,999**
- secure payments (UPI, cards, net banking, wallets)
- here to help

The amount comes from the new storefront setting `FREE_SHIPPING_THRESHOLD`, which is validated and must match the backend's:

- `0` → "On every order"
- empty → "Fast, tracked delivery across India" (no amount)

Checkout (S10) will always show the real shipping from the API.

### S2.7 SEO

- **Title:** "HairCraft — Premium Hair Extensions, Wigs & Ponytails".
- **Description** naming the products, **canonical** `/` and **Open Graph** title and description.
- **Structured data:** `WebSite` and `Organization` (from S1). The search-box markup waits for S4.

### S2.8 States

- **Streaming:**
  - the hero and promises render at once
  - **Shop by category** and **New arrivals** each stream in behind their own skeleton
  - **Best rated** streams in or simply doesn't appear
- **API down:**
  - the page still answers 200: hero text, promises, and a calm "We'll be right back" in each data section
  - Best rated is left out

---

## Deviations from the plan, and why

| Plan                                      | Built                                                  | Reason                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Best rated: up to 8                       | Up to 4                                                | One row on desktop. With few reviewed products, a second half-empty row looked unfinished. "See more" leads to the full list (S3). |
| Hero animation "Framer Motion or CSS"     | CSS only                                               | The hero stays a server component (no extra JavaScript for the first screen).                                                      |
| Category cards in four columns everywhere | Two per row on phones                                  | Found in the click-through: full-width cards took several screens of scrolling on a phone.                                         |
| —                                         | `scripts/clear-image-cache.mjs`, run before Playwright | Keeps the new photo check honest (below).                                                                                          |

## Issues found and fixed during implementation

1. **Product photos didn't show in local production runs** (found in the click-through screenshots):
   - **Cause:** Next.js reads `next.config` again when the production server **starts**, not only at build. The setting that allows photos from the local API (`ALLOW_LOCAL_IMAGES`) was only given to the build, so the server answered `400 "url" parameter is not allowed`.
   - **Fix:** the Playwright servers now get it at start too, and `.env.example` says it is needed at both steps.
   - **Not affected:** development (`npm run dev`) and real production (photos come from Cloudinary, a public host).
   - **New test:** every category and new-arrival photo must actually **load** (`naturalWidth > 0`), not just exist as an `<img>`.
   - **Proving the test:** a server deliberately started without the setting answered 400 and the same server with it 200. Next's optimized-image cache had at first hidden the problem (it served earlier copies), so the cache is now cleared before each e2e run.
2. **On phones the whole page was widened to about 1,400 px** (found in the click-through: the phone screenshot came out three and a half times too wide):
   - **What it did:** the sideways-scrolling product rows made phone browsers zoom the page out.
   - **Why the test missed it:** the S1/S2 phone test compared the page width with the window width, which grows along with it.
   - **Narrowing it down:** hiding the rows, or giving them `position: relative`, brought the page back to 390/412 px.
   - **Fix:** the rows are now `relative`, the standard rule for such rows.
   - **Stronger test:** the window must be exactly the phone's width and the page no wider.
   - **Proving the test:** the old build measured 1,450 against a 412-px screen, which the new test rejects; the fixed build measures 412 / 412.
3. **The new free-shipping setting rejected every valid amount**, caught by its unit test before any page used it: the validation pattern had lost its backslashes when inserted.
4. **Lint and style details:**
   - a type named `Promise` shadowed JavaScript's built-in; it is now `BrandPromise`
   - `line-clamp` and `sm:block` conflicted, which would have lost the two-line limit on desktop; now `hidden sm:line-clamp-2`

## Verification results

| Check                                                                                   | Result                                      |
| --------------------------------------------------------------------------------------- | ------------------------------------------- |
| `npm run check` (typecheck, lint, format, unit tests)                                   | ✅ 23 unit tests                            |
| `npm run test:e2e` (production build, image cache cleared, three servers)               | ✅ 20 tests                                 |
| Phone width on the production build                                                     | ✅ iPhone 13: 390 / 390; Pixel 7: 412 / 412 |
| Screenshot click-through: desktop full page and first screen, phone full page, API down | ✅ reviewed                                 |

**New unit tests (7):**

- half-star rounding and five stars always
- screen-reader rating text
- Sale and Sold out rules
- product link
- Best rated keeps only reviewed products
- shipping wording for an amount, 0 and none
- `FREE_SHIPPING_THRESHOLD` validation

**New Playwright tests (8):**

- **hero:** title, one `h1`, button links, meta description
- **promises:** all four, with "On orders above ₹1,999"
- **photos:** every category and new-arrival photo loads
- **Shop by category:** 4 cards with photos and the right links
- **New arrivals:** exactly the API's newest 8 in order, each linking to its product, with Sale, Sold out and stars exactly where the API says
- **Best rated:** exactly the reviewed products in rating order, with the right spoken rating
- **API down:** 200, hero, promises, calm message, no Best rated
- **phone:** rows scroll sideways while the page fits the screen

## Known limitations / deferred

- **Links to later pages:** product links go to the 404 page until S5, and `/shop` until S3.
- **The hero and category photos are the development catalogue's sample images.** Real photography arrives with your products, and a dedicated brand hero photo can replace the product photo before launch.
- **Updating the free-shipping amount:** it is written in two places (backend and storefront settings), so changing it means updating both. Checkout always uses the backend's.
- **Best rated today:** it shows 3 products (1, 5 and 1 reviews). A minimum review count can be added later.
