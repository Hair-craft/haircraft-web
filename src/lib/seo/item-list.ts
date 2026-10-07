/** schema.org `ItemList` of a category's (or the shop's) products, in the order shown. */
export function itemListJsonLd(
  name: string,
  products: { name: string; slug: string }[],
  siteUrl: string,
  startPosition = 1,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: startPosition + i,
      url: new URL(`/product/${encodeURIComponent(product.slug)}`, siteUrl).toString(),
      name: product.name,
    })),
  };
}
