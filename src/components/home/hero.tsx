import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { routes } from "@/components/layout/nav";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { productHref } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { PriceRange } from "@/components/ui/display";
import { getBestRated, getNewArrivals } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { settings } from "@/lib/env";
import { brandPromises, type BrandPromise } from "./copy";
import { heroImage } from "./home-images";

const icons: Record<BrandPromise["icon"], ReactNode> = {
  hair: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />,
  truck: (
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  ),
  lock: <path d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3" />,
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
};

export function PromiseIcon({
  icon,
  className,
}: {
  icon: BrandPromise["icon"];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {icons[icon]}
    </svg>
  );
}

/** The floating card on the hero photo: the best-rated product (or the newest). Hidden if none. */
async function HeroPick() {
  let product;
  try {
    product = (await getBestRated(1))[0] ?? (await getNewArrivals(1))[0];
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
  if (!product) return null;
  return (
    <Link
      href={productHref(product.slug)}
      className="group absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep sm:inset-x-5 sm:bottom-5 sm:p-4"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-sand">
          {product.image ? (
            <Image
              src={product.image.thumbnail}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <PhotoPlaceholder size="small" />
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{product.name}</span>
          <PriceRange
            min={product.priceRange.min}
            max={product.priceRange.max}
            className="text-sm font-bold"
          />
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-deep px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-deep-hover">
        Quick view
      </span>
    </Link>
  );
}

/**
 * Two columns on desktop: the words, buttons and three promise badges on the
 * left; the fixed hero photo (home-images.ts) on the right, with a tag and a
 * floating card for a real product. The words rise in with CSS, so they are
 * visible at once.
 */
export function Hero() {
  const badges = brandPromises(settings().freeShippingThreshold).slice(0, 3);
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-6 text-center lg:col-span-7 lg:text-left">
          <p className="hc-rise mx-auto inline-flex w-fit items-center gap-2 rounded-full bg-sage px-3.5 py-1 text-xs font-semibold text-sage-ink shadow-sm lg:mx-0">
            <span aria-hidden className="font-bold text-gold">
              ✦
            </span>
            Premium 100% human hair extensions
          </p>
          <h1 className="hc-rise hc-delay font-display text-[1.875rem] leading-[1.12] font-semibold tracking-tight sm:text-[2.5rem]">
            Hair extensions, crafted for <em className="text-gold-ink">confidence.</em>
          </h1>
          <p className="hc-rise hc-delay-2 mx-auto max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
            Clip-ins, toppers, wigs and ponytails in 100% human hair. Every length, colour and
            texture, made to feel like your own.
          </p>
          <div className="hc-rise hc-delay-3 flex flex-wrap justify-center gap-3 pt-1 lg:justify-start">
            <ButtonLink href={routes.shop} size="lg">
              Shop the collection
              <span aria-hidden>→</span>
            </ButtonLink>
            <ButtonLink href="#match" size="lg" variant="secondary">
              <span aria-hidden className="text-gold">
                ✦
              </span>
              Find my match
            </ButtonLink>
          </div>
          <ul className="grid max-w-xl gap-3 pt-4 text-left sm:grid-cols-3 lg:max-w-[36rem]">
            {badges.map((badge) => (
              <li
                key={badge.title}
                className="flex items-center gap-2.5 rounded-xl bg-white/80 p-2.5 shadow-sm backdrop-blur-sm"
              >
                <PromiseIcon
                  icon={badge.icon}
                  className={badge.icon === "hair" ? "shrink-0 text-gold" : "shrink-0 text-deep"}
                />
                <span className="flex flex-col">
                  <span className="text-xs font-bold">{badge.title}</span>
                  <span className="text-[0.7rem] text-muted">{badge.short}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="relative aspect-[4/5] max-h-[35rem] w-full overflow-hidden rounded-3xl bg-sand shadow-xl">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              priority
              sizes="(min-width: 1024px) 30rem, 90vw"
              className="hc-settle object-cover"
            />
            <p className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md sm:top-5 sm:left-5">
              <span aria-hidden className="size-2 rounded-full bg-gold" />
              100% human hair
            </p>
            <Suspense fallback={null}>
              <HeroPick />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
