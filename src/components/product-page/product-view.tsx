"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useCart } from "@/components/cart/cart-context";
import { AddToBag } from "@/components/cart/cart-ui";
import { business } from "@/content/business";
import { whatsappChatHref } from "@/lib/info/contact";
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
  detailRows,
  defaultVariant,
  optionGallery,
  optionVideos,
  pick,
  pickerAxes,
  saving,
  shopVariants,
  sizeKey,
  sizeLabel,
  valueLabel,
  valueOf,
} from "@/lib/product/variants";
import { deliveryPoints, productPromises } from "./content";
import { Gallery } from "./gallery";
import { OptionChoice, RulerIcon } from "./option-choice";

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
  descriptionHtml,
}: {
  product: PublicProduct;
  initialSku: string;
  /** The description as safe HTML (null: none). */
  descriptionHtml: string | null;
}) {
  const { addedToBag } = useWishlist();
  const { freeShippingThreshold } = useCart();
  const [variant, setVariant] = useState(
    () => product.variants.find((v) => v.sku === initialSku) ?? defaultVariant(product.variants),
  );
  const choose = (event: MouseEvent, next: PublicVariant) => {
    // Without JavaScript these are plain links; with it, no reload.
    event.preventDefault();
    setVariant(next);
    window.history.replaceState(null, "", variantHref(product.slug, next));
  };

  // Only the chosen option's photos (and the general ones) are shown (owner, 2026-11-06).
  const images = optionGallery(product.images, variant, product.variants);
  const videos = optionVideos(product.videos ?? [], variant, product.variants);
  // The choices are what can be bought: a main variant with sub-variants is
  // left out (only its sub-variants are offered), others are as they are.
  const options = shopVariants(product.variants);
  const axes = pickerAxes(options);
  const saved = variant ? saving(variant) : null;

  const whatsapp = whatsappChatHref(business);
  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* Photos in a white card, then three promises (the shop's real ones). */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          <div className="rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(11,41,26,0.04)] sm:p-4">
            <Gallery
              key={variant?.id ?? "none"}
              images={images}
              videos={videos}
              name={product.name}
            />
          </div>
          {/* Not on phones (owner, 2026-11-03). */}
          <ul className="hidden gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid sm:grid-cols-3">
            {productPromises.map((promise) => (
              <li key={promise.title} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage text-gold"
                >
                  ✦
                </span>
                <span className="flex flex-col">
                  <span className="text-[0.7rem] font-bold tracking-wide uppercase">
                    {promise.title}
                  </span>
                  <span className="text-xs text-muted">{promise.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(11,41,26,0.04)] lg:sticky lg:top-28 lg:col-span-5 lg:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {product.categories[0] ? (
              <p className="text-[0.7rem] font-bold tracking-[0.2em] text-gold-ink uppercase">
                {product.categories[0].name}
              </p>
            ) : (
              <span />
            )}
            {variant?.effectivePrice ? (
              <p
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  variant.inStock ? "bg-sage text-sage-ink" : "bg-red-50 text-red-800",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "size-1.5 rounded-full",
                    variant.inStock ? "bg-sage-ink" : "bg-red-700",
                  )}
                />
                {variant.inStock ? "In stock" : "Sold out"}
              </p>
            ) : null}
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl leading-tight font-semibold sm:text-[1.75rem]">
              {product.name}
            </h1>
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

          {variant?.effectivePrice ? (
            <div className="mt-5 rounded-xl bg-sand p-3.5" aria-live="polite">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-bold">
                <Price
                  amount={variant.effectivePrice}
                  compareAt={variant.onSale ? variant.price : null}
                />
                {saved ? (
                  <span className="rounded bg-deep px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
                    Save {formatPrice(saved)}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted">Inclusive of all taxes</p>
            </div>
          ) : null}

          {variant ? (
            <div className="mt-6 flex flex-col gap-5">
              {AXES.map(({ key, label }) => {
                const values = axisValues(options, key);
                if (values.length === 0) return null;
                const current = valueOf(variant, key);
                if (!axes.includes(key))
                  return (
                    <p key={key} className="text-sm">
                      <span className="text-muted">{label}: </span>
                      {valueLabel(key, values[0])}
                    </p>
                  );
                return (
                  <OptionRow
                    key={key}
                    label={label}
                    icon={key === "lengthInches" ? <RulerIcon /> : null}
                    current={current === null ? "" : valueLabel(key, current)}
                  >
                    {values.map((value) => {
                      const target = pick(options, variant, key, value);
                      return (
                        <OptionChoice
                          key={String(value)}
                          axis={key}
                          value={value}
                          href={variantHref(product.slug, target)}
                          onClick={(event) => choose(event, target)}
                          chosen={value === current}
                          status={choiceStatus(options, variant, key, value)}
                          swatchImage={
                            key === "color" ? product.colorSwatches?.[String(value)] : null
                          }
                          swatchHidden={
                            key === "color" &&
                            (product.hiddenSwatchColors ?? []).includes(String(value))
                          }
                        />
                      );
                    })}
                  </OptionRow>
                );
              })}
            </div>
          ) : null}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-mint p-2.5 text-xs font-semibold text-sage-ink transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
            >
              <span>Unsure of your shade? Send us a photo in daylight</span>
              <span className="shrink-0 font-bold">
                Free advice <span aria-hidden>→</span>
              </span>
              <span className="sr-only"> on WhatsApp (opens in a new tab)</span>
            </a>
          ) : null}

          {variant?.effectivePrice ? (
            <AddToBag
              variantId={variant.id}
              price={variant.effectivePrice}
              inStock={variant.inStock}
              onAdded={() => addedToBag(product.id)}
            />
          ) : null}

          {/* Under the buttons, each opening and closing, in smaller text; no delivery
              tab (owner, 2026-11-06). */}
          <InfoSections
            sections={[
              ...(descriptionHtml
                ? [
                    {
                      title: "Description",
                      body: (
                        <div
                          className="rich-text"
                          // Cleaned on the server (description-html.ts): only the editor's formatting.
                          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                        />
                      ),
                    },
                  ]
                : []),
              // The admin can switch the Details tab off for a product (owner, 2026-11-05).
              ...(product.showDetails === false
                ? []
                : [
                    {
                      title: "Details",
                      body: (
                        /* A tidy two-column table: one name column for every row, thin lines between rows,
                           light alternate shading, small text (owner, 2026-11-07). */
                        <dl className="overflow-hidden rounded-lg border border-line text-xs leading-snug sm:text-[0.8125rem]">
                          {detailRows([
                            ...Object.entries(product.attributes),
                            ...(variant
                              ? ([
                                  [
                                    "Length",
                                    variant.lengthInches === null
                                      ? null
                                      : `${variant.lengthInches} inch`,
                                  ],
                                  ["Colour", variant.color],
                                  ["Texture", variant.texture],
                                  [
                                    "Size",
                                    sizeKey(variant) === null ? null : sizeLabel(sizeKey(variant)!),
                                  ],
                                  [
                                    "Weight",
                                    variant.weightGrams === null
                                      ? null
                                      : `${variant.weightGrams} g`,
                                  ],
                                  ...Object.entries(variant.attributes),
                                ] as [string, string | null][])
                              : []),
                          ]).map(([name, value]) => (
                            <div
                              key={name}
                              className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] border-b border-line last:border-b-0 odd:bg-sand/60"
                            >
                              {/* Name in bold, value light (owner, 2026-11-03). */}
                              <dt className="border-r border-line px-3 py-2 font-semibold break-words text-deep">
                                {name}
                              </dt>
                              <dd className="px-3 py-2 break-words text-muted">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      ),
                    },
                  ]),
            ]}
          />

          <ul className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4 text-sm text-muted">
            {deliveryPoints(freeShippingThreshold).map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span aria-hidden className="text-gold">
                  ✦
                </span>
                {point}
              </li>
            ))}
          </ul>
          {/* The policies, linked (the Delivery & exchange tab is gone, owner 2026-11-06). */}
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Link
              href="/shipping"
              className="underline decoration-gold underline-offset-4 hover:decoration-deep"
            >
              Shipping details
            </Link>
            <Link
              href="/returns"
              className="underline decoration-gold underline-offset-4 hover:decoration-deep"
            >
              Exchange policy
            </Link>
          </p>
          {variant ? <p className="mt-3 text-xs text-muted">SKU: {variant.sku}</p> : null}
        </div>
      </div>
    </>
  );
}

function OptionRow({
  label,
  current,
  icon,
  children,
}: {
  label: string;
  current: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-sm">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">
          {icon ? <>{icon} </> : null}
          {label}:{" "}
        </span>
        <span className="font-bold">{current}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * The product's information under the buttons (owner, 2026-11-06): each
 * section a native `<details>`, so it opens with a click or the keyboard,
 * without JavaScript, and with the browser's find. The first starts open.
 * Every section's text is in the page, so search engines read it all.
 */
function InfoSections({ sections }: { sections: { title: string; body: ReactNode }[] }) {
  if (sections.length === 0) return null;
  return (
    <div className="mt-5 divide-y divide-line border-y border-line">
      {sections.map((section, i) => (
        <details key={section.title} open={i === 0} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-bold text-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep [&::-webkit-details-marker]:hidden">
            {section.title}
            <span
              aria-hidden
              className="text-lg leading-none font-light text-muted transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="pb-4 text-[0.8125rem] leading-relaxed text-muted sm:text-sm">
            {section.body}
          </div>
        </details>
      ))}
    </div>
  );
}
