# Testing: Phase S2b, home page redesign

Pairs with [`plan`](../plan/2026-10-05-phase-s2b-home-redesign.md) and [`status`](../status/2026-10-05-phase-s2b-home-redesign.md).

**What this phase delivers:** the home page redesigned after two reference sites, [gemeriahair.in](https://gemeriahair.in/) and [1hairstop.in](https://1hairstop.in/), in HairCraft's own colours, with small, calm animations:

- an announcement bar and a trust strip that scroll slowly
- a split hero with thin gold 3D strands (desktop only)
- category tiles, "Most loved" tabs, stacking "why" cards, a range explorer
- our promises, our story, real customer reviews and an FAQ

Texts marked as placeholders (FAQ answers, "why" cards, our story) are for the owner to replace; check that they show, not what they say.

Test in Chrome or Edge on a computer (a screen at least 1024 px wide), and on a phone (or F12 → device toolbar, e.g. iPhone 12/13).

## 0. Setup

1. **The API is running** (`nestjs-haircraft`: `npm run start:dev`) with the sample catalogue (`npm run seed:catalog`) and at least one approved review.
2. **In `nextjs-haircraft`:** `.env.local` contains `STORE_OPEN=true` and `FREE_SHIPPING_THRESHOLD=1999`. Then:
   ```powershell
   npm install
   npm run dev
   ```
3. **Open <http://localhost:3001>.**

## A. Top of the page

1. **Announcement bar** (dark green, above the logo).
   - **Expected:** "Free shipping above ₹1,999 ✦ 100% human hair ✦ Secure UPI, card & net banking payments" moving slowly to the left, without a jump when it loops.
   - **Hover it.** **Expected:** it stops; moving the mouse away starts it again.
2. **Hero.**
   - **Expected:** "Premium human hair extensions" in small spaced capitals, then "Hair extensions, / crafted for _confidence_" on two lines (_confidence_ in gold), a short line, **Shop all** and **Shop wigs**.
   - **Expected:** on the right, a tall rounded product photo that settles gently from a slight zoom.
   - **Expected (computer):** a second or two after the page loads, thin gold strands appear either side of the photo and drift very slowly. They fade out at the top and bottom, nothing is cut off, and they never cover the photo or the buttons.
3. **Hero on a phone.**
   - **Expected:** text centred, photo below the buttons, **no gold strands**.
4. **Trust strip** under the hero.
   - **Expected:** a sand-coloured strip of large italic phrases ("100% human hair ✦ Every length, colour and texture ✦ …") moving slowly; it stops on hover.

## B. Products

5. **"Shop by category"** (small heading "Find your perfect match").
   - **Expected:** 4 tall photo tiles: Clip-in Extensions (2 products), Tape-in Extensions (2), Wigs (1), Ponytails (1), name and count on the photo. Hover: the photo zooms slightly. Each links to `/shop/<category>`.
   - **Expected:** while scrolling down, the tiles fade up gently one after another.
6. **"Most loved hair extensions".**
   - **Expected:** two tabs, **Best rated** (selected, gold underline) and **New arrivals**. Best rated shows only reviewed products, highest rated first (today: 3 cards, centred).
   - **Click New arrivals.** **Expected:** the gold line slides across and the 8 newest products fade in, newest first (compare with Admin → Products, newest first).
   - **Keyboard:** press Tab until a tab is focused, then ← and →. **Expected:** the tabs switch.
   - **Expected:** **View all** under the cards goes to `/shop` (404 until S3).
7. **Phone:** the cards in Most loved scroll sideways with a finger, the next card peeking in; the first card does not touch the screen edge; the page itself never moves sideways.

## C. Story sections

8. **"Why women choose HairCraft"**: four large cards, photo on one side and text on the other.
   - **Expected (computer):** scroll slowly. Each card stops near the top, and the next slides up over it while the one underneath shrinks a little and fades.
   - **Expected (phone):** a plain list of cards, photo on top; nothing sticks.
9. **"Explore our range"**: the category names large on the left, a photo panel on the right (above on phones).
   - **Point at** (phone: tap) **Wigs.** **Expected:** "Wigs" turns dark, the others pale; the panel cross-fades to a wig photo, "1 product", its description and **Shop Wigs** (→ `/shop/wigs`).
   - **Keyboard:** Tab onto the names. **Expected:** the panel follows the focused name.
10. **"Our promises"**: four round icons: 100% human hair, Free shipping "On orders above ₹1,999 …", Secure payments, Here to help.
11. **"Our story"** on a sand background: a photo and "Crafted for the way _you_ wear your hair", two short paragraphs and **Discover the collection** (→ `/shop`).

## D. Reviews and questions

12. **"Loved by women like you"**: cards with stars, a quote, the name, "Verified purchase" where true, and the product name linking to it.
    - **Expected:** at most 6 cards, at most 2 per product, only 4–5 stars, **no card repeated**. (The development database has five identical "Gorgeous waves" reviews; only one shows.)
    - **Hide all reviews** in the admin panel, wait 2 minutes and reload. **Expected:** the whole section disappears (no empty box). Approve them again afterwards.
13. **"Frequently asked questions"**: six questions; the first is open.
    - **Click another question.** **Expected:** it opens smoothly, the first closes, and the + turns into ×. Clicking it again closes it.
14. **Search engines:** right-click → View page source and search for `FAQPage`. **Expected:** found, with all six questions and answers.

## E. Comfort and speed

15. **Reduce motion:** Windows Settings → Accessibility → Visual effects → Animation effects **off**; reload.
    - **Expected:** the announcement bar and trust strip stand still (centred, all messages visible), nothing fades in, "why" cards don't stick, and **no gold strands**. Tabs, explorer and FAQ still work, just without movement.
    - **Then:** switch Animation effects back on.
16. **Speed:** F12 → Network, tick "Disable cache", reload.
    - **Expected:** the hero text appears at once; the 3D files (a large `.js` file of a couple of hundred KB) load only after the page, and **not at all** in phone view.
17. **Phone width:** scroll from top to bottom on a phone.
    - **Expected:** the page never moves sideways and is never zoomed out.

## F. When the API is unreachable

18. **Stop the dev server**, set `API_BASE_URL=http://localhost:3999/api/v1` in `.env.local` and start it again.
    - **Expected:** the hero text, both marquees, the promises, the FAQ and the "why" cards still show; **"We'll be right back"** where categories and Most loved would be; no tabs, no range explorer, no reviews, no error page.
    - **Then:** set `API_BASE_URL=http://localhost:3000/api/v1` back and restart.

## G. Automated checks

19. **With the API running, in `nextjs-haircraft`:**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** 31 unit tests and 28 end-to-end tests pass.

## Results

| #   | Check            | Expected                                               | Result (Pass/Fail) | Notes |
| --- | ---------------- | ------------------------------------------------------ | ------------------ | ----- |
| 1   | Announcement bar | 3 messages, smooth loop, stops on hover                |                    |       |
| 2   | Hero (computer)  | two-line headline, photo, gold strands beside it       |                    |       |
| 3   | Hero (phone)     | centred, photo below, no strands                       |                    |       |
| 4   | Trust strip      | moving phrases, stops on hover                         |                    |       |
| 5   | Categories       | 4 tiles, counts, links, fade-up                        |                    |       |
| 6   | Most loved       | tabs by mouse and keyboard, right products, View all   |                    |       |
| 7   | Phone rows       | swipe sideways, margin kept, page never wider          |                    |       |
| 8   | Why cards        | stack on computer; plain list on phone                 |                    |       |
| 9   | Range explorer   | hover/tap/keyboard switch panel and link               |                    |       |
| 10  | Promises         | four icons, ₹1,999                                     |                    |       |
| 11  | Our story        | photo, heading, button                                 |                    |       |
| 12  | Reviews          | real, ≤6, ≤2 per product, no repeats; hidden when none |                    |       |
| 13  | FAQ              | one open at a time, smooth                             |                    |       |
| 14  | FAQ for search   | FAQPage in page source                                 |                    |       |
| 15  | Reduce motion    | nothing moves, no strands, everything still usable     |                    |       |
| 16  | Speed            | hero at once; 3D only later, never on phones           |                    |       |
| 17  | Phone width      | never sideways or zoomed out                           |                    |       |
| 18  | API down         | calm messages, no crash                                |                    |       |
| 19  | Automated checks | 31 unit + 28 e2e pass                                  |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
