import Image from "next/image";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import Link from "next/link";
import { Badge, PriceRange } from "@/components/ui/display";
import { HeartButton } from "@/components/wishlist/wishlist-ui";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { BagIcon } from "@/components/ui/icons";
import { ratingLabel } from "./rating-stars";

/** Where a product's page lives (the page itself is phase S5). */
export const productHref = (slug: string) => `/product/${encodeURIComponent(slug)}`;

/** Which labels a card shows: sold out wins over sale (a sale on nothing to buy says nothing). */
export function cardBadges(
  product: Pick<ProductCardData, "inStock" | "onSale">,
): ("sale" | "soldOut")[] {
  if (!product.inStock) return ["soldOut"];
  return product.onSale ? ["sale"] : [];
}

/**
 * A product in a list: photo, name, price range, sale / sold out, rating.
 * The whole card is one link, so it is one stop for keyboard users; the
 * wishlist heart sits on the photo as its own button, outside the link.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 70vw",
  heart = true,
  className,
}: {
  product: ProductCardData;
  /** The first cards of the page: load the photo straight away. */
  priority?: boolean;
  sizes?: string;
  /** Show the wishlist heart (the wishlist page has its own Remove instead). */
  heart?: boolean;
  className?: string;
}) {
  const badges = cardBadges(product);
  return (
    <div
      className={cx(
        "group relative h-full rounded-2xl bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-xl sm:p-4",
        className,
      )}
    >
      <Link
        href={productHref(product.slug)}
        className="flex h-full flex-col gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
          {product.image ? (
            <Image
              src={product.image.medium}
              alt={product.imageAlt ?? product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={cx(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                !product.inStock && "opacity-60",
              )}
            />
          ) : (
            <PhotoPlaceholder />
          )}
          {badges.length > 0 ? (
            <div className="absolute top-2.5 left-2.5 flex gap-2">
              {badges.includes("soldOut") ? <Badge tone="deep">Sold out</Badge> : null}
              {badges.includes("sale") ? <Badge tone="gold">Sale</Badge> : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {product.reviewCount > 0 ? (
            // One gold star, the rating and the count, as in the design.
            <span
              role="img"
              aria-label={ratingLabel(product.rating, product.reviewCount)}
              className="flex items-center gap-1.5 text-xs"
            >
              <svg aria-hidden viewBox="0 0 24 24" width={16} height={16} fill="var(--gold)">
                <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
              </svg>
              <span className="font-bold">{product.rating.toFixed(1)}</span>
              <span className="text-[0.8125rem] text-muted">
                ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </span>
          ) : null}
          <h3 className="line-clamp-2 font-display text-lg leading-6 font-semibold text-deep transition-colors group-hover:text-gold-ink">
            {product.name}
          </h3>
          {product.shortDescription ? (
            <p className="line-clamp-1 text-[0.8125rem] text-muted">{product.shortDescription}</p>
          ) : null}
          <div className="mt-auto flex flex-col gap-3 pt-3">
            <PriceRange
              min={product.priceRange.min}
              max={product.priceRange.max}
              className="text-lg font-bold tracking-tight"
            />
            {/* The options (length, shade…) are chosen on the product page. */}
            <span
              aria-hidden
              className="flex w-full items-center justify-center gap-2 rounded-full bg-deep px-4 py-2.5 text-xs font-semibold tracking-wide text-white transition-colors group-hover:bg-deep-hover"
            >
              <BagIcon width={16} height={16} />
              Choose options
            </span>
          </div>
        </div>
      </Link>
      {heart ? (
        <HeartButton
          productId={product.id}
          name={product.name}
          className="absolute top-5 right-5 sm:top-6 sm:right-6"
        />
      ) : null}
    </div>
  );
}
