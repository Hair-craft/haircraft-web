import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ApiUnavailable } from "@/components/api-unavailable";
import { routes } from "@/components/layout/nav";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard, productHref } from "@/components/product/product-card";
import { RatingStars } from "@/components/product/rating-stars";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/display";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  getBestRated,
  getCategories,
  getCategoryPhoto,
  getNewArrivals,
  getFeaturedReviews,
} from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { faqJsonLd, faqs, trustPoints, whyCards } from "./content";
import { story } from "@/content/about";
import { brandPromises, type BrandPromise } from "./copy";
import { FaqAccordion } from "./faq-accordion";
import { ProductTabs } from "./product-tabs";
import { RangeExplorer, type RangeItem } from "./range-explorer";
import { SectionHeader } from "./section-header";
import { WhyStack } from "./why-stack";

/** Runs a section's data loading; an API outage becomes `null` (the section shows a calm message). */
async function load<T>(work: () => Promise<T>): Promise<T | null> {
  try {
    return await work();
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}

const shell = "mx-auto w-full max-w-7xl px-4 sm:px-6";
const photo = (product: ProductCardData | null | undefined) =>
  product?.image ? { src: product.image.large, alt: product.imageAlt ?? product.name } : null;

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium tracking-[0.25em] uppercase hover:underline focus-visible:outline-2 focus-visible:outline-deep"
    >
      {label}
      <ChevronRightIcon width={14} height={14} />
    </Link>
  );
}

// ── Trust marquee ───────────────────────────────────────────────────────

export function TrustMarquee() {
  return (
    <Marquee
      label="Why customers choose HairCraft"
      items={trustPoints}
      repeat={2}
      className="border-y border-deep/10 bg-[#f6efe4] py-4"
      itemClassName="font-display text-xl italic text-deep/80 sm:text-2xl"
      speedSeconds={55}
    />
  );
}

// ── Shop by category ────────────────────────────────────────────────────

async function categoriesWithPhotos() {
  const categories = await getCategories();
  // One small (cached) call per top-level category for its photo.
  const photos = await Promise.all(categories.map((category) => getCategoryPhoto(category.slug)));
  return categories.map((category, i) => ({ category, photo: photos[i] }));
}

export async function CategorySection() {
  const data = await load(categoriesWithPhotos);
  return (
    <section aria-labelledby="categories-heading" className={`${shell} py-20`}>
      <SectionHeader
        id="categories-heading"
        eyebrow="Find your perfect match"
        title="Shop by category"
      />
      {data === null ? (
        <ApiUnavailable />
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {data.map(({ category, photo: cover }, i) => (
            <li key={category.id}>
              <Reveal delay={i * 0.08}>
                <Link
                  href={routes.category(category.slug)}
                  className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-deep text-mint focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep sm:aspect-[4/5]"
                >
                  {cover?.image ? (
                    <Image
                      src={cover.image.medium}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 48vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  ) : null}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/20 to-transparent"
                  />
                  <div className="relative p-4 sm:p-6">
                    <h3 className="font-display text-xl sm:text-3xl">{category.name}</h3>
                    {category.description ? (
                      <p className="mt-1 hidden text-sm text-mint/85 sm:line-clamp-2">
                        {category.description}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs tracking-[0.2em] text-gold-light uppercase">
                      {category.productCount} {category.productCount === 1 ? "product" : "products"}
                      <ChevronRightIcon
                        width={14}
                        height={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Most loved (tabs) ───────────────────────────────────────────────────

/** Cards in centred rows on desktop (a short list stays centred); a row that scrolls sideways on phones (the next card peeks in). */
function ProductRow({ products }: { products: ProductCardData[] }) {
  return (
    // `relative` keeps the row's overflow inside it: without it, phone browsers widen the whole page.
    <ul className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
      {products.map((product) => (
        <li
          key={product.id}
          className="w-[70%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]"
        >
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export async function MostLovedSection() {
  const data = await load(async () => {
    const [rated, newest] = await Promise.all([getBestRated(4), getNewArrivals(8)]);
    return { rated, newest };
  });
  const tabs = data
    ? [
        ...(data.rated.length > 0
          ? [{ key: "rated", label: "Best rated", panel: <ProductRow products={data.rated} /> }]
          : []),
        { key: "new", label: "New arrivals", panel: <ProductRow products={data.newest} /> },
      ]
    : [];
  return (
    <section aria-labelledby="loved-heading" className="bg-white/60 py-20">
      <div className={shell}>
        <SectionHeader
          id="loved-heading"
          eyebrow="Customer favourites"
          title="Most loved hair extensions"
        />
        {data === null ? (
          <ApiUnavailable />
        ) : (
          <>
            <ProductTabs tabs={tabs} label="Most loved hair extensions" />
            <div className="mt-6 text-center">
              <ViewAll href={routes.shop} label="View all" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Why HairCraft (stacking cards) ──────────────────────────────────────

export async function WhySection() {
  const products = (await load(() => getNewArrivals(8))) ?? [];
  const photos = products.map(photo).filter((p): p is NonNullable<typeof p> => p !== null);
  const cards = whyCards.map((card, i) => ({
    ...card,
    image: photos.length > 0 ? photos[i % photos.length] : null,
  }));
  return (
    <section aria-labelledby="why-heading" className={`${shell} py-20`}>
      <SectionHeader
        id="why-heading"
        eyebrow="Made for real life"
        title="Why women choose HairCraft"
      />
      <WhyStack cards={cards} />
    </section>
  );
}

// ── Range explorer ──────────────────────────────────────────────────────

export async function RangeSection() {
  const data = await load(categoriesWithPhotos);
  if (!data || data.length === 0) return null;
  const items: RangeItem[] = data.map(({ category, photo: cover }) => ({
    name: category.name,
    href: routes.category(category.slug),
    description: category.description,
    productCount: category.productCount,
    image: photo(cover),
  }));
  return (
    <section aria-labelledby="range-heading" className={`${shell} py-20`}>
      <SectionHeader
        id="range-heading"
        eyebrow="Be your own hair stylist"
        title="Explore our range"
        intro="From a quick clip-in to a full wig: choose the look, the length and the feel."
      />
      <RangeExplorer items={items} />
    </section>
  );
}

// ── Icon row ────────────────────────────────────────────────────────────

const promiseIcons: Record<BrandPromise["icon"], ReactNode> = {
  hair: <path d="M7 21c0-6 2-9 5-12m5 12c0-7-1-11-5-14M12 7c-2-2-5-3-7-2m7 2c2-2 5-3 7-2" />,
  truck: (
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  ),
  lock: <path d="M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3" />,
  chat: <path d="M4 5h16v11H9l-5 4V5Z" />,
};

export function PromiseStrip({ freeShippingThreshold }: { freeShippingThreshold: string | null }) {
  return (
    <section aria-label="Our promises" className="border-y border-deep/10">
      <ul className={`${shell} grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
        {brandPromises(freeShippingThreshold).map((promise, i) => (
          <li key={promise.title}>
            <Reveal delay={i * 0.06} className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-mint-deep text-deep">
                <svg
                  viewBox="0 0 24 24"
                  width={24}
                  height={24}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {promiseIcons[promise.icon]}
                </svg>
              </span>
              <h3 className="font-medium">{promise.title}</h3>
              <p className="max-w-56 text-sm text-deep/70">{promise.text}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Our story ───────────────────────────────────────────────────────────

/** HairCraft's story (shared with /about, src/content/about.ts). */
export async function StorySection() {
  const products = (await load(() => getNewArrivals(8))) ?? [];
  const cover = photo(products.find((p) => p.image) ?? null);
  return (
    <section aria-labelledby="story-heading" className="bg-[#f6efe4]">
      <div className={`${shell} grid items-center gap-10 py-20 lg:grid-cols-2 lg:gap-20`}>
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-mint-deep lg:aspect-[5/6]">
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 92vw"
              className="object-cover"
            />
          ) : null}
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">Our story</p>
          <h2 id="story-heading" className="mt-3 font-display text-4xl leading-tight md:text-5xl">
            Crafted for the way <em className="text-gold-ink">you</em> wear your hair
          </h2>
          {story.paragraphs.map((paragraph, i) => (
            <p
              key={paragraph}
              className={`${i === 0 ? "mt-6" : "mt-4"} leading-relaxed text-deep/75`}
            >
              {paragraph}
            </p>
          ))}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href={routes.shop} variant="secondary">
              Discover the collection
            </ButtonLink>
            <Link
              href="/about"
              className="font-medium underline decoration-gold underline-offset-4 hover:decoration-deep"
            >
              Read our story
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Testimonials ────────────────────────────────────────────────────────

/**
 * The three most relevant real reviews (chosen by the API: approved 5-star
 * reviews with words, photos first); hidden when there are none (never
 * invented quotes).
 */
export async function TestimonialsSection() {
  const testimonials = (await load(() => getFeaturedReviews(3))) ?? [];
  if (testimonials.length === 0) return null;
  return (
    <section aria-labelledby="reviews-heading" className={`${shell} py-20`}>
      <SectionHeader
        id="reviews-heading"
        eyebrow="Real customers, real reviews"
        title="Loved by women like you"
      />
      <ul className="relative -mx-4 mt-12 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {testimonials.map(({ review, product }, i) => (
          <li
            key={review.id}
            className="w-[82%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)]"
          >
            <Reveal delay={Math.min(i, 3) * 0.08} className="h-full">
              {/* A card with a photo is the photo, edge to edge and full height,
                  with the words over a dark fade at the bottom. */}
              <figure
                className={`relative flex h-full min-h-[30rem] flex-col justify-end gap-4 overflow-hidden rounded-[1.75rem] p-7 shadow-sm ring-1 ring-deep/5 ${
                  review.photos[0] ? "bg-deep text-white" : "bg-white"
                }`}
              >
                {review.photos[0] ? (
                  <>
                    <Image
                      src={review.photos[0].urls.large}
                      alt={`Photo by ${review.reviewerName} of ${product.name}`}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw"
                      className="object-cover object-top"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-45% to-transparent to-70%"
                    />
                  </>
                ) : null}
                <RatingStars
                  rating={review.rating}
                  reviewCount={1}
                  className="relative [&>span:last-child]:hidden"
                />
                <blockquote className={`relative ${review.photos[0] ? "" : "flex-1"}`}>
                  {review.title ? (
                    <p className="font-display text-2xl leading-snug">“{review.title}”</p>
                  ) : null}
                  {review.body ? (
                    <p
                      className={`mt-2 ${review.photos[0] ? "line-clamp-3 text-white/90" : "line-clamp-5 text-deep/75"}`}
                    >
                      {review.body}
                    </p>
                  ) : null}
                </blockquote>
                <figcaption className="relative text-sm">
                  <span className="font-medium">{review.reviewerName}</span>
                  {review.verifiedPurchase ? (
                    <span className={review.photos[0] ? "text-white/80" : "text-deep/70"}>
                      {" "}
                      · Verified purchase
                    </span>
                  ) : null}
                  <Link
                    href={productHref(product.slug)}
                    className={`mt-1 block hover:underline ${
                      review.photos[0]
                        ? "text-white/80 hover:text-white"
                        : "text-deep/70 hover:text-deep"
                    }`}
                  >
                    {product.name}
                  </Link>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────

export function FaqSection() {
  return (
    <section aria-labelledby="faq-heading" className={`${shell} pt-10 pb-24`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(faqs)).replace(/</g, "\\u003c"),
        }}
      />
      <SectionHeader id="faq-heading" eyebrow="Good to know" title="Frequently asked questions" />
      <FaqAccordion faqs={faqs} />
      <p className="mt-8 text-center">
        <Link
          href="/faq"
          className="font-medium underline decoration-gold underline-offset-4 hover:decoration-deep"
        >
          See all questions
        </Link>
      </p>
    </section>
  );
}

// ── Loading placeholders ────────────────────────────────────────────────

export function SectionSkeleton({ title, tall = false }: { title: string; tall?: boolean }) {
  return (
    <section aria-busy="true" className={`${shell} py-20`}>
      <h2 className="text-center font-display text-4xl md:text-5xl">{title}</h2>
      <span className="sr-only">Loading…</span>
      <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={i > 1 ? "hidden lg:block" : undefined}>
            <Skeleton className="aspect-[4/5] rounded-[1.75rem]" />
            {tall ? null : (
              <>
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
