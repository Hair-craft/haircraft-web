"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { AddToBag } from "@/components/cart/cart-ui";
import { RatingStars } from "@/components/product/rating-stars";
import { HeartButton, useWishlist } from "@/components/wishlist/wishlist-ui";
import { Price } from "@/components/ui/display";
import type { PublicProduct, PublicVariant } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import {
  AXES,
  axisValues,
  choiceStatus,
  galleryFor,
  pick,
  pickerAxes,
  saving,
  valueLabel,
} from "@/lib/product/variants";
import { RichText } from "@/components/info/rich-text";
import { deliveryAndReturns } from "./content";
import { Gallery } from "./gallery";

/** `?variant=<SKU>`: the address of one option of this product. */
const variantHref = (slug: string, variant: PublicVariant) =>
  `/product/${encodeURIComponent(slug)}?variant=${encodeURIComponent(variant.sku)}`;

/**
 * The top of the product page: photos and the buying column, then the
 * folding details. Choosing an option updates the price, stock and photos at
 * once and records it in the address (without reloading the page).
 */
export function ProductView({
  product,
  initialSku,
}: {
  product: PublicProduct;
  initialSku: string;
}) {
  const { addedToBag } = useWishlist();
  const [variant, setVariant] = useState(
    () => product.variants.find((v) => v.sku === initialSku) ?? product.variants[0],
  );
  const choose = (event: MouseEvent, next: PublicVariant) => {
    // Without JavaScript these are plain links; with it, no reload.
    event.preventDefault();
    setVariant(next);
    window.history.replaceState(null, "", variantHref(product.slug, next));
  };

  const images = galleryFor(product.images, variant?.id);
  const axes = pickerAxes(product.variants);
  const saved = variant ? saving(variant) : null;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <Gallery key={variant?.id ?? "none"} images={images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          {product.categories[0] ? (
            <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">
              {product.categories[0].name}
            </p>
          ) : null}
          <div className="mt-3 flex items-start justify-between gap-4">
            <h1 className="font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
            <HeartButton
              productId={product.id}
              name={product.name}
              size="large"
              className="shrink-0"
            />
          </div>
          {product.reviewCount > 0 ? (
            <a
              href="#reviews"
              className="mt-3 inline-flex rounded-full hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
            >
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
            </a>
          ) : null}

          {variant ? (
            <div className="mt-6" aria-live="polite">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl">
                <Price
                  amount={variant.effectivePrice}
                  compareAt={variant.onSale ? variant.price : null}
                />
                {saved ? (
                  <span className="rounded-full bg-gold/90 px-3 py-0.5 text-sm font-medium text-deep">
                    Save {formatPrice(saved)}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-deep/70">Inclusive of all taxes</p>
              <p
                className={cx(
                  "mt-3 inline-flex items-center gap-2 text-sm font-medium",
                  variant.inStock ? "text-deep" : "text-red-800",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "size-2 rounded-full",
                    variant.inStock ? "bg-emerald-600" : "bg-red-700",
                  )}
                />
                {variant.inStock ? "In stock" : "Sold out"}
              </p>
            </div>
          ) : null}

          {product.shortDescription ? (
            <p className="mt-5 leading-relaxed text-deep/75">{product.shortDescription}</p>
          ) : null}

          {variant ? (
            <div className="mt-6 flex flex-col gap-5">
              {AXES.map(({ key, label }) => {
                const values = axisValues(product.variants, key);
                if (values.length === 0) return null;
                const current = variant[key];
                if (!axes.includes(key))
                  return (
                    <p key={key} className="text-sm">
                      <span className="text-deep/70">{label}: </span>
                      {valueLabel(key, values[0])}
                    </p>
                  );
                return (
                  <OptionRow
                    key={key}
                    label={label}
                    current={current === null ? "" : valueLabel(key, current)}
                  >
                    {values.map((value) => {
                      const target = pick(product.variants, variant, key, value);
                      const status = choiceStatus(product.variants, variant, key, value);
                      const chosen = value === current;
                      return (
                        <a
                          key={String(value)}
                          href={variantHref(product.slug, target)}
                          onClick={(event) => choose(event, target)}
                          aria-current={chosen || undefined}
                          className={cx(
                            "inline-flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
                            chosen
                              ? "border-deep bg-deep text-mint"
                              : status === "elsewhere"
                                ? "border-dashed border-deep/30 bg-transparent text-deep/70 hover:border-deep/60"
                                : "border-deep/20 bg-white/70 hover:border-deep/60",
                            status === "soldout" && "line-through decoration-1",
                          )}
                        >
                          {valueLabel(key, value)}
                          {status === "soldout" ? (
                            <span className="sr-only">, sold out</span>
                          ) : null}
                          {status === "elsewhere" ? (
                            <span className="sr-only">, changes your other choices</span>
                          ) : null}
                        </a>
                      );
                    })}
                  </OptionRow>
                );
              })}
            </div>
          ) : null}

          {variant ? (
            <AddToBag
              variantId={variant.id}
              price={variant.effectivePrice}
              inStock={variant.inStock}
              onAdded={() => addedToBag(product.id)}
            />
          ) : null}

          {variant ? <p className="mt-4 text-xs text-deep/70">SKU: {variant.sku}</p> : null}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-3xl divide-y divide-deep/10 border-y border-deep/10">
        {product.description ? (
          <Fold title="Description" open>
            {product.description
              .split(/\n\s*\n|\n/)
              .filter((p) => p.trim())
              .map((paragraph, i) => (
                <p key={i} className="mt-3 first:mt-0">
                  {paragraph}
                </p>
              ))}
          </Fold>
        ) : null}
        <Fold title="Details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            {[
              ...Object.entries(product.attributes),
              ...(variant
                ? ([
                    [
                      "Length",
                      variant.lengthInches === null ? null : `${variant.lengthInches} inch`,
                    ],
                    ["Colour", variant.color],
                    ["Texture", variant.texture],
                    ["Weight", variant.weightGrams === null ? null : `${variant.weightGrams} g`],
                    ...Object.entries(variant.attributes),
                  ].filter(([, value]) => value) as [string, string][])
                : []),
            ].map(([name, value]) => (
              <div key={name} className="contents">
                <dt className="text-deep/70">{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Fold>
        <Fold title="Delivery & returns">
          {deliveryAndReturns.map((paragraph) => (
            <p key={paragraph} className="mt-3 first:mt-0">
              <RichText text={paragraph} />
            </p>
          ))}
        </Fold>
      </div>
    </>
  );
}

function OptionRow({
  label,
  current,
  children,
}: {
  label: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-sm">
        <span className="text-deep/70">{label}: </span>
        <span className="font-medium">{current}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Fold({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium tracking-[0.2em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-lg leading-none">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>
      <div className="mt-4 leading-relaxed text-deep/75">{children}</div>
    </details>
  );
}
