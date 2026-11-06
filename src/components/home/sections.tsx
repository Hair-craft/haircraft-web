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
  getBestSellers,
  getCategories,
  getCategoryPhoto,
  getConcerns,
  getNewArrivals,
  getFeaturedReviews,
} from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { ConsultBanner } from "@/components/layout/consult-banner";
import { story } from "@/content/about";
import { getFaqs } from "@/lib/api/faqs";
import { faqJsonLd } from "./content";
import { FaqAccordion } from "./faq-accordion";
import { storyImage } from "./home-images";
import { ProductTabs } from "./product-tabs";
import { SectionHeader } from "./section-header";
import { ConcernCarousel } from "./concern-carousel";
import { concernPhoto } from "./concerns";

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

// ── Shop by concern ─────────────────────────────────────────────────────

/**
 * What a shopper wants to change, each leading to a category (owner,
 * 2026-11-03). The cards, their order and the heading come from the admin
 * (Catalog → Shop by concern). A card without its own photo shows its
 * category's. Hidden when nothing is shown (or the API is down).
 */
export async function ConcernSection() {
  const data = await load(async () => {
    const section = await getConcerns();
    // The category photo, only for cards without their own.
    const photos = await Promise.all(
      section.items.map((concern) =>
        concern.image
          ? null
          : getCategoryPhoto(concern.categories[0].slug).catch((error: unknown) => {
              if (isApiError(error)) return null;
              throw error;
            }),
      ),
    );
    return { section, photos };
  });
  if (!data || data.section.items.length === 0) return null;
  const { section, photos } = data;
  return (
    <section
      id="concerns"
      aria-labelledby="concerns-heading"
      className={`${shell} scroll-mt-28 py-10`}
    >
      {/* Wide, tall cards (owner, 2026-11-03) in a slider that moves on by itself on desktop
          and slides by hand everywhere (owner, 2026-11-04): three in view on desktop, two on
          tablets, one large card on phones (the next one peeks in). On phones the heading and
          row stay pinned while scrolling slides the cards past (owner, 2026-11-04). */}
      <ConcernCarousel
        label="Concerns"
        header={
          <SectionHeader
            id="concerns-heading"
            align="left"
            eyebrow="Shop by concern"
            title={section.heading}
            intro={section.intro || undefined}
            className="mb-8 max-w-3xl"
          />
        }
        items={section.items.map((concern, i) => {
          const photo = concernPhoto(concern, photos[i]?.image ?? null);
          return {
            key: concern.id,
            node: (
              <Reveal delay={Math.min(i, 7) * 0.06} className="h-full">
                <Link
                  href={routes.concern(concern.slug)}
                  className="hc-card group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
                >
                  <span className="relative block aspect-[4/5] w-full overflow-hidden bg-sand">
                    <span aria-hidden className="hc-sheen z-[1]" />
                    {photo ? (
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 78vw"
                        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.06]"
                      />
                    ) : null}
                  </span>
                  {/* A slim white strip under the photo: a bigger title, no "Shop now" (the
                      whole card is the link) (owner, 2026-11-05). */}
                  <span className="flex flex-1 flex-col gap-0.5 px-4 py-2.5 sm:px-5 sm:py-3">
                    <h3 className="text-lg leading-snug font-semibold transition-colors group-hover:text-gold-ink sm:text-[1.375rem]">
                      {concern.title}
                    </h3>
                    {concern.line ? (
                      <span className="line-clamp-1 text-sm text-muted">{concern.line}</span>
                    ) : null}
                    <span className="sr-only">
                      Shop {concern.categories.map((c) => c.name).join(", ")}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ),
          };
        })}
      />
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
    // `overflow-y-hidden`: cards waiting to fade up sit a little lower; without it the row also
    // scrolled up and down inside itself, catching the finger on phones (owner, 2026-11-04).
    <ul
      data-reveal-row
      className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((product, i) => (
        <li key={product.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
          <Reveal delay={Math.min(i, 7) * 0.08} className="h-full">
            <ProductCard product={product} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

/**
 * Products ticked "Best seller" in the admin (owner, 2026-11-03). Hidden when
 * none are ticked (or the API is down): never an empty or invented list.
 */
export async function BestSellersSection() {
  const products = await load(() => getBestSellers(8));
  if (!products || products.length === 0) return null;
  return (
    <section aria-labelledby="bestsellers-heading" className={`${shell} py-10`}>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <SectionHeader
          id="bestsellers-heading"
          align="left"
          eyebrow="Best sellers"
          title="Our best sellers"
        />
        <ViewAll href={routes.shop} label="View all products" />
      </div>
      <ProductRow products={products} />
    </section>
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
        title="Customer favourites"
      />
      {data === null ? (
        <ApiUnavailable />
      ) : (
        <>
          <ProductTabs tabs={tabs} label="Customer favourites" />
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

// ── WhatsApp advice ─────────────────────────────────────────────────────

export function ConsultSection() {
  return (
    <div className={`${shell} py-10`}>
      <ConsultBanner headingId="consult-heading" />
    </div>
  );
}

// ── Our story ───────────────────────────────────────────────────────────

/**
 * The story's photo on the left (whole, uncropped) and its words on the
 * right (owner, 2026-11-05); on phones the photo comes first. The words are
 * the story's opening, cut off after three lines; the rest is on /about.
 */
export function StorySection() {
  return (
    <section
      aria-labelledby="story-heading"
      className={`${shell} grid items-center gap-8 py-10 sm:grid-cols-[minmax(0,22rem)_1fr] sm:gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16`}
    >
      {/* The photo's own 3:4 shape, so the whole picture shows uncropped. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand shadow-sm">
        <Image
          src={storyImage.src}
          alt={storyImage.alt}
          fill
          sizes="(min-width: 1024px) 26rem, (min-width: 640px) 22rem, 92vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-[0.65rem] font-bold tracking-[0.2em] text-gold-ink uppercase">
          Our story
        </p>
        <h2
          id="story-heading"
          className="font-display text-3xl leading-tight font-semibold sm:text-4xl"
        >
          Crafted for the way <em className="text-gold-ink">you</em> wear your hair.
        </h2>
        {/* The story's opening, cut off after three lines; the rest is on /about. */}
        <p className="line-clamp-3 max-w-xl leading-relaxed text-muted">{story.paragraphs[0]}</p>
        <Link
          href="/about"
          className="w-fit font-semibold underline decoration-gold underline-offset-4 hover:decoration-deep"
        >
          Read our story
        </Link>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────

/**
 * Under the story (owner, 2026-11-05): the questions ticked for the home
 * page in the admin (Catalog → FAQs), with "See all questions" for /faq.
 * The shop's own questions are shown when the API can't be reached.
 */
export async function FaqSection() {
  const shown = (await getFaqs()).home;
  if (shown.length === 0) return null;
  return (
    <section
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-3xl px-4 py-10 pb-20 sm:px-6"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(shown)).replace(/</g, "\\u003c"),
        }}
      />
      <h2 id="faq-heading" className="text-center font-display text-2xl font-semibold sm:text-3xl">
        Frequently asked questions
      </h2>
      <FaqAccordion faqs={shown} />
      <p className="mt-6 text-center">
        <Link
          href="/faq"
          className="font-semibold underline decoration-gold underline-offset-4 hover:decoration-deep"
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
