import type { MetadataRoute } from "next";
import { routes } from "@/components/layout/nav";
import { INFO_PAGES, LAST_UPDATED } from "@/content/pages";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { Category } from "@/lib/api/types";
import { settings } from "@/lib/env";

// Built per request: it depends on STORE_OPEN, which is read when the server runs, not at build.
export const dynamic = "force-dynamic";

/** Every category with products, at any depth. */
function withProducts(categories: Category[]): Category[] {
  return categories.flatMap((c) => [
    ...(c.productCount > 0 ? [c] : []),
    ...withProducts(c.children),
  ]);
}

/**
 * The home page always; the shop, its categories and products only while the shop is
 * open (while closed they show Coming soon, which search engines shouldn't
 * index under those addresses).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { storeOpen, siteUrl } = settings();
  const url = (path: string) => new URL(path, siteUrl).toString();
  const entries: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
  if (!storeOpen) return entries;

  entries.push({ url: url(routes.shop), changeFrequency: "daily", priority: 0.9 });
  for (const page of INFO_PAGES)
    entries.push({
      url: url(page.href),
      lastModified: new Date(`${LAST_UPDATED[page.slug]}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.4,
    });
  try {
    for (const category of withProducts(await getCategories()))
      entries.push({
        url: url(routes.category(category.slug)),
        changeFrequency: "daily",
        priority: 0.8,
      });
    // Every active product, 100 at a time (at most 50 pages: 5,000 products).
    for (let page = 1; page <= 50; page++) {
      const { items, meta } = await getProducts({ page, limit: 100 });
      for (const product of items)
        entries.push({
          url: url(`/product/${encodeURIComponent(product.slug)}`),
          changeFrequency: "weekly",
          priority: 0.7,
          // The product's main photo, for image search.
          ...(product.image ? { images: [product.image.large] } : {}),
        });
      if (!meta.hasNextPage) break;
    }
  } catch (error) {
    // The API being down only shortens the sitemap for a while.
    if (!isApiError(error)) throw error;
  }
  return entries;
}
