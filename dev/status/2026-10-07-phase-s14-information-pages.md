# Status: Phase S14, information pages (with backend B15)

Tracks progress against [`plan/2026-10-07-phase-s14-information-pages.md`](../plan/2026-10-07-phase-s14-information-pages.md).

## 2026-10-07: implemented and verified, with drafts for the owner to confirm

**Result: built.** Every in-scope step is implemented (B15, S14.1–S14.9). **The owner's own text is still to come.** The pages use clear drafts based on how the shop really works; each is marked `DRAFT — OWNER TO CONFIRM` in the code. "Owner's final copy in" stays open in PROGRESS and blocks launch (S16).

**Verified by:**

- **Backend:** typecheck, ESLint, Prettier and the build clean. 320 unit tests (3 new) and 294 e2e tests (2 new, 1 updated), all passing.
- **Storefront:** typecheck, ESLint, Prettier and the build clean. 176 unit tests (17 new) and 189 Playwright tests (18 new), all passing.
- **Screenshots reviewed by eye:** Shipping, Returns, FAQ (an answer open), Contact and Privacy on a computer; Returns on a phone.

Approved with the recommended options:

- build now with marked drafts
- a public API call (B15) for the numbers
- the draft returns rules
- contact details only (no form)
- full privacy and terms drafts for a qualified review
- the home wording in this phase

---

## What was built

### B15 (backend) The shop's rules, public

- **`GET /api/v1/shop/policies`** (no sign-in) returns, straight from the settings checkout uses:
  - the delivery charge and free-delivery minimum
  - GST %
  - the time to pay online
  - cash on delivery (on or off, and its limit only when on)
- Cached by browsers for 5 minutes; a "Shop" section in the API docs.

### S14.1 The page frame

- **One reading layout for all seven pages:**
  - a side list of the pages (a wrapped row of small links on phones), with the current one marked
  - a small label, the title, and "Last updated 7 October 2026"
  - the intro, an "In short" box (Shipping, Returns), "On this page" links, and the sections
- **Section links:** every section has an address (`/returns#damaged`, `/contact#grievance`).
- **Printing:** the side list and page links are left out when printed.
- **The text lives in `src/content/`:**
  - one file per page, as plain sentences with `**bold**` and `[links](/path)`
  - the business details in `business.ts`
  - the returns numbers in `returns-rules.ts`, shared by Returns, the FAQ and product pages

### S14.2 Shipping `/shipping`

- **The numbers come from B15:** for example "Delivery is free on orders of ₹1,999 or more; below that it costs ₹99", plus cash on delivery when it's on.
- **Drafts:** packing (1–2 working days), delivery (3–7 working days), where we deliver, tracking in My orders, paying, and what to do if something goes wrong.
- **API down:** the page still shows, saying "the delivery charge … is shown in your bag and at checkout" instead of guessing.

### S14.3 Returns, refunds and cancellations `/returns`

The approved draft:

- cancel any time before it ships
- damaged, faulty or wrong items reported within 48 hours, with photos, for a replacement or full refund
- unused, sealed hair returned or exchanged within 7 days (the customer pays return delivery)
- worn or styled hair and tried-on wigs can't be returned
- refunds within 5–7 working days to the original payment method

### S14.4 FAQ `/faq`

- **16 questions in 4 groups:** Ordering and payment, Delivery, Returns and refunds, Choosing and caring for your hair.
- **Opening answers:** each opens in place (native `<details>`: mouse, keyboard, no JavaScript, and Ctrl+F finds closed answers). One answer is open at a time per group.
- **Live numbers:** the delivery and payment answers use B15's numbers.
- **Search engines:** the page includes FAQ data for search engines, without the link marks.
- **Home page:** the home FAQ keeps 6 questions (now with links) and adds **See all questions**.

### S14.5 Contact `/contact`

- **Contact cards:** a card for each way to reach us; only what's filled in shows. Today that's email (`care@haircraft.in`, a draft address for the owner to confirm). Phone and WhatsApp cards (`tel:` and `wa.me` links) appear when numbers are added.
- **The business:** the seller's name, plus the address and GSTIN once given.
- **Grievance officer** (`#grievance`): what they handle, 48-hour acknowledgement, one-month resolution, and their email (plus their name and phone once given).

### S14.6 About `/about`

- The story (the same text as the home page's Our story, now shared), what we promise, and an invitation to ask for help choosing.
- The home page's Our story gains **Read our story**.

### S14.7 Privacy policy and Terms of use

These are drafts written from what the shop really does, for a qualified review.

- **Privacy:**
  - what we collect: account, addresses, orders, payment references only, bag and wishlist, reviews and photos, security logs
  - why we use it, and who we share it with: Razorpay, couriers, Cloudinary, hosting
  - **every cookie the shop sets, by name**, and that there are no advertising or tracking cookies
  - how long we keep data, your rights (see, correct, delete, withdraw consent, nominate someone), security, the grievance officer and the Data Protection Board
- **Terms:**
  - the seller, your account (18+), products and prices (GST included)
  - orders and payment (stock reserved at the order number, the time to pay), delivery, cancelling and returns (linking the policy)
  - the rules for reviews and photos, using the site, liability, complaints (grievance officer) and Indian law

### S14.8 The shop's words and links

- **The product page's Delivery & returns** is now short and true, with links to Shipping and Returns.
- **Policy links where shoppers need them:**
  - **the bag:** "Delivery · Returns & refunds"
  - **checkout:** "By placing your order you agree to our Terms of use and Returns & refunds policy" (opens in a new tab, so the order in progress isn't lost)
  - **an order page:** "Contact us or read Returns & refunds"
- **Footer:** the footer links now come from the same page list.
- **Sitemap:** the seven pages are in it while the shop is open.

## Problems found and fixed

1. **The "In short" box and the FAQ topic buttons were invisible:** they used the page's own mint colour. They're now white cards.
2. **The page links on phones** took three rows, so they're now smaller and fit in two.
3. **An older test** (S5's phone photo swipe) looked for a list named "Photos" and also matched S13b's "Customer photos". It now asks for the exact name.
4. **The API docs test** lists every section, so "Shop" was added.

Test-only corrections:

- FAQ data is found by its type, not as the page's first block
- a link found twice (page and footer) is now looked for in the page only

## Known and accepted

- **Drafts until the owner's text arrives.** What's needed is listed in the plan under "What I need from you": business details, grievance officer, courier and times, returns rules, story, FAQ, and who reviews the legal pages.
  - **The contact email** `care@haircraft.in` is a draft: please confirm the mailbox exists.
  - **The courts' city:** the terms say "the courts of India" until you name one.
- **The free-delivery amount appears in four places:**
  - read from the API (B15): the information pages
  - read from the storefront's own setting (`FREE_SHIPPING_THRESHOLD`, set in S1): the offers strip at the top of every page, the home page's promise, and the bag's "Add ₹… for free shipping"
  - **Both settings must be the same.** Switching those three to B15 is a small follow-up (proposed for S16, with the launch settings check).
- **While the shop is closed,** these pages show Coming soon, like every page. Razorpay's live-account check and Google usually want the policy pages to be reachable; opening just these pages before launch is a one-line change once the text is final (S16).
- **I'm not a lawyer:** the privacy policy and terms need a qualified review before launch.

## Not done / follow-ups

- A contact form (needs a backend phase).
- Asking for a return from My orders (needs a returns flow in the API).
- Editing pages without a developer (a content system).
