# Plan: Phase S14, information pages (with backend B15)

**Status: Approved (2026-10-07)** with the recommended options: build now with marked drafts; a public API call (B15) for the numbers; the draft returns rules; contact details only (no form); full privacy and terms drafts for a qualified review; the home wording in this phase. The owner's text is listed under "What I need from you".

Part of the [storefront roadmap](2026-10-05-storefront-roadmap.md). Builds on S1 (the footer already links to these pages) and S2b (the home page's FAQ, "Why HairCraft" cards and story).

## Context

**The footer has seven links that go nowhere yet:** Shipping, Returns, FAQ, Contact us, About HairCraft, Privacy policy and Terms of use. They show "page not found". S14 builds those pages.

**Some of the shop's words are still stand-ins,** written in S2 and S5 so they promise nothing the owner hasn't confirmed:

- the home page's FAQ answers, the four "Why HairCraft" cards and Our story
- the "Delivery & returns" note on every product page ("Our returns and exchange policy will be published here before launch")

**The shop's real rules live in the API's settings** and must match what the pages say:

| Rule                       | Setting now (development)                            | Where it is set                            |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Delivery charge            | ₹99                                                  | `SHIPPING_FEE`                             |
| Free delivery from         | ₹1,999                                               | `FREE_SHIPPING_THRESHOLD`                  |
| Cash on delivery           | off; up to ₹10,000 when on                           | `COD_ENABLED`, `COD_MAX_ORDER_AMOUNT`      |
| Time to pay online         | 30 minutes                                           | `ORDER_PAYMENT_TIMEOUT_MINUTES`            |
| Cancelling                 | by the customer until it ships                       | the order rules (built in backend phase 7) |
| Refunds of online payments | back to the original payment method through Razorpay | the order rules (B7, B8)                   |

**What doesn't exist:** a returns flow in the API (customers can cancel before shipping, but not ask to return after delivery), and a way to send a message to the shop.

**The law in India asks online shops** (Consumer Protection (E-Commerce) Rules 2020, and the Digital Personal Data Protection Act 2023) to show:

- the seller's legal name, address and contact details
- a grievance officer with a name and contact details
- the return, refund, exchange and cancellation policy
- how personal data is used

I'll build the pages so these have a clear place. **I'm not a lawyer:** the privacy policy and terms I draft must be checked by someone qualified before launch.

## Scope

**In scope**, as small steps (checkboxes in `PROGRESS.md`):

1. **B15 (backend) The shop's rules, public:** `GET /api/v1/shop/policies` returns the delivery charge, the free-delivery minimum, cash on delivery (on or off, and its limit) and the time to pay, straight from the API's settings. The pages read the numbers from here, so they can never disagree with checkout (open question 2).
2. **S14.1 The page frame:**
   - one calm reading layout for all seven pages: a title, "Last updated" date, the text, and a side list of the other help pages (a row of links on phones)
   - the text kept in one content folder (`src/content/`), plain and easy to replace
   - headings people can link to (for example `/returns#damaged`)
   - readable when printed
3. **S14.2 Shipping** `/shipping`: where we deliver, the delivery charge and free-delivery minimum (from B15), when orders are packed and shipped, tracking from My orders, cash on delivery when it's on.
4. **S14.3 Returns, refunds and cancellations** `/returns`: cancelling before shipping (as the shop already allows), the return and exchange policy (open question 3), damaged or wrong items, how refunds are paid and how long they take.
5. **S14.4 FAQ** `/faq`: all the questions, grouped (Ordering and payment, Delivery, Returns, Choosing and caring for your hair), each answer opening in place, with search engines' FAQ data. The home page keeps its short FAQ and adds "See all questions".
6. **S14.5 Contact** `/contact`: email, phone or WhatsApp, hours, the business address, and the grievance officer (open question 4). Links that open the mail app, the phone dialler or WhatsApp.
7. **S14.6 About** `/about`: HairCraft's story, from the owner's text. The home page's Our story links to it.
8. **S14.7 Privacy policy and Terms of use** `/privacy`, `/terms`: drafts based on what the shop really does (open question 5):
   - **Privacy:** what we collect (name, email, phone, addresses, orders, reviews and their photos); why; who else sees it (Razorpay for payments, Cloudinary for photos, the delivery partner); the cookies we use and why; how long we keep it; how to see, correct or delete your data; the grievance officer
   - **Terms:** the seller, prices in rupees with GST, orders and payment, cancelling, returns (linking to the policy), reviews and photos customers post, accounts, and which law applies
9. **S14.8 The shop's words:**
   - the home page's FAQ, "Why HairCraft" cards and Our story replaced with the owner's text
   - the product page's "Delivery & returns" note made short and true, with links to Shipping and Returns
   - "Shipping", "Returns" and "Contact us" links where shoppers need them: the bag, checkout and the order page
   - the new pages added to the sitemap
10. **S14.9 Tests, click-through, docs:** unit tests, Playwright, screenshots, status, QC guide, PROGRESS, project doc.

**Out of scope:**

- a contact form that sends messages (open question 4)
- asking for a return from My orders (needs a returns flow in the API; a later phase if wanted)
- a content system for editing pages without a developer
- other languages

## What I need from you

The pages can be built and tested with my drafts, clearly marked as drafts. **Before the shop opens** (S16), please send or confirm:

1. **The business:** legal name, registered address, GSTIN (if it should appear), email, and phone or WhatsApp number, and the hours you answer.
2. **The grievance officer:** a name (it can be you), email and phone.
3. **Delivery:** which partner(s) you use, how soon orders are packed (for example within 1–2 working days), usual delivery times, and anywhere you don't deliver.
4. **Returns:** your rules (open question 3).
5. **Your story** for About and the home page: a few paragraphs, and photos if you have them.
6. **The FAQ answers and "Why HairCraft" cards:** confirm my drafts or send your own words.
7. **Privacy and terms:** who will review them (a lawyer or a compliance service).

You can send these as a message, a document, or notes; I'll put them in.

## Design

- **The reading layout:** a narrow column (about 65 characters a line) in the shop's fonts and colours, the title in the display font, then "Last updated 7 October 2026". On computers a side list links the seven pages; on phones a row of links sits above the title.
- **Shipping and Returns** start with a short summary box ("Free delivery on orders over ₹1,999 · Cancel any time before it ships"), then the detail.
- **FAQ:** the same accordion as the home page, with group headings, so everything opens with the keyboard and works without JavaScript (`<details>`).
- **Contact:** cards for Email, Phone/WhatsApp and Address, each one tap to use; the grievance officer below.
- **How it works:**
  - the pages are built ahead of time and refreshed every 10 minutes (the numbers come from B15)
  - if the API can't be reached, the pages still show, with the numbers left out ("the delivery charge is shown at checkout") rather than wrong ones
- **Drafts are marked in the code** (`DRAFT — OWNER TO CONFIRM`), not on the page, and the launch checklist (S16) lists each one.

## Files

```
nestjs-haircraft/src/modules/shop/…            B15: GET /shop/policies (controller, service, DTO, tests)
src/content/pages/…                            the text of each page (about, shipping, returns, faq, contact, privacy, terms)
src/content/business.ts                        the business and grievance officer details, in one place
src/components/info/…                          the reading layout, side list, summary box, contact cards
src/app/(shop)/{about,contact,shipping,returns,faq,privacy,terms}/page.tsx
src/lib/api/shop.ts                            reading B15
src/components/home/content.ts, sections.tsx   the owner's wording; "See all questions"; Our story → About
src/components/product-page/content.ts         Delivery & returns
src/app/sitemap.ts                             the new pages
tests/unit/info-pages.test.ts, tests/e2e/info-pages.spec.ts, tests/e2e/info-pages.mobile.spec.ts
dev/status/…-phase-s14-…, dev/testing/…-phase-s14-…, dev/PROGRESS.md
```

## Testing

1. **Backend:** unit and e2e tests for `GET /shop/policies` (the numbers follow the settings; cash on delivery off hides its limit; no sign-in needed).
2. **Unit (storefront):** money and wording from the policies ("Free delivery on orders over ₹1,999"; a charge of 0 reads "Free delivery on every order"; cash on delivery shown only when on); the FAQ data for search engines.
3. **Playwright (test API):**
   - every footer link opens its page, with one main heading and the side list
   - Shipping shows the test API's numbers; Returns links from the bag and the order page
   - FAQ answers open with a mouse, the keyboard, and without JavaScript
   - Contact links are `mailto:`, `tel:` and WhatsApp
   - with the API down, Shipping still shows, without numbers
   - phones: no sideways scrolling; the page links fit
4. **By eye:** each page on a computer and a phone, and printed (print preview).

## Risks

- **Policies that don't match the shop:** the numbers come from the API, and everything else is listed for the owner to confirm before launch.
- **Legal wording:** my drafts follow the rules above but aren't legal advice; launch should wait for a qualified review (added to the S16 checklist).
- **Text that never arrives:** the shop can't open with drafts. The S16 checklist blocks launch until each page is confirmed.

## Open questions

1. **Build now with drafts, or wait for your text.** Recommended: **build now with clear drafts** based on how the shop really works, and swap in your words when you send them (each swap is a small change). The alternative is to pause S14 until all the text is ready.
2. **The delivery and payment numbers.** Recommended: **a small public API call (B15)** so the pages always show the same numbers as checkout, even after you change a setting. The alternative is writing the numbers into the pages, which must then be updated by hand whenever the settings change.
3. **Returns and exchanges.** Hair is a personal-care product, so many shops limit returns. Recommended draft (please change it to your rules):
   - **cancel any time before it ships** (as the shop already allows), with a full refund
   - **damaged, faulty or wrong items:** tell us within 48 hours of delivery, with photos or an unboxing video, for a replacement or full refund
   - **change of mind:** an exchange or return within 7 days of delivery only if the hair is unused, in its original packaging with the seal intact; the customer pays the return delivery
   - **wigs and hair that has been worn, washed, cut, coloured or styled can't be returned**
   - **refunds** go back to the original payment method within 5–7 working days of approval

   The alternative is a stricter rule (no change-of-mind returns at all), or a more generous one.

4. **How customers reach you.** Recommended: **contact details only** (email, phone/WhatsApp, hours), which needs no new system and is what most small shops start with. The alternative is a contact form, which needs a backend phase to store messages, show them in the admin panel and email you (about a phase of work).
5. **Privacy policy and terms.** Recommended: **I write full drafts based on how the shop really works, for a lawyer or compliance service to check** before launch. The alternative is to use text you already have, or one from a policy service.
6. **The home page's FAQ, cards and story.** Recommended: **in this phase**, as decided in S13, using your text or my drafts until it arrives.
