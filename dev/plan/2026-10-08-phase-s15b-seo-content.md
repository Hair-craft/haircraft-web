# Plan: Phase S15b, SEO content and keywords

**Status: Approved (2026-10-08)** with the recommended options: start from the keyword list above; five drafted guides; drafts by me for the owner to review; the owner fixes the Toppers description. Built on dev-esha only: nothing goes live and main is not touched.

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Asked for by the owner after S15 ("do the SEO, so it's good"). S16 (launch readiness) is on hold until after this.

## Context

**S15 made the shop technically sound for search engines:**

- titles, descriptions and canonical addresses on every page
- share images
- Google product data with prices, delivery, returns and reviews
- the sitemap with photos
- speed and accessibility

**What decides ranking from here is mostly content and keywords:** whether HairCraft's pages answer what people in India actually search for.

**What the shop has today:**

- **Category pages:** one line of text each (for example "Wigs: Full coverage in any length and texture.").
  - "Toppers" is described as "Semi-permanent extensions that last 6–8 weeks", which reads like tape-ins: a catalogue slip to fix in the admin panel.
- **Product pages:** titles are just the product name ("Wrap-around Ponytail | HairCraft"). Descriptions come from the catalogue.
  - One product's photo has no description for search engines and screen readers.
- **The home page:** its title is "HairCraft — Premium Hair Extensions, Wigs & Ponytails".
  - It doesn't say India, human hair or the product types people search for (clip-ins, toppers, tape-ins).
- **No guides or articles.** Searches like "how to choose hair extensions", "clip-in vs tape-in" or "how to wash a human hair wig" bring most of a hair shop's search traffic, and the shop has nothing that answers them.
- **The footer links** to the shop and help pages, but not to the categories. Search engines find categories only through the menus.

**What people search for** (common searches in India for this category; the owner can refine the list, open question 1):

| Group        | Examples                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Products     | human hair extensions, clip in hair extensions, hair topper for women, hair patch for women, tape in extensions, ponytail extension, lace front wig, bangs clip / fringe clip |
| With "India" | hair extensions India, human hair wig price in India, buy hair topper online India                                                                                            |
| Problems     | thinning hair at the crown, hair volume for wedding, hair loss after delivery (postpartum), short hair to long                                                                |
| Questions    | how to choose hair extensions, clip in vs tape in, how long do human hair extensions last, how to wash a wig                                                                  |

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **S15b.1 Keyword-led titles and descriptions:**
   - **the home page title:** "HairCraft — 100% Human Hair Extensions, Toppers & Wigs in India"
   - **category titles:** "Human Hair Clip-in Extensions in India | HairCraft"
   - **product titles:** the name plus its key facts, "Wrap-around Ponytail — 100% Human Hair, 22 inch | HairCraft", built from the catalogue
   - **descriptions** written as a reason to click, with the price from ("from ₹4,999"), free delivery and returns, under 160 characters, built from the catalogue so they stay true
   - **photos without a description** get one made from the product name and option (for example "Wrap-around Ponytail in Natural Black")
2. **S15b.2 Category guides:**
   - each category page gets a "Buying guide" section below the products: about 300–400 words on who it suits, how to choose length and shade, how to wear and care for it
   - a few common questions for that category, with links to related categories and guides
   - the text lives in `src/content/categories/` (one file per category), as drafts for the owner, like S14
   - a category without a guide shows just its products, as now
3. **S15b.3 Hair guides (a small blog)** at `/guides` (open question 2):
   - **five drafts to start:**
     - "How to choose hair extensions: length, shade and texture"
     - "Clip-in vs tape-in vs topper: which is right for you?"
     - "Hair toppers for thinning hair: a complete guide"
     - "How to wash and care for human hair extensions and wigs"
     - "Wedding hair: adding length and volume for your big day"
   - **each guide has:**
     - a title, a summary, reading time and "Last updated"
     - headings people can jump to
     - links to the right categories and products
     - Article structured data and its own share image
   - **a guides index** linked from the footer and the FAQ
4. **S15b.4 Internal links:**
   - **the footer** lists the categories ("Shop by category")
   - **product pages** link to their category's guide ("How to choose your clip-ins →")
   - **the FAQ** links to the guides
   - **guides** link to products
5. **S15b.5 Business details for Google:**
   - the organisation becomes an `OnlineStore` (a type Google understands for shops)
   - **Bing Webmaster Tools:** a setting for its verification code (`BING_SITE_VERIFICATION`), next to Google's
6. **S15b.6 Tests, click-through, docs.**

**Out of scope:**

- paid ads
- link building and social posting (marketing work outside the site)
- other languages (Hindi pages; possible later)
- a blog editor for staff (guides are written in files, like the information pages)

## Design

- **Buying guide on category pages:** below the products, a calm reading column in the S14 style, with a heading ("Buying guide: clip-in extensions"), short sections and a few questions that open in place.
  - It doesn't push products down: shoppers see products first.
- **Guides:**
  - **`/guides`:** cards with an image, title, summary and reading time
  - **`/guides/<slug>`:** a reading layout with a contents list, pull-quotes for tips, and product cards for the products mentioned
  - **printing:** works like the information pages

## Files

```
src/content/seo.ts                         keyword-led title and description builders (pure, tested)
src/content/categories/<slug>.ts           buying guides per category (drafts)
src/content/guides/<slug>.ts               the five guides (drafts)
src/app/(shop)/guides/page.tsx, [slug]/page.tsx, [slug]/opengraph-image.tsx
src/components/guides/…, src/components/listing/category-guide.tsx
src/components/layout/footer.tsx           Shop by category
src/lib/seo/organization.ts, src/lib/env.ts   OnlineStore; BING_SITE_VERIFICATION
src/app/sitemap.ts                         guides
tests/unit/seo-content.test.ts, tests/e2e/guides.spec.ts
```

## Testing

1. **Unit:**
   - the title and description builders (length limits, price from, never empty, no repeated words)
   - every guide's and category guide's links point to real pages
   - Article data has Google's required fields
2. **Playwright:**
   - category pages show their guide below the products
   - `/guides` and each guide work on a computer and a phone, with no sideways scrolling
   - guides appear in the sitemap and footer
   - the axe-core audit passes on the new pages
   - the speed budgets still hold
3. **By eye:** a category with its guide, the guides index and one guide, on a computer and a phone.

## Risks

- **Search ranking takes weeks to months** after launch, and depends on things outside the site (other sites linking to HairCraft, reviews, social posts). This phase gives Google the right material; it can't promise positions.
- **Thin or copied text hurts ranking.** The drafts are written fresh for HairCraft, and the owner should read them for accuracy (especially care advice and claims about the hair).
- **Keywords forced into text read badly and are penalised,** so they're used naturally, in titles and headings where they fit.

## Open questions

1. **Keywords.** Recommended: **I start from the list above;** you add any words your customers use (for example from Amazon or Flipkart searches, or what customers say when they message you). The alternative is a paid keyword tool (Ahrefs, Semrush) for exact search volumes, which costs money and isn't needed to start.
2. **Guides (a small blog).** Recommended: **yes, five drafted guides at launch** (this is where most organic traffic comes from), with one new guide a month afterwards if you can. The alternative is category guides only, with no separate guides section.
3. **Who writes.** Recommended: **I write full drafts** (marked for your review in the code, as in S14); you correct anything about your products or experience, and add real photos when you have them (the drafts use product photos). The alternative is to send your own text.
4. **The Toppers category description** in the catalogue reads like tape-ins. Recommended: **you fix it in the admin panel** (Catalogue → Categories), or tell me the right sentence and I'll give you the exact text.
