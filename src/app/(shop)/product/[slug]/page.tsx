import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { routes } from "@/components/layout/nav";
import { Breadcrumbs } from "@/components/listing/listing-parts";
import { ProductCard } from "@/components/product/product-card";
import { ProductView } from "@/components/product-page/product-view";
import { Reviews } from "@/components/product-page/reviews";
import {
  getNewArrivals,
  getProduct,
  getProducts,
  getReviewPage,
  getReviewSummary,
} from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { ProductCard as ProductCardData, PublicProduct } from "@/lib/api/types";
import { settings } from "@/lib/env";
import { galleryFor, variantFromSku } from "@/lib/product/variants";
import { productJsonLd } from "@/lib/product/structured-data";
import { getShopPolicies } from "@/lib/api/shop";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { openGraph } from "@/lib/seo/open-graph";
import { myReview, reviewEligibility } from "@/lib/reviews/api";
import { getSession } from "@/lib/session/session";

/** The product, `null` when the API can't be reached, or the 404 page when there is no such product. */
async function loadProduct(slug: string): Promise<PublicProduct | null> {
  try {
    return await getProduct(slug);
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 404) notFound();
      return null;
    }
    throw error;
  }
}

/** Optional parts of the page: an API problem just leaves them out. */
async function quietly<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}

const productPath = (slug: string) => `/product/${encodeURIComponent(slug)}`;

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Product" };
  const description = product.shortDescription ?? product.description?.slice(0, 160) ?? undefined;
  const photo = galleryFor(product.images, undefined)[0];
  return {
    title: product.name,
    description,
    // Every option (`?variant=`) shares the product's own address.
    alternates: { canonical: productPath(slug) },
    openGraph: openGraph({
      title: `${product.name} | HairCraft`,
      description,
      url: productPath(slug),
      images: photo ? [{ url: photo.urls.large, alt: photo.altText ?? product.name }] : undefined,
    }),
  };
}

/** Up to 4 other products from the product's category, topped up with the newest. */
async function relatedTo(product: PublicProduct): Promise<ProductCardData[]> {
  const category = product.categories[0]?.slug;
  const [sameCategory, newest] = await Promise.all([
    category
      ? quietly(async () => (await getProducts({ category, limit: 5 })).items)
      : Promise.resolve([]),
    quietly(() => getNewArrivals(8)),
  ]);
  const seen = new Set([product.id]);
  return [...(sameCategory ?? []), ...(newest ?? [])]
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .slice(0, 4);
}

export default async function ProductPage({ params, searchParams }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const { siteUrl } = settings();
  const product = await loadProduct(slug);

  if (!product)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <ApiUnavailable retryHref={productPath(slug)} />
      </div>
    );

  // One address per option: `?variant=<SKU>` exactly as the catalogue spells it, nothing else.
  const asked = typeof query.variant === "string" ? query.variant : undefined;
  const variant = variantFromSku(product.variants, asked);
  const known = asked !== undefined && variant?.sku.toLowerCase() === asked.trim().toLowerCase();
  const tidy = known && variant ? `?variant=${variant.sku}` : "";
  const extra = Object.keys(query).some((key) => key !== "variant");
  if (extra || (asked !== undefined && `?variant=${asked}` !== tidy))
    redirect(`${productPath(slug)}${tidy ? `?variant=${encodeURIComponent(variant!.sku)}` : ""}`);

  const { accessToken } = await getSession();
  const [summary, firstReviews, related, mine, policies] = await Promise.all([
    quietly(() => getReviewSummary(slug)),
    quietly(() => getReviewPage(slug, "relevant", 1)),
    relatedTo(product),
    // Signed in: the shopper's own review, if any (to offer Edit and show its status).
    accessToken
      ? quietly(async () => {
          const { existingReviewId } = await reviewEligibility(accessToken, product.id);
          return existingReviewId ? await myReview(accessToken, existingReviewId) : null;
        })
      : null,
    getShopPolicies(),
  ]);

  const category = product.categories[0];
  const trail = [
    { name: "Home", href: routes.home },
    { name: "Shop", href: routes.shop },
    ...(category ? [{ name: category.name, href: routes.category(category.slug) }] : []),
    { name: product.name, href: productPath(slug) },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            productJsonLd(product, siteUrl, { policies, reviews: firstReviews?.items ?? [] }),
          ),
        }}
      />
      <div className="mb-6">
        <Breadcrumbs trail={trail} siteUrl={siteUrl} />
      </div>

      <ProductView product={product} initialSku={variant?.sku ?? ""} />

      {summary && firstReviews ? (
        <div className="mt-20">
          <Reviews
            slug={slug}
            summary={summary}
            first={firstReviews.items}
            totalPages={firstReviews.meta.totalPages}
            mine={mine ? { status: mine.status } : null}
          />
        </div>
      ) : null}

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-20">
          <h2 id="related-heading" className="text-center font-display text-4xl md:text-5xl">
            You may also like
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
            {related.map((card) => (
              <li key={card.id}>
                <ProductCard product={card} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
