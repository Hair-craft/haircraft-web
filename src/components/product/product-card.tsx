import Image from "next/image";
import Link from "next/link";
import { Badge, PriceRange } from "@/components/ui/display";
import { HeartButton } from "@/components/wishlist/wishlist-ui";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { RatingStars } from "./rating-stars";

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
    <div className={cx("relative", className)}>
      <Link
        href={productHref(product.slug)}
        className="group flex flex-col gap-3 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white/70">
          {product.image ? (
            <Image
              src={product.image.medium}
              alt={product.imageAlt ?? product.name}
              fill
              sizes={sizes}
              priority={priority}
              className={cx(
                "object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                !product.inStock && "opacity-60",
              )}
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full items-center justify-center font-display text-4xl text-deep/20"
            >
              HC
            </div>
          )}
          {badges.length > 0 ? (
            <div className="absolute top-3 left-3 flex gap-2">
              {badges.includes("soldOut") ? <Badge tone="deep">Sold out</Badge> : null}
              {badges.includes("sale") ? <Badge tone="gold">Sale</Badge> : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 px-1">
          <h3 className="font-display text-xl leading-snug group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
            {product.name}
          </h3>
          <PriceRange
            min={product.priceRange.min}
            max={product.priceRange.max}
            className="text-sm"
          />
          {product.reviewCount > 0 ? (
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
          ) : null}
        </div>
      </Link>
      {heart ? (
        <HeartButton
          productId={product.id}
          name={product.name}
          className="absolute top-3 right-3"
        />
      ) : null}
    </div>
  );
}
