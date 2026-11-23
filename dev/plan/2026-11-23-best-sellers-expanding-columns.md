# Plan: Best sellers as expanding columns with a product quick view (2026-11-23)

**Ask (owner):** "In my best seller section, we need this effect, and when we click on the
selected card it will open a dialogue type box where the product details will be open, but it
will not go to the product details page redirect by url."

The owner pasted a second sample: Nikolay Talanov's "Satellite" columns.

- The section is split into tall columns standing side by side.
- On load each column slides up into place, one after another.
- Hovering a column shows a big number rising from its foot.
- Clicking one makes it grow to fill the whole section while the others shrink and fade. Its
  content and a close (×) button then appear; closing reverses it.

**Customer favourites** (Best rated, New arrivals) keep the 3D ring. Only **Best sellers**
changes.

## What visitors see

- **Columns:**
  - up to 5 Best sellers (the sample has 5), each a tall column filled with the product's
    photo;
  - the name sits in the middle, white, and the columns are slightly dimmed until hovered,
    as in the sample;
  - the first 5 of the products ticked "Best seller" in the admin, in the admin's order;
  - with 1 or 2 best sellers, the columns are just wider, still the same effect.
- **On load:**
  - each column slides up from below, 0.1 s after the one before;
  - the photos slide the other way inside them, and the names fade in last.
- **Hover:**
  - the column brightens;
  - its number (1–5) rises from the foot in large gold-and-white type, as in the sample.
- **Click a column:**
  - it grows to fill the section while the other columns shrink to half and fade, with the
    sample's timings;
  - the **product quick view** then fades in inside it.
  - **The address doesn't change** and no new page loads.
- **The quick view:**
  - the product page's own buying panel: photo gallery, name, rating, price, the length /
    shade / size choices, stock, Add to bag, Buy now (Magic Checkout), wishlist heart and the
    folding details (description, delivery);
  - it scrolls inside the box if it's long;
  - the details load when you click, during the 1 s expand animation.
- **Closing:** the ✕ button, the Esc key, or the browser's back button close it. The column
  shrinks back and the others return.
- **Phones:** the same 5 columns, as narrow tall strips, with the names hidden until opened.
  Tapping one opens the quick view full screen.
- **Reduce motion:** the same layout without the slides. Opening and closing are instant.

## Build

- **New `src/components/home/best-seller-columns.tsx`** (client):
  - the columns and their states (`inactive` → `ready` → one `active`), mostly in CSS
    transitions as in the sample;
  - `globals.css` gets the `.hc-cols` rules ported from the sample's SCSS (5 columns, the
    timings, the hover number).
- **Quick view:**
  - a server action `quickView(slug)` returns the product and its description as safe HTML
    (the same data the product page uses);
  - `ProductView` is shown inside the expanded column;
  - `ProductView` gets an option not to write the chosen option into the address
    (`syncAddress={false}`), so the address bar stays on the home page.
- **Accessibility:**
  - each column is a button ("Quick view: Silk Base Wig");
  - the open column is a dialog (`role="dialog"`, `aria-modal`), focus moves into it and
    comes back to the column on close, and Esc closes it;
  - the products are still real links in the server's HTML, for search engines.
- **`BestSellersSection`** uses the new component; "View all products" stays.

## Tests

- Unit tests for the column state rules, and for the quick view action (product and
  description; unknown product → a calm message).
- The current home and product tests keep passing.

## Not in this plan

- Customer favourites (stays as the 3D ring).
- The product page itself, apart from the `syncAddress` option.
