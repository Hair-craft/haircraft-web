# Status: Phase S5, product page

Tracks progress against [`plan/2026-10-06-phase-s5-product-page.md`](../plan/2026-10-06-phase-s5-product-page.md).

## 2026-10-06: implemented and verified

**Result: done.** Every in-scope item (S5.1–S5.9) is implemented, and verified by:

- typecheck, ESLint, Prettier and a production build, all clean
- 69 unit tests (10 new) and 72 Playwright tests (11 new) against the real API, all passing; no backend changes were needed
- desktop and phone screenshots (product top, option picker, full-screen photos, reviews), reviewed by eye

Approved with the recommended options:

- no Add to bag until S7 ("Ordering opens soon" in its place)
- sold-out options shown struck through
- 4 related products from the same category

haircraft.in is unaffected: the coming-soon gate is still closed in production.

---

## What was built

### S5.1 Route

- `/product/<slug>` for every active product; product cards, search suggestions and review links now open it.
- An unknown or hidden product gets the shop's 404 page with a **real 404 status**.
- Breadcrumbs Home › Shop › category › product, also as structured data.

### S5.2 Gallery

- **Desktop:** a large photo with thumbnails beside it and ‹ › arrows; ← → keys move between photos.
- **Phones:** a full-width row to swipe through, with dots.
- **Full-screen view:** a click or tap opens it, with a "2 / 4" counter, arrows, swiping, and Escape or × to close.
- **Order:** the chosen option's own photos come first, then the product's general photos, then other options'.
- **One download:** the phone and desktop versions share the same photo download.

### S5.3 Option picker

- A row of buttons per property with more than one value (Length, Colour, Texture); a single value is plain text ("Texture: Body Wave").
- Picking a value keeps the other choices when that combination exists; otherwise it moves to the nearest one, preferring options in stock.
- Each button shows one of three states:
  - **chosen:** dark
  - **sold out:** struck through, still selectable
  - **only with other choices:** dashed (picking it changes the others too; screen readers are told)
- The choice updates price, stock, photos and the address (`?variant=<SKU>`) at once, without reloading. A shared link opens that option.
- Address tidying: a lower-case SKU is redirected to the catalogue's spelling, and an unknown SKU or extra parameters go to the product's plain address.
- **Without JavaScript,** the buttons are links to each option's address.

### S5.4 Price and stock

- The chosen option's price; on sale, the old price struck through with a gold **Save ₹…** (calculated exactly, in paise).
- "Inclusive of all taxes", **In stock** (green) or **Sold out** (red), and the SKU in small print.
- Changes are announced to screen readers.
- "Ordering opens soon" in a gold-edged box where Add to bag will go in S7.

### S5.5 Details

Folding sections:

- **Description** (open)
- **Details:** the product's attributes, e.g. "Pieces: 20", plus the chosen option's length, colour, texture and weight
- **Delivery & returns:** placeholder text for the owner in `src/components/product-page/content.ts`, marked like the home page FAQ

### S5.6 Rating summary and reviews

- **Stars and count** near the name, linking to the reviews.
- **"Customer reviews":** the average (e.g. "4 / 5") with stars, "Based on N reviews" and a gold bar per star level.
- **The list:** 5 reviews at a time, with stars, title, text, name, "Verified purchase" and date; sortable Newest, Highest rated or Lowest rated; **Show more reviews** for the next 5.
- More pages and other orders come from a new route, `/bff/products/<slug>/reviews`.
- No reviews: "No reviews yet. Reviews from customers who bought this will appear here."

### S5.7 Related products

"You may also like": up to 4 other products from the same category, topped up with the newest.

### S5.8 SEO

- **Per product:** title, description and share photo; canonical `/product/<slug>`, which every `?variant=` address shares.
- **Structured data:** `Product` with the name, description, photos, brand, category, the price range in INR with availability, and the rating (left out when there are no reviews, as search engines require).
- **Sitemap:** every active product, read 100 at a time, while the shop is open.

## Changed from the plan

- **Combinations that don't exist aren't disabled.** If they were, a shopper on Natural Black could never reach a length that only comes in brown. Instead those buttons are dashed, and picking one moves the other choices to an option that exists. Every value can always be reached.

## Problems found and fixed

1. **A test held a run for 21 minutes.** One new test looked for an element whose text was exactly "Details", but that heading also contains the +/− signs, so it waited until timeout. The full run then took 22.7 minutes instead of about 1. The test now targets the fold heading; the suite takes under a minute again.
2. **The tests hit the API's rate limit.** The new tests read every product several times. Together with the test servers' own requests, they passed the API's 100 requests a minute per address, so the API answered 429 and the search tests that ran next failed. The product tests now ask for each API answer once per file, and the helpers report the API's real status instead of failing on empty data. This is the shared rate limit planned for S16, seen first in tests.
3. **The review summary repeated its count** ("(1)" next to the stars, just above "Based on 1 review"); the repeat is gone.

## Known and accepted

- **Show more reviews isn't clicked in a test,** because no sample product has more than 5 reviews. The route behind it is tested directly (pages, sorting, a bad sort refused), and the sorting control is tested in the browser.
- **The five duplicate test reviews** ("Gorgeous waves") show on Deep Wave Tape-ins until the cleanup command is run (see the S2b status).
- **E2E runs sit close to the API's rate limit** until S16. If a run fails with missing sections, wait a minute and run again.

## Not done / follow-ups

- Add to bag and quantity (S7), wishlist heart (S8), writing reviews (S13).
- Size guides, videos and "notify me when back in stock" need the owner's content or decisions.
