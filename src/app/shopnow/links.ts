/**
 * Where "Shop now" sends people. To use a deep link (URLgenius, Bouncy…)
 * later, replace the address here.
 */

/** HairCraft's Amazon brand store. */
export const amazon = {
  href: "https://www.amazon.in/stores/HairCraft/page/F05081AD-7111-4B55-8DE0-73B1EB0549DD?lp_asin=B0H7X7Q5Y4&ref_=cm_sw_r_ud_ast_store_YXBP4QF38F5Y66D2HS5R&store_ref=bl_ast_dp_brandlogo_sto",
  /** The Meta Pixel event sent when someone taps it (when the Pixel is on). */
  event: "Click_ShopAmazon",
};

/** HairCraft on Flipkart: the general link, shown as "See all on Flipkart". */
export const flipkart = {
  href: "https://dl.flipkart.com/s/6hqlE8NNNN",
  event: "Click_ShopFlipkart",
};

export interface FlipkartProduct {
  /** As shoppers know it, e.g. "Seamless Clip-in Extensions, 20 inch". */
  name: string;
  /** A short detail under the name (optional), e.g. "Natural Black · 120 g". */
  detail?: string;
  /** The product's Flipkart page. */
  href: string;
  /** Its photo, saved in public/images/flipkart/ (from its Flipkart listing). */
  image?: string;
}

/**
 * HairCraft's products on Flipkart, in the order they should be listed.
 * While this list is empty the Flipkart button goes straight to the link
 * above; add products and it becomes a dropdown of them. For example:
 *
 *   { name: "Seamless Clip-in Extensions", detail: "20 inch · Natural Black", href: "https://www.flipkart.com/…" },
 */
export const flipkartProducts: FlipkartProduct[] = [
  {
    name: "Air Bangs Extension Clip",
    detail: "Clip-in fringe",
    href: "https://www.flipkart.com/hair-craft-air-bangs-extension-clip/p/itm2d46b0aa2ff03?pid=HACHRN3JHSJRPEZN",
    image: "/images/flipkart/air-bangs-clip.jpeg",
  },
  {
    name: "12×12 Silk Base Topper with Fringes",
    detail: "Hair topper for women",
    href: "https://www.flipkart.com/hair-craft-12x12-silk-base-topper-fringes-women-extension/p/itm78394e251da76?pid=HAEHRN3MF6J4WPYF",
    image: "/images/flipkart/silk-base-topper-fringes.jpeg",
  },
  {
    name: "Claw Clip Ponytail Extension",
    detail: "10 inch · Black · Wavy, 100% human hair",
    href: "https://www.flipkart.com/hair-craft-claw-clip-ponytail-extension-10-inch-black-100-natural-human-wavy-extension/p/itmb077a5f9e02ef?pid=HAEHRN3E2UHTDVH2",
    image: "/images/flipkart/claw-clip-ponytail.jpeg",
  },
];
