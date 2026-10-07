/** The information pages, in the order of the side list and footer. */
export const INFO_PAGES = [
  { slug: "shipping", label: "Shipping", href: "/shipping" },
  { slug: "returns", label: "Returns & refunds", href: "/returns" },
  { slug: "faq", label: "FAQ", href: "/faq" },
  { slug: "contact", label: "Contact us", href: "/contact" },
  { slug: "about", label: "About HairCraft", href: "/about" },
  { slug: "privacy", label: "Privacy policy", href: "/privacy" },
  { slug: "terms", label: "Terms of use", href: "/terms" },
] as const;

export type InfoSlug = (typeof INFO_PAGES)[number]["slug"];

/** When each page's text last changed (shown as "Last updated"). */
export const LAST_UPDATED: Record<InfoSlug, string> = {
  shipping: "2026-10-07",
  returns: "2026-10-07",
  faq: "2026-10-07",
  contact: "2026-10-07",
  about: "2026-10-07",
  privacy: "2026-10-07",
  terms: "2026-10-07",
};
