import type { PublicProduct, PublicReview, PublicVariant } from "@/lib/api/types";
import type { ShopPolicies } from "@/lib/info/policies";
import { returnPolicy, shippingDetails } from "@/lib/seo/commerce";

/** Reviews shown to search engines with a product (Google uses a few). */
export const MAX_JSON_LD_REVIEWS = 5;

/** "18 in, Natural Black, Straight" for an option's offer. */
function optionName(variant: PublicVariant): string {
  return [
    variant.lengthInches === null ? null : `${variant.lengthInches} in`,
    variant.color,
    variant.texture,
    variant.sizeHeightCm == null || variant.sizeWidthCm == null
      ? null
      : `${variant.sizeHeightCm} × ${variant.sizeWidthCm} cm`,
    variant.weightGrams === null ? null : `${variant.weightGrams} g`,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * schema.org `Product` for search engines:
 *
 * - name, description, photos, brand and category
 * - the price range in rupees, plus one offer per option (SKU, price, stock),
 *   each with delivery details and the returns policy when the shop's rules
 *   are known (B15, S14)
 * - the rating and up to 5 approved reviews, only when the product has
 *   reviews (search engines reject a rating of 0 from 0 reviews)
 */
export function productJsonLd(
  product: PublicProduct,
  siteUrl: string,
  extra: { policies?: ShopPolicies | null; reviews?: PublicReview[] } = {},
) {
  const url = new URL(`/product/${encodeURIComponent(product.slug)}`, siteUrl).toString();
  // Only what can be bought (not a main variant that has sub-variants).
  const variants = product.variants.filter(
    (v): v is typeof v & { effectivePrice: string } =>
      v.purchasable !== false && v.effectivePrice !== null,
  );
  const available = variants.filter((v) => v.inStock).length;
  const policies = extra.policies ?? null;
  const reviews =
    product.reviewCount > 0 ? (extra.reviews ?? []).slice(0, MAX_JSON_LD_REVIEWS) : [];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.shortDescription ?? undefined,
    image: product.images.map((image) => image.urls.large),
    url,
    ...(variants.length === 1 ? { sku: variants[0].sku } : {}),
    brand: { "@type": "Brand", name: "HairCraft" },
    category: product.categories[0]?.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: product.priceRange.min,
      highPrice: product.priceRange.max,
      offerCount: variants.length,
      availability: available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
      offers: variants.map((variant) => ({
        "@type": "Offer",
        sku: variant.sku,
        name: optionName(variant) || undefined,
        price: variant.effectivePrice,
        priceCurrency: "INR",
        availability: variant.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        url: `${url}?variant=${encodeURIComponent(variant.sku)}`,
        ...(policies
          ? {
              shippingDetails: shippingDetails(policies, variant.effectivePrice),
              hasMerchantReturnPolicy: returnPolicy(siteUrl),
            }
          : {}),
      })),
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews.length > 0
      ? {
          review: reviews.map((review) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: { "@type": "Person", name: review.reviewerName },
            datePublished: review.createdAt.slice(0, 10),
            ...(review.title ? { name: review.title } : {}),
            ...(review.body ? { reviewBody: review.body } : {}),
          })),
        }
      : {}),
  };
}
