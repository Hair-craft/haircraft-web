/**
 * Where the guides and buying guides link to, in one place. The category
 * addresses follow the catalogue's category slugs: if a category is renamed
 * in the admin panel (its slug changes), change it here too.
 */
export const shopLinks = {
  shop: "/shop",
  clipIns: "/shop/clip-in-extensions",
  seamlessClipIns: "/shop/seamless-clip-ins",
  toppers: "/shop/toppers-on-head",
  wigs: "/shop/wigs",
  laceFrontWigs: "/shop/lace-front-wigs",
  ponytails: "/shop/ponytails",
  /** There's no tape-in category yet, so tape-ins are found by search. */
  tapeIns: "/search?q=tape-in",
  contact: "/contact",
  returns: "/returns",
  shipping: "/shipping",
  faq: "/faq",
  guides: "/guides",
  guide: (slug: string) => `/guides/${slug}`,
} as const;
