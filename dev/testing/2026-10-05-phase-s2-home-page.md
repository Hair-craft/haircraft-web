# Testing: Phase S2, home page

Pairs with [`plan`](../plan/2026-10-05-phase-s2-home-page.md) and [`status`](../status/2026-10-05-phase-s2-home-page.md).

**What this phase delivers:** the real home page:

- a hero with a featured photo
- the brand promises
- shop by category (with photos)
- new arrivals
- best rated

It also delivers the product card that later pages reuse. Product pages and the full shop list come in later phases, so their links show the 404 page for now.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar, e.g. iPhone 12/13).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`) with the sample catalogue (`npm run seed:catalog`).
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true` and `FREE_SHIPPING_THRESHOLD=1999` (copy the new line from `.env.example` if missing). Then:
   ```powershell
   npm install
   npm run dev
   ```
3. **Open <http://localhost:3001>.**

## A. Hero and promises

1. **First screen.**
   - **Expected:** "Hair extensions, crafted for _confidence_" (_confidence_ in gold), a short line about clip-ins, tape-ins, wigs and ponytails, and **Shop all** and **Shop wigs** buttons.
   - **Expected:** on the right (below on phones), a product photo in a round white frame with a thin gold ring.
   - **Expected:** browser tab "HairCraft — Premium Hair Extensions, Wigs & Ponytails".
2. **Reload and watch the text.**
   - **Expected:** it rises in gently once.
   - With "reduce motion" switched on in Windows (Settings → Accessibility → Visual effects → Animation effects off), it appears without moving.
3. **Hover the buttons.**
   - **Expected:** **Shop all** goes to `/shop` and **Shop wigs** to `/shop/wigs` (both 404 until S3).
4. **Promise strip under the hero.**
   - **Expected:** 100% human hair · Free shipping "On orders above ₹1,999, anywhere in India" · Secure payments · Here to help, each with a round icon.
5. **Set `FREE_SHIPPING_THRESHOLD=` (empty) in `.env.local` and restart.**
   - **Expected:** the second promise reads "Tracked delivery – Fast, tracked delivery across India" (no amount).
   - **Then:** put `1999` back and restart.

## B. Shop by category

6. **"Shop by category".**
   - **Expected:** 4 photo cards: Clip-in Extensions (2 products), Tape-in Extensions (2), Wigs (1), Ponytails (1). Each has a photo under a dark-green fade, the name, a short description and the count in gold.
7. **Hover a card.**
   - **Expected:** the photo zooms slightly, and the card links to `/shop/<category>`.

## C. New arrivals and Best rated

8. **"New arrivals".**
   - **Expected:** product cards with photo, name, price range (e.g. "₹3,999 – ₹4,999"), newest first, and **View all** on the right.
   - **Compare** with Admin → Products sorted by newest: same order.
9. **Labels on the cards.**
   - **Expected:** **Sale** (gold) on products with a sale price; stars with a number in brackets only on products that have approved reviews.
   - **Expected:** a product with no reviews shows no stars.
10. **Sold out:** in the admin panel, set every variant of one product to 0 in stock (or use a product that is out of stock), then wait 2 minutes and reload.
    - **Expected:** that card shows **Sold out** (dark), its photo is paler, and Sale is not shown on it.
    - Put the stock back afterwards.
11. **"Best rated".**
    - **Expected:** only products with reviews, highest rating first, with stars and counts.
    - With a screen reader (e.g. Narrator, Win+Ctrl+Enter), the stars are read as e.g. "Rated 5 out of 5, 5 reviews".
12. **A new review:** approve a review in the admin panel for a product not yet in Best rated, wait 2 minutes and reload.
    - **Expected:** it appears in Best rated.
13. **Cards are links.** Click a card.
    - **Expected:** the address is `/product/<name>` (the product page is S5; for now, 404).
    - **Keyboard:** Tab through the cards; each card is one focus stop with a visible outline.

## D. Phone

14. **Open the page on a phone** (or the device toolbar at iPhone size).
    - **Expected:** hero text, then the photo, then the promises one under another.
    - **Expected:** category cards two per row.
15. **New arrivals and Best rated.**
    - **Expected:** swipe sideways; cards snap one by one and the next card peeks in at the edge.
    - **Expected:** the page itself never moves sideways and is not zoomed out (text is a normal reading size).

## E. When the API is unreachable

16. **Stop the dev server**, set `API_BASE_URL=http://localhost:3999/api/v1` in `.env.local` and start it again.
    - **Expected:** the hero text and promises still show (no hero photo), and **"We'll be right back"** appears where the categories and new arrivals would be.
    - **Expected:** no Best rated section and no error page.
    - **Then:** set `API_BASE_URL=http://localhost:3000/api/v1` back and restart.

## F. Automated checks

17. **With the API running, in `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 23 unit tests and 20 end-to-end tests pass.

## Results

| #   | Check            | Expected                                     | Result (Pass/Fail) | Notes |
| --- | ---------------- | -------------------------------------------- | ------------------ | ----- |
| 1   | Hero             | headline, buttons, framed photo, title       |                    |       |
| 2   | Animation        | gentle once; none with reduced motion        |                    |       |
| 3   | Hero links       | /shop and /shop/wigs                         |                    |       |
| 4   | Promises         | four, with ₹1,999                            |                    |       |
| 5   | No amount set    | "Tracked delivery" wording                   |                    |       |
| 6–7 | Categories       | 4 photo cards, counts, links                 |                    |       |
| 8   | New arrivals     | newest first, matches admin                  |                    |       |
| 9   | Labels           | Sale and stars only where due                |                    |       |
| 10  | Sold out         | label, pale photo, no Sale                   |                    |       |
| 11  | Best rated       | reviewed only, highest first                 |                    |       |
| 12  | New review       | appears within ~2 minutes                    |                    |       |
| 13  | Card links       | /product/…; one focus stop each              |                    |       |
| 14  | Phone layout     | stacked hero, 2-column categories            |                    |       |
| 15  | Phone rows       | swipe sideways; page never wider than screen |                    |       |
| 16  | API down         | hero and promises, calm messages, no crash   |                    |       |
| 17  | Automated checks | 23 unit + 20 e2e pass                        |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
