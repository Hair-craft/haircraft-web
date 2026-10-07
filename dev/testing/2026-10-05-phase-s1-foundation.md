# Testing: Phase S1, storefront foundation

Pairs with [`plan`](../plan/2026-10-05-phase-s1-foundation.md) and [`status`](../status/2026-10-05-phase-s1-foundation.md).

**What this phase delivers:**

- The base of the new shop: header with categories, phone menu, footer, a temporary home page, and friendly error, 404 and "shop unreachable" pages.
- The **coming-soon switch:** haircraft.in keeps showing Coming soon until launch.
- There are no real shop pages yet; links to them show the 404 page for now.

Everything is tested in a normal browser (Chrome or Edge) on a computer, plus a phone or the browser's phone view (F12 → device toolbar).

## 0. Setup

1. **The API must be running** (backend folder `nestjs-haircraft`: `npm run start:dev`). Check that <http://localhost:3000/api/v1/categories> shows the categories.
2. **In the `nextjs-haircraft` folder:**
   ```powershell
   npm install
   copy .env.example .env.local   # if .env.local doesn't exist yet
   npm run dev
   ```
   - **Expected:** "Ready" and `http://localhost:3001`.
3. **`.env.local`** should contain `STORE_OPEN=true` (the shop is visible).

## A. The shop layout (desktop)

1. **Open <http://localhost:3001>.**
   - **Header:** HairCraft logo, the categories **Clip-in Extensions, Tape-in Extensions, Wigs, Ponytails**, and four icons on the right (search, heart, person, bag).
   - **Page:** "Hair extensions, crafted for _confidence_", a **Shop all** button, and **Shop by category** with 4 cards showing product counts.
   - **Footer:** dark green, with Shop, Help and HairCraft links and "GST included".
   - **Browser tab:** "HairCraft — Premium Hair Extensions".
2. **Hover over "Clip-in Extensions"**, then click it.
   - **Expected:** a panel with **All Clip-in Extensions, Seamless Clip-ins, Classic Clip-ins**. Clicking does not close it.
   - Moving the mouse away closes it.
3. **The same with "Wigs".**
   - **Expected:** All Wigs, Lace Front Wigs.
   - "Tape-in Extensions" and "Ponytails" have no arrow (no sub-categories).
4. **Keyboard only:**
   - Reload, then press **Tab** once. **Expected:** a dark "Skip to content" button at the top left; Enter jumps to the page content.
   - Tab to "Clip-in Extensions" and press **Enter**. **Expected:** the panel opens.
   - Press **Escape**. **Expected:** it closes and the focus ring stays on "Clip-in Extensions".
5. **Hover the icons.** Each has a visible hover state.
   - Clicking them shows the **404 page** for now (search S4, wishlist S8, account S6, cart S7).

## B. Phone layout

6. **Open the site on a phone** (or the device toolbar, e.g. iPhone).
   - **Expected:** a menu button (☰) on the left, the logo, and the search, person and bag icons.
   - **Expected:** no category bar, and nothing scrolls sideways.
7. **Tap ☰.**
   - **Expected:** a "Menu" drawer from the left with **Shop all**, the categories and their sub-categories (indented). The page behind is dimmed and doesn't scroll.
8. **Close it** with ✕, by tapping the dimmed area, and (on a computer) with Escape: all three work.
9. **Open it again and tap "Wigs".**
   - **Expected:** the drawer closes and the address becomes `/shop/wigs`, which shows the 404 page until S3.

## C. Pages that don't exist

10. **Open <http://localhost:3001/no-such-page>.**
    - **Expected:** "We couldn't find that page" with **Go to the home page** and **Browse the shop**, inside the normal header and footer.
    - **Expected:** **Go to the home page** works.

## D. The coming-soon switch

11. **Stop the dev server** (Ctrl+C). In `.env.local` set `STORE_OPEN=false` and run `npm run dev` again.
12. **Open <http://localhost:3001>, then `/shop`, `/shop/wigs` and `/account`.**
    - **Expected:** every address shows the original **Coming soon** page (logo in a circle, "HairCraft · Launching soon"), and the address bar keeps the address you typed.
    - **Expected:** tab title "HairCraft — Premium Hair Extensions | Coming Soon".
13. **Open <http://localhost:3001/robots.txt> and <http://localhost:3001/sitemap.xml>.**
    - **Expected:** both still load (text and XML).
14. **Set `STORE_OPEN=true` again and restart.**
    - **Expected:** <http://localhost:3001/coming-soon> now goes straight to the home page.

## E. When the API is unreachable

15. **Make the API unreachable:** stop the dev server, set `API_BASE_URL=http://localhost:3999/api/v1` (a port where nothing runs) in `.env.local`, start it again and open <http://localhost:3001>.
    - Changing the address is more reliable than stopping the API: categories are cached for 5 minutes, so with the API stopped they could still show.
    - **Expected:** no crash. A yellow notice under the top edge ("We can't reach the shop right now…"), the header **without** categories, and a **"We'll be right back"** panel with **Try again** where the categories were.
16. **Open <http://localhost:3001/bff/health>.**
    - **Expected:** a short message with `API_UNREACHABLE` and "We can't reach the shop right now…".
17. **Put `API_BASE_URL=http://localhost:3000/api/v1` back**, restart, and click **Try again**.
    - **Expected:** the categories are back.
    - **Expected:** `/bff/health` shows `"api":"ok"`.

## F. Automated checks

18. **In `nextjs-haircraft` (with the API running):**
    ```powershell
    npm run check
    npm run test:e2e
    ```
    - **Expected:** typecheck, lint and format pass; **16** unit tests pass; **12** end-to-end tests pass.

## Results

| #     | Check                | Expected                                              | Result (Pass/Fail) | Notes |
| ----- | -------------------- | ----------------------------------------------------- | ------------------ | ----- |
| 1     | Home page and layout | header, categories, cards, footer, title              |                    |       |
| 2–3   | Category dropdowns   | sub-categories; click keeps it open                   |                    |       |
| 4     | Keyboard             | skip link; Enter opens; Escape closes and keeps focus |                    |       |
| 5     | Icons                | hover state; 404 for now                              |                    |       |
| 6     | Phone header         | menu button, icons, no sideways scroll                |                    |       |
| 7–8   | Phone menu           | drawer with categories; three ways to close           |                    |       |
| 9     | Menu navigation      | drawer closes, address changes                        |                    |       |
| 10    | 404 page             | inside the layout; home link works                    |                    |       |
| 11–13 | Shop closed          | Coming soon everywhere; robots and sitemap OK         |                    |       |
| 14    | Shop open            | /coming-soon → home                                   |                    |       |
| 15–17 | API down and back    | calm notice and panel; health 503 → ok                |                    |       |
| 18    | Automated checks     | 16 unit + 12 e2e pass                                 |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
