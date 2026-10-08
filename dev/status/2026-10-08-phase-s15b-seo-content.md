# Status: Phase S15b, SEO content and keywords

Tracks progress against [`plan/2026-10-08-phase-s15b-seo-content.md`](../plan/2026-10-08-phase-s15b-seo-content.md).

## 2026-10-08: implemented and verified, with drafts for the owner to review

**Result: built** on `dev-esha` only. Nothing is live, `main` was not touched, and nothing was pushed.

**Every in-scope step (S15b.1–S15b.6) is implemented.** All new text is a draft for the owner, marked `DRAFT — OWNER TO CONFIRM` in the code:

- the five hair guides
- the four category buying guides

**Verified by:**

- **Storefront:**
  - typecheck, ESLint, Prettier and the build clean
  - 207 unit tests (13 new) and 211 Playwright tests (7 new; the accessibility audit now covers the guide pages too), all passing
  - the speed budgets still hold
- **Screenshots reviewed by eye:** the guides page, a guide, a category's buying guide, and a guide on a phone.

Approved with the recommended options:

- the keyword list from the plan
- five drafted guides
- drafts by me for the owner to review
- the owner fixes the Toppers category description

---

## What was built

### S15b.1 Keyword-led titles and descriptions

| Page     | Before                                                | Now                                                        |
| -------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Home     | HairCraft — Premium Hair Extensions, Wigs & Ponytails | HairCraft — Human Hair Extensions, Toppers & Wigs in India |
| Shop     | Shop All Hair Extensions, Wigs & Ponytails            | Shop 100% Human Hair Extensions, Toppers & Wigs            |
| Category | Clip-in Extensions — Human Hair Clip-in Extensions    | Human Hair Clip-in Extensions in India                     |
| Product  | Wrap-around Ponytail                                  | Wrap-around Ponytail — Human Hair, 20–24 inch              |

- **Descriptions** give the product's own words, then "100% human hair, from ₹3,999", then "Free delivery over ₹1,999 and easy returns". The price and threshold come from the catalogue and the API's settings (B15).
  - Each stays within 160 characters, dropping the delivery line first so it always ends on a whole sentence.
- **Later pages of a list** say which page they are ("— Page 2"), so search results never show two identical titles.
- **Titles fit what Google shows** (about 60 characters, including "| HairCraft"): key facts are dropped when a product's name is long.
- **Photos already had descriptions:** they fall back to the product's name and option, so nothing was needed there.

### S15b.2 Category buying guides

- **Below the products, on each main category's first page:**
  - "Buying guide: clip-in hair extensions" (and toppers, wigs, ponytails)
  - who it suits, how to choose, wearing and care
  - three questions that open in place
  - links to related hair guides
- **Sub-categories** (seamless clip-ins, lace front wigs) show their parent's guide.
- **Later pages** don't repeat it.
- **The text** is in `src/content/categories.ts`.

### S15b.3 Hair guides at `/guides`

- **Five guides,** each 500–800 words:
  1. How to choose hair extensions: length, shade and texture
  2. Clip-in vs tape-in vs topper: which hair extension is right for you?
  3. Hair toppers for thinning hair: a complete guide for women
  4. How to wash and care for human hair extensions and wigs
  5. Wedding hair: adding length and volume for your big day
- **Each guide has:**
  - reading time and "Last updated"
  - "On this page" links
  - tip boxes
  - a "Shop the look" panel linking the right categories
  - "Keep reading"
  - breadcrumbs, Article data for Google, and its own share image
- **The guides page** lists them all, with a list for Google.
- **Unknown guides** are "not found".
- **The text** is in `src/content/guides/`. Adding a guide is one new file plus a line in `index.ts`.

### S15b.4 Internal links

- **Footer:** the Shop column lists the categories (from the catalogue) and "Hair guides".
- **Product pages:** "Helpful guides" (for its category, or the general ones) above "You may also like".
- **FAQ:** links to the guides (in its intro and in the shade answer).
- **Guides and buying guides** link to categories and to each other. Every link is checked by a test.
- **Category addresses** live in one place (`src/content/shop-links.ts`): if a category's slug changes in the admin panel, change it there.

### S15b.5 Business details for Google

- **The business** is now an `OnlineStore` (a kind of organisation Google understands for shops).
- **`BING_SITE_VERIFICATION`** adds Bing Webmaster Tools' verification tag, next to Google's.
- **The sitemap** lists `/guides` and every guide.

## Problems found and fixed

1. **Titles too long:** "100% Human Hair" plus a length range was too long for Google's results, so titles say "Human Hair" (the "100%" is in the description).
2. **Cut-off category descriptions:** they ended with "…and…". The delivery line is now dropped first, so they end on a whole sentence.
3. **Old title checks:** six checks in four older test files expected the old titles and home description. They were updated.
4. **An intermittent payment test:** "pay later" failed once in three runs while the computer was busy, because confirming a payment took more than 5 seconds. Payment wasn't changed in this phase; that one step now allows 15 seconds, and 18 repeated runs passed.

## Changed from the plan

- **The title and description builders** live in `src/lib/seo/titles.ts` (with the other SEO code), not `src/content/seo.ts`.
- **Guide cards** are text cards with a gold accent rather than photo cards: there are no guide photos yet. The owner's photos can be added later.
- **Photo descriptions** needed no change (they already fall back to the product's name).

## Known and accepted

- **Ranking takes time.** Google needs weeks to months after launch to rank new pages, and also weighs things outside the site: other sites linking to HairCraft, reviews, social posts.
- **The guides are drafts.** Please read them for accuracy, especially the care advice and anything about your hair (density, bases, lengths), and change whatever doesn't match your products.
- **The Toppers category's description** in the catalogue still reads like tape-ins ("Semi-permanent extensions that last 6–8 weeks"). Fix it in the admin panel (Catalogue → Categories). Its buying guide and title are already right.
- **Tape-ins have no category,** so links to tape-ins open a search for "tape-in". Adding a Tape-in category in the admin panel, then its address in `shop-links.ts`, would help both shoppers and Google.

## Not done / follow-ups

- **One new guide a month,** if you can. Topic ideas: "Hair extensions for short hair", "Postpartum hair loss: covering thinning while it grows back", "How to blend extensions with layered hair", "Clip-in bangs: choosing a fringe".
- **Real photos for guides** (you wearing the products), when you have them.
- **Hindi pages** (a later phase, if wanted).
