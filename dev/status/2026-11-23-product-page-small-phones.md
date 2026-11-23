# Status: product pages on small phones (2026-11-23)

**Ask (owner):** the Claw Clip Ponytail product page didn't fit on phones; product pages on
small phones such as the iPhone mini weren't responsive.

## Cause

Checked live at 375px: the page was 552px wide on a 360px viewport. The gallery shows one
24px dot button per photo, and Claw Clip Ponytail has 21 photos. The dot row (512px) widened
the gallery column, and with it the page. Products with few photos fit.

## Done

- **`gallery.tsx`:** with more than 8 photos (`MAX_DOTS`), a "3 / 21" counter replaces the dots
  (polite live region); swiping still moves through the photos. The dot row can also wrap.
- **`product-view.tsx`:** the photo and buying columns are `min-w-0`, so nothing inside them
  can widen the page again.
- **Checked** locally at 375px: Silk Base Wig is 360px wide with nothing spilling over. The
  21-photo case follows from the counter; check on the live Claw Clip Ponytail page after the
  deploy.
