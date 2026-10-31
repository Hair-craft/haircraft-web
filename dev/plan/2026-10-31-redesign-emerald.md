# Plan: storefront redesign ("emerald and gold" look)

The owner sent a full home page mock-up (HTML, 2026-10-31) and asked for the storefront to change to it.

## Look, on every page

- **Fonts:** Playfair Display (headings) and Plus Jakarta Sans (text), replacing Cormorant Garamond and Geist.
- **Colours:** deep emerald `#0B291A` (was `#16362a`), antique gold `#B58B42`, mint page `#EDF9E5` (unchanged), white cards, sage badges `#E3EFE0` / `#1E432B`, muted text `#6E685F`, warm borders `#EFE9DC`.
- **Announcement bar:** fixed points with gold ✦ (no scrolling marquee). Shows fewer points on small screens.
- **Header:** white with a soft shadow, logo with the "HairCraft" wordmark, category menu with an underline on the current page, a pill search box, a "Consultation" pill (WhatsApp), wishlist, account and bag.
- **Footer:** cream with four columns: brand, Quick shop (real categories), Customer care, and a payments list.
- **Product cards:** white rounded cards with padding, a sage sale badge and a "View" button. Used on every product list.

## Home page, top to bottom

1. **Hero:**
   - Sage badge, headline with italic gold "confidence.", Shop collection and Find my shade buttons.
   - Three small badges.
   - The fixed hero photo, with a "100% human hair" tag and a floating card for a real best-rated product.
2. **Find your match (new):**
   - Choose a goal (the real top-level categories), a texture and a shade (the real values from the shop's filters).
   - The panel shows the best-rated real product that matches, and links to all matches in the shop, already filtered.
   - When nothing matches exactly, it shows the closest match and says so.
   - Served by a new `/bff/match` route.
3. **Categories:** six-column grid of real categories with photos and product counts.
4. **Bestsellers and favourites:** Best rated and New arrivals as pill tabs over a four-column grid.
5. **Review spotlight:** one real 5-star review (with its photo, if any), a Verified buyer tag and Shop this look. Hidden when there are no reviews. The before/after photos are left out until the owner sends real ones.
6. **Why HairCraft:** four white cards with icons (replaces the stacking cards).
7. **WhatsApp banner:** emerald, with a "Chat on WhatsApp" button (the business's real chat link).
8. **Our story and FAQ:**
   - The story text (from /about) on the left, with an exchange note that matches the real policy.
   - The FAQ accordion on the right.

## Left out of the mock-up on purpose

Nothing that can't be backed up is shown:

- the 4.9/5 rating
- "12,000+ women", "8,500+ matches this month" and "99.4% match accuracy"
- the invented review
- reply-time promises
- "₹300 off" for subscribing (there is no newsletter)
- "7-day easy exchange: swap shade or texture" (the real policy is exchange for defective items only)
- the company name, Mumbai and "temple hair"

Any of these can be added once the owner confirms them.

## Removed

- `why-stack.tsx`, `range-explorer.tsx`, the trust marquee and the promise strip. Their content moves into the hero badges and the Why cards.
- The four `why-*.webp` photos stay in `public/` but are no longer used.

## Tests

- Unit tests: copy and match helpers.
- E2E: `home.spec.ts` and `mobile-home.mobile.spec.ts` updated for the new sections; a matcher test added.

## Shop pages (second mock-up, same day)

`/shop`, `/shop/<category>` and `/search`:

- **Breadcrumbs:** plain, above the header card.
- **Header card:**
  - A white card with a sage badge, the title and the words.
  - Category pills with product counts.
- **Toolbar card:**
  - The filters become drop-down buttons: Length, Colour, Texture, Size, Price and Availability.
  - Only one drop-down is open at a time; Escape or a click outside closes it.
  - Next to the filters: the product count, the sort, and the active-filter chips with Clear all.
  - Phones keep the Filters panel.
- **Grid:** full width, four columns of the new cards.
- **Below the grid:**
  - "Showing 1–24 of N" beside the page numbers.
  - The WhatsApp banner, with three real policies: defective-item exchange, secure payments, and the dispatch time.

Left out of that mock-up for the same reasons as above:

- review numbers, "temple hair" and "trichologist" claims
- reply-time promises, "7-day free shade swap" and "under 24 hours" dispatch
- the Density / Weight filter (no such data) and the grid/compact switch
- swatches and Add to Bag on the cards (a card doesn't know a product's variants; the product page does)

## Product page (third mock-up, same day)

- **Two columns** (7 + 5):
  - **Left:** the photos in a white card, then three promises: 100% human hair, secure payments, and the defective-item exchange.
  - **Right:** a white buying card:
    - the category, an In stock pill, the name, wishlist and rating
    - the price in a cream box with Save ₹…
    - option pills (colours get a swatch)
    - "Unsure of your shade?" (WhatsApp) and Add to bag
    - three delivery lines and the SKU
- **Below:** Description, Details, and Delivery & exchange as folds in one white card; then reviews in a white card, guides and "You may also like".

Left out for the same reasons as before:

- the "temple sourced", "Bestseller #1" and "98% recommend" claims, the review counts and the sample reviews
- the before/after story, 200°C, EMI and pouch claims
- the pincode checker (no delivery-date data)
- "Express checkout with UPI" (checkout already offers UPI)
- the bundle offer (no bundles)
- the zoom button (tapping the photo already opens it full screen)

## Same-to-same pass and My account (fourth mock-up, same day)

The owner asked for every page to match the mock-ups "same to same", with their colours.

- **Colours:**
  - `sand` `#faf3e8` and `sand-deep` `#f4ede2` (the mock's surface-container-low / -container) for pills, boxes and fields inside white cards.
  - `cream` `#fbf9f5` is for the footer only.
- **Header:**
  - The wordmark line "Luxury Human Hair Co." and "Shop All" first in the menu.
  - A search pill ("Search clip-ins, toppers, shades…"), a dark round account button, and small gold and green counts.
- **Footer:**
  - Columns: Quick Shop, Customer Care & Guides (adds Hair guides and Track your order), HairCraft, then the payment chips (UPI, GPay, PhonePe, Visa, Mastercard, Net banking).
  - A bottom bar with Privacy and Terms.
- **Cards:**
  - One gold star with the rating and review count.
  - A full-width "Choose options" button (options are chosen on the product page, so not "Add to Bag").
- **Product page:**
  - A square photo with a row of thumbnails under it.
  - The information as tabs.
  - A sand quantity pill, and "ADD TO BAG — ₹price" (its accessible name stays "Add to bag").
- **My account:**
  - Overview: a greeting card ("Welcome back, Name") with four real figures: orders on their way, latest order, wishlist and addresses.
  - The latest order with its progress line and items, then View order and Buy again.
  - Order history, then saved addresses.
  - A white sidebar menu with a gold dot on the current page, a WhatsApp help box and a red Sign out.
  - Left out: points and rewards, member tiers, a dedicated stylist, a "hair profile", trichology, the GST invoice download, and courier ETAs the shop doesn't have.

## Bag drawer (fifth mock-up, same day)

- **Panel:** white and square-cornered, sliding in from the right (460px), over a darker backdrop.
- **Cream header:** a dark bag icon, "Your bag" with the item count, a close button, and the free-shipping box (deep green bar, the subtotal on the right).
- **Lines:** sand cards with a bordered white quantity pill, a bin "Remove", and the price in bold.
- **Pinned footer:**
  - Subtotal (N items), Delivery (FREE once it qualifies, otherwise "Worked out at checkout"), and the Total "inclusive of all GST taxes".
  - "🔒 Secure checkout · ₹…" (the link's name now starts "Secure checkout"), then View bag.
  - A line of real promises: defective-item exchange, secure payments, ships in 1–2 working days.
- **Left out:** the care-routine upsell (no bundles), a ready-applied FIRSTORDER coupon (coupons are entered at checkout), "1-click UPI" (Razorpay at checkout already offers UPI), "256-bit SSL", "ships in 24h", "7-day swap" and "BlueDart Air".

## Search panel (sixth mock-up, same day)

- **Overlay:** a dark, blurred backdrop with a large white card under the header. Phones get the whole screen.
- **Cream top:** a big search box with a 2px deep green border, the typed words in Playfair, Clear, "ESC to close" and Search, plus a round close button.
- **Left column:**
  - "Did you mean …?" when the shop suggests a spelling.
  - Popular categories (the real menu, as ✦ chips).
  - The WhatsApp "Unsure of your shade?" box.
- **Right column** (the combobox's list, so ↑ ↓ Enter and Escape work as before):
  - The matching categories as chips.
  - "Products · N matches" as a two-column grid of cards (photo, rating, name, short description, price, View).
  - "See all results for '…' →".
- **Left out:**
  - Trending searches (the shop doesn't record searches).
  - "Your match" shade chips (no saved shade), and "Under ₹1,000" refine chips (search has no such filter yet).
  - Bag buttons on results (options are chosen on the product page).
- **Header search pill:** shown from 1280px up (an icon below that), so the header fits tablets.

## My orders (seventh mock-up, same day)

`/account/orders`, keeping the account sidebar like every account page.

- **Header:** a sage badge, "My orders" in 40px Playfair, and a "Need help? WhatsApp us" pill.
- **Filters:** the status tabs (All, Awaiting payment, Confirmed, Being packed, Shipped, Delivered, Cancelled) in a white card, with the order count.
- **Featured order:** on the unfiltered first page, the newest order still on its way, in a large card:
  - its number, date, total with the payment note, the courier and tracking number once shipped, and its status
  - the progress line on sand, and its items (photo, options, quantity, price)
  - View order, Track with the courier (once there is a tracking link), Buy again, and the Exchange policy
- **Every order:** white cards with a header strip (number / date / total, payment note, status), the first item's photo and name, and "View details →".
- **Below the list:**
  - "Our promise on every order": the real exchange, dispatch, payment and hair promises.
  - The WhatsApp help banner.
- **Left out:**
  - Counts on the tabs (the API filters one status at a time).
  - Searching orders and the date dropdown (the orders API has neither).
  - GST invoice downloads, "7-day free shade swap" requests, HairPoints, review points, rider and flight details, delivery-time promises, the hygiene seal, "temple" sourcing, a toll-free number, and named stylists.

## Sign in (eighth mock-up, same day)

- **Left: the form card,** with a deep green and gold ribbon on top.
  - The "Secure sign-in" badge, "Welcome back", and the email and password fields (sand boxes, 48px tall).
  - "Forgot your password?" in gold, then a tall uppercase SIGN IN button.
  - "New to HairCraft? Create an account →".
- **Right: why have an account,** four real reasons (follow orders, faster checkout, wishlist, reviews).
  - Then one real 5-star review (none: left out).
  - Then three promise tiles.
- **Bottom: "Trouble signing in?"** with Reset password and Ask on WhatsApp.
- **The same field style everywhere:** register, checkout, the account forms, cancelling and reviews. The register, forgot-password and reset pages get the same ribbon card.
- **Left out:**
  - The WhatsApp/SMS OTP sign-in, Google and Apple sign-in, and "Keep me signed in" (none exist).
  - "256-bit" claims, the ₹300 welcome credit, the 7-day doorstep swap, the shade vault, trichologists, "temple hair", and the invented testimonial.

## Sign up (ninth mock-up, same day)

- **Top:** an uppercase breadcrumb with gold slashes, and a "Secure sign-up" pill.
- **Left: the form card,** with a soft mint glow.
  - "✦ Join HairCraft", "Create your account", and the real free-shipping note (from the setting).
  - The fields: first and last name, email, the mobile number with a 🇮🇳 +91 pill (still optional), and the password.
  - A "Password strength" box: a bar of the three rules, and the rules ticked as they're met.
  - "By creating an account you agree to our Terms of use and Privacy policy".
  - A tall uppercase CREATE ACCOUNT → button, then "Already have a HairCraft account? Sign in →".
- **Right:**
  - "What your account gives you": four real perks on sand.
  - A 100% human hair card with the real exchange rule.
  - A dark green "Need help before signing up?" WhatsApp card.
- **Left out:**
  - The ₹300 welcome credit, a "trichology shade analysis", the hair-profile quiz (nothing stores it), and confirm-password (the form shows the password instead).
  - The terms tick box (a note instead; the shop never had one), and Google and Apple sign-up.
  - "Priority virgin drops", the 7-day doorstep swaps, "18,000 pin codes", the named trichologist and phone number, and the "4.9/5 from 24,000+ women" rating.

## Checkout (tenth mock-up, same day)

- **Frame:** checkout keeps its own frame (logo and wordmark, a sage "Secure checkout" pill, Back to bag), so nothing leads away mid-order. It's now white, like the site header, with a cream footer line.
- **Top:** "Checkout", the steps "✓ 1. Bag — 2. Delivery & payment — 3. Confirmation", and a "Secure payments by Razorpay · 100% human hair" pill.
- **Left, in white cards:**
  - **1 Delivery address:** sand option cards that turn sage when chosen.
  - **2 Payment:**
    - Pay online, listing UPI (GPay, PhonePe, Paytm…), cards, net banking and wallets, with UPI / Cards / NetBanking chips.
    - Cash on delivery (when allowed).
  - **"Checked before it ships":** the real defective-item exchange rule.
  - **3 Delivery instructions.**
- **Right: the summary card:**
  - "Your order · Order summary (N items)" and items on sand.
  - The coupon box (real coupons) on sand.
  - Subtotal / discount / shipping (FREE in green), and the total in a sand band at 32px with the GST included.
  - A tall uppercase PLACE ORDER · ₹… button and the terms line.
  - Three promise tiles, and "Unsure about your shade? WhatsApp".
- **Left out:**
  - "Express 1-click" GPay/PhonePe buttons and an in-page UPI ID box with "Verify VPA" and QR. Payment happens in Razorpay's own window, which offers all of these.
  - Delivery speed choices and same-day delivery, and the discreet-box, call-first and concierge options (none exist; notes cover them).
  - The ₹50 UPI discount, the COD fee and OTP, EMI, the "VIP" badge, the free gift, FIRSTORDER, Club credits, insurance, "256-bit SSL", the 7-day free shade swap, the swatch guarantee, and the named trichologist.
