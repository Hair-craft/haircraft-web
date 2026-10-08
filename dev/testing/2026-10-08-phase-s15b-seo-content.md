# Testing: Phase S15b, SEO content and keywords

Pairs with [`plan`](../plan/2026-10-08-phase-s15b-seo-content.md) and [`status`](../status/2026-10-08-phase-s15b-seo-content.md).

**What this phase delivers:**

- keyword-led titles and descriptions
- a buying guide on each category
- five hair guides at `/guides`
- more links between pages

**Two things to do while testing:** read the text for accuracy, and note anything that should change.

## 0. Setup

Start the API (`npm run start:dev` in `nestjs-haircraft`) and the shop (`npm run dev` in `nextjs-haircraft`, `STORE_OPEN=true`).

## A. Titles and descriptions

1. **Browser tab titles:**
   - **Home:** "HairCraft — Human Hair Extensions, Toppers & Wigs in India"
   - **A category:** "Human Hair Clip-in Extensions in India | HairCraft"
   - **A product:** "<name> — Human Hair, <lengths> | HairCraft"
2. **A product's description:** right-click → View page source, search `name="description"`.
   - **Expected:** its short description, "100% human hair, from ₹…", and the free-delivery line, all ending on a whole sentence.
3. **A list's page 2** (Shop → page 2). **Expected:** the tab title ends "— Page 2 | HairCraft".

## B. Category buying guides

4. **Clip-in Extensions, scrolled below the products:**
   - **Expected:** "Buying guide: clip-in hair extensions", sections, three questions that open, and hair guide cards.
5. **Seamless Clip-ins.** **Expected:** the same clip-in buying guide.
6. **Page 2 of a category** (if it has one). **Expected:** no buying guide.
7. **Toppers, Wigs and Ponytails.** **Expected:** each has its own guide. Read them for accuracy.

## C. Hair guides

8. **Footer → Hair guides.** **Expected:** five guide cards with reading times.
9. **Open each guide:**
   - **Expected:** title, "Hair guide · N min read", "Last updated", "On this page" links that jump to sections, tip boxes, "Shop the look", and "Keep reading".
   - **Read each one for accuracy.**
10. **"Shop the look" links** open the right categories.
11. **Phone:** a guide reads well, with no sideways scrolling, and "Shop the look" appears after the text.
12. **`/guides/anything-else`** shows "page not found".

## D. Links

13. **Footer, Shop column:**
    - **Expected:** All products, each main category, Hair guides, Search.
14. **A product page:** **Expected:** "Helpful guides" above "You may also like".
15. **FAQ:** **Expected:** the intro links to the hair guides.

## E. For Google (once the site is live)

16. **[Rich Results Test](https://search.google.com/test/rich-results)** on a guide. **Expected:** "Article" and "Breadcrumbs" valid.
17. **Search Console:** submit `https://haircraft.in/sitemap.xml`. **Expected:** the guides are listed among the discovered pages.
18. **Bing Webmaster Tools** (optional):
    - add the site, choose "HTML Meta Tag", and paste the code into `BING_SITE_VERIFICATION`
    - restart, then verify

## F. Automated checks

19. `npm run check` and `npm run test:e2e` in `nextjs-haircraft`. **Expected:** 207 and 211 pass.

## Results

| #     | Check                  | Expected                                             | Result (Pass/Fail) | Notes |
| ----- | ---------------------- | ---------------------------------------------------- | ------------------ | ----- |
| 1–3   | Titles, descriptions   | keyword-led; within limits; page numbers             |                    |       |
| 4–7   | Buying guides          | on first pages; sub-category uses parent's; accurate |                    |       |
| 8–12  | Hair guides            | five; contents; shop links; phone; not found         |                    |       |
| 13–15 | Links                  | footer, product, FAQ                                 |                    |       |
| 16–18 | Google and Bing (live) | Article valid; sitemap; Bing verified                |                    |       |
| 19    | Automated checks       | 207 + 211                                            |                    |       |

**Text corrections** (guide, section, what to change):

QC sign-off: ____________________, ____ / ____ / ______
