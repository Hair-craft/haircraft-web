"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useCart } from "@/components/cart/cart-context";
import { AddToBag } from "@/components/cart/cart-ui";
import { swatchFor } from "@/components/home/match";
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
  galleryFor,
  pick,
  pickerAxes,
  saving,
  shopVariants,
  sizeKey,
  sizeLabel,
  valueLabel,
  valueOf,
} from "@/lib/product/variants";
import { RichText } from "@/components/info/rich-text";
import { deliveryAndReturns, deliveryPoints, productPromises } from "./content";
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

  // A sub-variant's main variant's photos count as its own.
  const images = galleryFor(product.images, variant?.id, variant?.parentVariantId);
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
            <Gallery key={variant?.id ?? "none"} images={images} name={product.name} />
          </div>
          <ul className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3">
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
            <h1 className="font-display text-3xl leading-tight font-semibold sm:text-[2rem]">
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

          {product.headline ? (
            <p className="mt-5 text-lg leading-snug font-bold text-deep">{product.headline}</p>
          ) : null}
          {product.shortDescription ? (
            <p className={cx("leading-relaxed text-muted", product.headline ? "mt-2" : "mt-5")}>
              {product.shortDescription}
            </p>
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
                    current={current === null ? "" : valueLabel(key, current)}
                  >
                    {values.map((value) => {
                      const target = pick(options, variant, key, value);
                      const status = choiceStatus(options, variant, key, value);
                      const chosen = value === current;
                      return (
                        <a
                          key={String(value)}
                          href={variantHref(product.slug, target)}
                          onClick={(event) => choose(event, target)}
                          aria-current={chosen || undefined}
                          className={cx(
                            "inline-flex h-10 min-w-12 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep",
                            chosen
                              ? "border-deep bg-deep text-white shadow-sm"
                              : status === "elsewhere"
                                ? "border-dashed border-deep/30 bg-transparent text-muted hover:border-deep/60"
                                : "border-transparent bg-sand hover:bg-sand-deep",
                            status === "soldout" && "line-through decoration-1",
                          )}
                        >
                          {key === "color" ? (
                            <span
                              aria-hidden
                              className="size-4 rounded-full ring-1 ring-black/15"
                              style={{ background: swatchFor(String(value)) }}
                            />
                          ) : null}
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
          {variant ? <p className="mt-3 text-xs text-muted">SKU: {variant.sku}</p> : null}
        </div>
      </div>

      <InfoTabs
        tabs={[
          ...(product.description
            ? [
                {
                  title: "Description",
                  body: product.description
                    .split(/\n\s*\n|\n/)
                    .filter((p) => p.trim())
                    .map((paragraph, i) => (
                      <p key={i} className="mt-3 first:mt-0">
                        {paragraph}
                      </p>
                    )),
                },
              ]
            : []),
          {
            title: "Details",
            body: (
              <dl className="grid max-w-2xl grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                {detailRows([
                  ...Object.entries(product.attributes),
                  ...(variant
                    ? ([
                        [
                          "Length",
                          variant.lengthInches === null ? null : `${variant.lengthInches} inch`,
                        ],
                        ["Colour", variant.color],
                        ["Texture", variant.texture],
                        ["Size", sizeKey(variant) === null ? null : sizeLabel(sizeKey(variant)!)],
                        [
                          "Weight",
                          variant.weightGrams === null ? null : `${variant.weightGrams} g`,
                        ],
                        ...Object.entries(variant.attributes),
                      ] as [string, string | null][])
                    : []),
                ]).map(([name, value]) => (
                  <div key={name} className="contents">
                    <dt className="rounded-l-lg bg-sand py-2.5 pl-3 text-muted">{name}</dt>
                    <dd className="rounded-r-lg bg-sand py-2.5 pr-3 font-bold text-deep">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ),
          },
          {
            title: "Delivery & exchange",
            body: deliveryAndReturns.map((paragraph) => (
              <p key={paragraph} className="mt-3 first:mt-0">
                <RichText text={paragraph} />
              </p>
            )),
          },
        ]}
      />
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
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">{label}: </span>
        <span className="font-bold">{current}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/**
 * The product's information as tabs (the design's "information suite"): a
 * bar of tab buttons over one panel. Arrow keys, Home and End move between
 * tabs (the WAI tabs pattern). All panels are in the page, the others
 * hidden, so search engines read every one.
 */
function InfoTabs({ tabs }: { tabs: { title: string; body: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (i: number) => {
    setActive(i);
    buttons.current[i]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const last = tabs.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key]);
  };
  return (
    <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(11,41,26,0.04)]">
      <div
        role="tablist"
        aria-label="Product information"
        onKeyDown={onKeyDown}
        className="flex gap-2 overflow-x-auto bg-sand px-4 sm:px-6"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.title}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cx(
              "border-b-2 px-4 py-4 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-deep",
              i === active
                ? "border-deep font-bold text-deep"
                : "border-transparent text-muted hover:text-deep",
            )}
          >
            {tab.title}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.title}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          hidden={i !== active}
          className="p-6 leading-relaxed text-muted lg:p-8"
        >
          {tab.body}
        </div>
      ))}
    </div>
  );
}
