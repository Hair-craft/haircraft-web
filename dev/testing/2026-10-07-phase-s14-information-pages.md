# Testing: Phase S14, information pages

Pairs with [`plan`](../plan/2026-10-07-phase-s14-information-pages.md) and [`status`](../status/2026-10-07-phase-s14-information-pages.md).

**What this phase delivers:**

- Shipping, Returns & refunds, FAQ, Contact us, About, Privacy policy and Terms of use
- links to them from the bag, checkout, order pages and product pages
- the home page's FAQ and story linked to the full pages

**This QC run checks that everything works.** The wording is the owner's to confirm separately: while reading, note anything that should change.

Test in Chrome or Edge on a computer, and on a phone (or F12 → device toolbar).

## 0. Setup

1. **Start the services:**
   - restart the API so it has the new call: `npm run start:dev` in `nestjs-haircraft`
   - start the shop: `npm run dev` in `nextjs-haircraft`, with `STORE_OPEN=true`
2. **Check the new call:** open `http://localhost:3000/api/v1/shop/policies`. **Expected:** the delivery charge (99.00), the free-delivery minimum (1999.00), and cash on delivery.

## A. The pages

1. **Each footer link:** in the footer, open each of Shipping, Returns & refunds, FAQ, Contact us, About HairCraft, Privacy policy and Terms of use.
   - **Expected:** each opens its page with a title, "Last updated", and the side list with the current page highlighted.
2. **Shipping:**
   - **Expected:** "Delivery is free on orders of ₹1,999 or more; below that it costs ₹99" (or your settings), and the "In short" box.
   - **Press "Tracking your order"** under "On this page". **Expected:** it jumps to that section.
3. **Change a setting:** set `FREE_SHIPPING_THRESHOLD=2499` in the API's `.env` and restart the API.
   - **Expected:** within 10 minutes Shipping says ₹2,499. Restarting the shop shows it at once.
   - Put the setting back afterwards.
4. **Returns:**
   - **Expected:** cancel before shipping; damaged or wrong items within 48 hours; unused hair within 7 days; what can't be returned; refunds.
   - **Expected:** links to My orders and Contact work.
5. **FAQ:**
   - **Expected:** 4 groups. Pressing a question opens its answer; opening another in the same group closes the first.
   - **Tab to a question and press Enter.** **Expected:** it opens.
6. **Contact:**
   - **Press the email card.** **Expected:** your mail app opens.
   - **Expected:** the hours, the business, and the grievance officer.
7. **About, Privacy policy and Terms of use:**
   - **Expected:** About shows the story; Privacy lists the cookies by name; Terms links to Returns & refunds.
8. **Printing:** Ctrl+P on Returns. **Expected:** the text prints without the side list.

## B. Links from the shop

9. **Home page:**
   - **Expected:** the FAQ ends with "See all questions" (it opens `/faq`).
   - **Expected:** Our story has "Read our story" (it opens About).
10. **A product page:** open **Delivery & returns**. **Expected:** short text with links to Shipping and Returns & refunds.
11. **The bag:** **Expected:** "Delivery · Returns & refunds" under Checkout.
12. **Checkout:**
    - **Expected:** "By placing your order you agree to our Terms of use and Returns & refunds policy".
    - **Press either link.** **Expected:** it opens in a new tab, and checkout stays as it was.
13. **An order** (My orders → an order): **Expected:** "Contact us or read Returns & refunds" under Payment.

## C. Special cases

14. **Phone:**
    - **Expected:** the page links wrap above the title, nothing scrolls sideways, and FAQ answers open with a tap.
15. **Without JavaScript** (F12 → Ctrl+Shift+P → "Disable JavaScript"):
    - **Expected:** FAQ answers still open.
    - Re-enable JavaScript afterwards.
16. **API stopped:**
    - **Expected:** Shipping still shows, saying the charge is shown in your bag and at checkout (no ₹ numbers).
    - Start the API again.

## D. Automated checks

17. **Backend:** `npm test` and `npm run test:e2e` in `nestjs-haircraft`. **Expected:** 320 and 294 pass.
18. **Storefront:** `npm run check` and `npm run test:e2e` in `nextjs-haircraft`. **Expected:** 176 and 189 pass.

## Results

| #     | Check                         | Expected                                          | Result (Pass/Fail) | Notes |
| ----- | ----------------------------- | ------------------------------------------------- | ------------------ | ----- |
| 0     | Policies call                 | delivery, minimum, cash on delivery               |                    |       |
| 1     | Footer links                  | 7 pages, title, Last updated, side list           |                    |       |
| 2–3   | Shipping                      | settings' numbers; section links; follows changes |                    |       |
| 4     | Returns                       | the draft rules; links work                       |                    |       |
| 5     | FAQ                           | groups; one open per group; keyboard              |                    |       |
| 6     | Contact                       | email opens mail; grievance officer               |                    |       |
| 7     | About, Privacy, Terms         | story; cookies listed; links                      |                    |       |
| 8     | Print                         | text only                                         |                    |       |
| 9     | Home links                    | See all questions; Read our story                 |                    |       |
| 10–13 | Product, bag, checkout, order | policy links; checkout's open in a new tab        |                    |       |
| 14    | Phone                         | fits; taps                                        |                    |       |
| 15    | No JavaScript                 | FAQ opens                                         |                    |       |
| 16    | API stopped                   | Shipping without numbers                          |                    |       |
| 17–18 | Automated checks              | 320+294, 176+189                                  |                    |       |

QC sign-off: ____________________, ____ / ____ / ______
