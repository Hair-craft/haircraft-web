import Image from "next/image";
import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { routes } from "@/components/layout/nav";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard, productHref } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/display";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  getBestRated,
  getCategories,
  getCategoryPhoto,
  getFilterOptions,
  getNewArrivals,
  getFeaturedReviews,
} from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { story } from "@/content/about";
import { returnRules } from "@/content/returns-rules";
import { ConsultBanner } from "@/components/layout/consult-banner";
import { faqJsonLd, faqs, whyCards } from "./content";
import { FaqAccordion } from "./faq-accordion";
import { PromiseIcon } from "./hero";
import { storyImage } from "./home-images";
import { ProductTabs } from "./product-tabs";
import { SectionHeader } from "./section-header";
import { ShadeMatcher } from "./shade-matcher";

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

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors hover:text-gold-ink focus-visible:outline-2 focus-visible:outline-deep"
    >
      {label}
      <ChevronRightIcon width={16} height={16} />
    </Link>
  );
}

// ── Find your match ─────────────────────────────────────────────────────

/** At most this many choices per step (in the API's order). */
const MATCH_CHOICES = 6;

/** Goal (top-level categories), texture and shade, from the shop's real values. */
export async function MatchSection() {
  const data = await load(async () => {
    const [categories, options] = await Promise.all([getCategories(), getFilterOptions()]);
    return { categories, options };
  });
  if (!data) return null;
  const goals = data.categories
    .filter((category) => category.productCount > 0)
    .slice(0, 4)
    .map((category) => ({ slug: category.slug, label: category.name }));
  if (goals.length === 0) return null;
  return (
    <section id="match" aria-labelledby="match-heading" className={`${shell} scroll-mt-28 py-10`}>
      <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8 lg:p-10">
        <SectionHeader
          id="match-heading"
          align="left"
          eyebrow="Find your match"
          title="Find your hair extension match in seconds"
          intro="Tell us what you're looking for, and we'll show you the closest piece in our shop."
          className="mb-8 max-w-3xl"
        />
        <ShadeMatcher
          goals={goals}
          textures={data.options.textures.slice(0, MATCH_CHOICES)}
          colors={data.options.colors.slice(0, MATCH_CHOICES)}
        />
      </div>
    </section>
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
    <section aria-labelledby="categories-heading" className={`${shell} py-10`}>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          id="categories-heading"
          align="left"
          eyebrow="Curated collections"
          title="Shop by category"
        />
        <ViewAll href={routes.shop} label="View all products" />
      </div>
      {data === null ? (
        <ApiUnavailable />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {data.map(({ category, photo: cover }, i) => (
            <li key={category.id}>
              <Reveal delay={Math.min(i, 5) * 0.06} className="h-full">
                <Link
                  href={routes.category(category.slug)}
                  className="group flex h-full flex-col items-center rounded-2xl bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep sm:p-4"
                >
                  <span className="relative mb-3 block aspect-square w-full overflow-hidden rounded-xl bg-sand">
                    {cover?.image ? (
                      <Image
                        src={cover.image.medium}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 13vw, (min-width: 768px) 30vw, 45vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </span>
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-gold-ink">
                    {category.name}
                  </h3>
                  <span className="mt-0.5 text-xs text-muted">
                    {category.productCount} {category.productCount === 1 ? "item" : "items"}
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Bestsellers (tabs) ──────────────────────────────────────────────────

/** Four columns on desktop; a row that scrolls sideways on phones (the next card peeks in). */
function ProductRow({ products }: { products: ProductCardData[] }) {
  return (
    // `relative` keeps the row's overflow inside it: without it, phone browsers widen the whole page.
    <ul className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
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
    <section aria-labelledby="loved-heading" className={`${shell} py-10`}>
      <SectionHeader
        id="loved-heading"
        align="left"
        eyebrow="Most loved"
        title="Bestsellers & customer favourites"
      />
      {data === null ? (
        <ApiUnavailable />
      ) : (
        <>
          <ProductTabs tabs={tabs} label="Bestsellers and customer favourites" />
          <div className="mt-6 text-center">
            <ViewAll href={routes.shop} label="View all products" />
          </div>
        </>
      )}
    </section>
  );
}

// ── Review spotlight ────────────────────────────────────────────────────

function Star() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden fill="var(--gold)">
      <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
    </svg>
  );
}

/**
 * One real review, large (chosen by the API: an approved 5-star review that
 * says something, photos first), with its photo if it has one. Hidden when
 * there are no reviews: never invented quotes.
 */
export async function TestimonialsSection() {
  const featured = (await load(() => getFeaturedReviews(1))) ?? [];
  if (featured.length === 0) return null;
  const { review, product } = featured[0];
  const reviewPhoto = review.photos[0];
  return (
    <section aria-labelledby="reviews-heading" className={`${shell} py-10`}>
      <div className="grid items-center gap-8 rounded-3xl bg-white p-6 shadow-lg sm:p-8 lg:grid-cols-12 lg:p-12">
        <div className="flex flex-col gap-4 lg:col-span-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-sage px-3 py-1 text-[0.65rem] font-bold tracking-wider text-sage-ink uppercase">
            Real customers, real reviews
          </p>
          <h2 id="reviews-heading" className="font-display text-3xl font-semibold sm:text-4xl">
            Loved by women like you
          </h2>
          {reviewPhoto ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand shadow-sm">
              <Image
                src={reviewPhoto.urls.large}
                alt={`Photo by ${review.reviewerName} of ${product.name}`}
                fill
                sizes="(min-width: 1024px) 34rem, 90vw"
                className="object-cover"
              />
            </div>
          ) : (
            <p className="text-muted">What customers say about HairCraft, in their own words.</p>
          )}
        </div>
        <figure className="flex flex-col gap-6 rounded-2xl bg-sand p-6 shadow-sm sm:p-8 lg:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <span role="img" aria-label={`Rated ${review.rating} out of 5`} className="flex">
              {Array.from({ length: review.rating }, (_, i) => (
                <Star key={i} />
              ))}
            </span>
            {review.verifiedPurchase ? (
              <span className="rounded-full bg-sage px-3 py-1 text-[0.65rem] font-bold tracking-wider text-sage-ink uppercase">
                Verified buyer
              </span>
            ) : null}
          </div>
          <blockquote className="font-display text-xl leading-relaxed sm:text-2xl">
            {review.title ? <p className="font-semibold">“{review.title}”</p> : null}
            {review.body ? <p className="mt-2 line-clamp-6 italic">{review.body}</p> : null}
          </blockquote>
          <figcaption className="flex flex-wrap items-end justify-between gap-4">
            <span className="font-semibold">{review.reviewerName}</span>
            <span className="text-right">
              <span className="block text-xs text-muted">Product used</span>
              <Link
                href={productHref(product.slug)}
                className="text-sm font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-deep"
              >
                {product.name}
              </Link>
            </span>
          </figcaption>
          <ButtonLink href={productHref(product.slug)} className="w-full">
            Shop this look <span aria-hidden>→</span>
          </ButtonLink>
        </figure>
      </div>
    </section>
  );
}

// ── Why HairCraft ───────────────────────────────────────────────────────

/** One icon per "Why HairCraft" card, in the cards' order (src/components/home/content.ts). */
const whyIcons = [
  // Real hair: a sparkle.
  "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
  // Comfort: a heart.
  "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  // Shade and style: a palette.
  "M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.3-1.2-1.6-1.2-2.8 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7ZM7.5 11.5h.01M10 7.5h.01M15 7.5h.01",
  // Payments and delivery: a van.
  "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
];

export function WhySection() {
  return (
    <section aria-labelledby="why-heading" className={`${shell} py-10`}>
      <SectionHeader
        id="why-heading"
        eyebrow="The HairCraft promise"
        title="Why women choose HairCraft"
      />
      <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {whyCards.map((card, i) => (
          <li key={card.title}>
            <Reveal
              delay={i * 0.06}
              className="flex h-full flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-sage text-deep">
                <svg
                  viewBox="0 0 24 24"
                  width={22}
                  height={22}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={whyIcons[i % whyIcons.length]} />
                </svg>
              </span>
              <h3 className="font-display text-lg leading-snug font-semibold">{card.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{card.text}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── WhatsApp advice ─────────────────────────────────────────────────────

export function ConsultSection() {
  return (
    <div className={`${shell} py-10`}>
      <ConsultBanner headingId="consult-heading" />
    </div>
  );
}

// ── Our story and FAQ ───────────────────────────────────────────────────

/** HairCraft's story (shared with /about, src/content/about.ts) beside the short FAQ. */
export function StoryFaqSection() {
  return (
    <div className={`${shell} grid items-start gap-12 py-10 pb-20 lg:grid-cols-12`}>
      <section aria-labelledby="story-heading" className="flex flex-col gap-5 lg:col-span-5">
        <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-sand shadow-sm">
          <Image
            src={storyImage.src}
            alt={storyImage.alt}
            fill
            sizes="(min-width: 1024px) 30rem, 92vw"
            className="object-cover"
          />
        </div>
        <p className="text-[0.65rem] font-bold tracking-[0.2em] text-gold-ink uppercase">
          Our story
        </p>
        <h2
          id="story-heading"
          className="font-display text-3xl leading-tight font-semibold sm:text-4xl"
        >
          Crafted for the way <em className="text-gold-ink">you</em> wear your hair.
        </h2>
        {story.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
        <Link
          href="/returns"
          className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-deep"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-sage text-deep">
            <PromiseIcon icon="hair" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Exchange for defective items</span>
            <span className="text-xs text-muted">
              Within {returnRules.exchangeDays} days of delivery, if unused
            </span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          <ButtonLink href={routes.shop} variant="secondary">
            Discover the collection
          </ButtonLink>
          <Link
            href="/about"
            className="font-semibold underline decoration-gold underline-offset-4 hover:decoration-deep"
          >
            Read our story
          </Link>
        </div>
      </section>
      <section aria-labelledby="faq-heading" className="lg:col-span-7">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd(faqs)).replace(/</g, "\\u003c"),
          }}
        />
        <h2 id="faq-heading" className="font-display text-2xl font-semibold sm:text-3xl">
          Frequently asked questions
        </h2>
        <FaqAccordion faqs={faqs} />
        <p className="mt-6">
          <Link
            href="/faq"
            className="font-semibold underline decoration-gold underline-offset-4 hover:decoration-deep"
          >
            See all questions
          </Link>
        </p>
      </section>
    </div>
  );
}

// ── Loading placeholders ────────────────────────────────────────────────

export function SectionSkeleton({ title, tall = false }: { title: string; tall?: boolean }) {
  return (
    <section aria-busy="true" className={`${shell} py-10`}>
      <h2 className="font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
      <span className="sr-only">Loading…</span>
      <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={i > 1 ? "hidden lg:block" : undefined}>
            <Skeleton className="aspect-[4/5] rounded-2xl" />
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
