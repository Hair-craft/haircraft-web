# Testing: storefront redesign (emerald and gold)

Pairs with [`plan`](../plan/2026-10-31-redesign-emerald.md) and [`status`](../status/2026-10-31-redesign-emerald.md).

Storefront on `dev-esha` (`npm run dev`, :3001) with the API running.

## Steps

### Every page

1. **Any page:**
   - **Expected:** a dark green strip on top with gold ✦ points ("Free shipping above ₹599"…).
   - **Expected:** a white header with the logo and "HairCraft"; the category you are in is underlined.
2. **Desktop:** a green **Consultation** pill opens WhatsApp in a new tab.
3. **Footer:**
   - **Expected:** cream, with four columns: HairCraft, Quick shop, Customer care, HairCraft (with the payment chips).
   - **Expected:** every link works.

### Home page

4. **Hero:**
   - The heading ends with gold *confidence.*; there are three small badges ("On orders ₹599+").
   - **Expected:** on the photo, a card shows a real product. **Quick view** opens it.
5. **Find my match:** jumps to the matcher.
   1. Choose a goal, a texture and a shade.
      - **Expected:** the panel shows a real matching product, and **See all N matches** opens the shop with those filters.
   2. Choose a mix that doesn't exist.
      - **Expected:** "Your closest match", with a note.
6. **Categories:** six per row, each with a photo and an item count.
7. **Bestsellers:**
   - **Expected:** **Best rated** and **New arrivals** pills switch the four-column grid.
   - **Phone:** the row scrolls sideways.
8. **Review:**
   - **Expected:** one real 5-star review with **Shop this look**.
   - It is hidden when the shop has no reviews.
9. **Further down:**
   - **Why HairCraft:** four white cards with icons.
   - **WhatsApp banner:** its button opens WhatsApp.
   - **Our story** beside the FAQ: the exchange card opens the Exchange policy, and FAQ answers open one at a time.

### Shop pages

10. **/shop:**
    - **Expected:** a white card with "Shop all" and category pills with counts, e.g. "Toppers (10)".
11. **Desktop toolbar:**
    1. Click **Colour**.
       - **Expected:** a small panel of tick boxes. Ticking one filters at once and the button says "1 chosen"; a chip appears below.
    2. Click **Texture**. **Expected:** Colour closes.
    3. Press **Escape**, or click elsewhere. **Expected:** it closes.
12. **Price:** the bands, and the From/To boxes with Apply, work as before.
13. **Many products** (more than one page):
    - **Expected:** "Showing 1–24 of N" beside the page numbers.
    - **Expected:** the WhatsApp banner below the grid lists the exchange (4 days), payments and dispatch (1–2 days).
14. **Phone:** the **Filters** button opens the panel, as before.

## Automated tests

- `npm test`: new `tests/unit/match.test.ts`.
- `npm run test:e2e`:
  - `home.spec.ts` was rewritten for the new sections.
  - `listing.spec.ts` opens the drop-downs.
  - `mobile-home.mobile.spec.ts` covers the matcher on a phone.

## Product page (added later the same day)

15. **Any product:**
    - **Expected:** the photos in a white card on the left, with three promises under them.
    - **Expected:** on the right, a white card with the category, an **In stock** pill, the name, the price in a cream box, and the options as pills (colours with a dot).
16. **Choose another option.** **Expected:** the price, stock, photos and SKU follow, as before.
17. **"Unsure of your shade?"** **Expected:** it opens WhatsApp.
18. **Under Add to bag:**
    - **Expected:** "Free delivery on orders above ₹599", "Packed and sent in 1–2 working days", and the exchange line.
19. **Below:**
    - **Expected:** Description is open; **Details** and **Delivery & exchange** open on click.
    - **Expected:** then reviews in a white card, guides, and "You may also like".
