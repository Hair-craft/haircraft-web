import type { MetadataRoute } from "next";

/**
 * Pages search engines have no use for: personal pages, the checkout, sign-in,
 * the shop's own search results and the storefront's internal routes. They
 * are also marked "noindex" on the page itself.
 */
export const PRIVATE_PATHS = [
  "/account",
  "/checkout",
  "/cart",
  "/wishlist",
  "/sign-in",
  "/register",
  "/forgot-password",
  "/search",
  "/product/*/review",
  "/bff/",
];

/**
 * robots.txt: the live site (ALLOW_INDEXING=true) lets search engines in,
 * except the private paths, and points them at the sitemap. Everywhere else
 * (test servers, previews, a laptop) nothing may be indexed.
 */
export function robotsFor(options: {
  siteUrl: string;
  allowIndexing: boolean;
}): MetadataRoute.Robots {
  if (!options.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: new URL("/sitemap.xml", options.siteUrl).toString(),
    host: options.siteUrl,
  };
}
