import Image from "next/image";
import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { routes } from "@/components/layout/nav";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard, productHref } from "@/components/product/product-card";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { PriceRange } from "@/components/ui/display";
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
import { Marquee } from "@/components/motion/marquee";
import { story } from "@/content/about";
import { getFaqs } from "@/lib/api/faqs";
import { faqJsonLd } from "./content";
import { FaqAccordion } from "./faq-accordion";
import { storyImage } from "./home-images";
import { ProductTabs } from "./product-tabs";
import { ProductRing } from "./product-ring";
import { HOME_REVIEW_COUNT } from "@/lib/home/bounce-cards";
import { ReviewBounceCards } from "./review-bounce-cards";
import { BestSellerColumns } from "./best-seller-columns";
import { MIN_RING_ITEMS } from "@/lib/home/ring";
import { SectionHeader } from "./section-header";
import { ConcernSpotlight } from "./concern-spotlight";
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
      // Full width and clipped sideways: the small cards hang past the box's edge (owner,
      // 2026-11-23) without ever widening the page.
      className="scroll-mt-28 overflow-x-clip py-10 pb-16"
    >
      <div className={shell}>
        {/* A spotlight slider (owner, 2026-11-23, after MDJAmin's sample): the current concern
            fills the box, the next ones wait as small cards on the right. */}
        <ConcernSpotlight
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
            const large = concern.image?.large ?? photos[i]?.image?.large ?? null;
            const photo = concernPhoto(concern, photos[i]?.image ?? null);
            return {
              key: concern.id,
              title: concern.title,
              line: concern.line,
              href: routes.concern(concern.slug),
              photo: photo && large ? { src: large, alt: photo.alt } : photo,
              shops: concern.categories.map((c) => c.name).join(", "),
            };
          })}
        />
      </div>
    </section>
  );
}

// ── Our promise (a running strip) ───────────────────────────────────────

/**
 * What sets the shop apart, in the owner's words (2026-11-23: "No out
 * sourcing, No middle man, Directly from factory, 15+ years of crafting
 * expertise"), rephrased and running by endlessly like the strip above the
 * header, just under Shop by concern.
 */
export const promiseItems = [
  "Crafted in our own workshop, never outsourced",
  "No middlemen, just honest prices",
  "Straight from our factory to you",
  "15+ years of hair-crafting expertise",
];

export function PromiseStrip() {
  return (
    <Marquee
      items={promiseItems}
      label="Why HairCraft"
      repeat={2}
      speedSeconds={36}
      className="bg-deep py-2.5 text-white sm:py-3"
      itemClassName="text-[0.7rem] font-semibold tracking-wide uppercase sm:text-sm sm:tracking-wider"
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

/**
 * A product on the ring, as in the owner's sample (2026-11-23): the photo
 * only, with the name and price over its foot. The whole panel opens the product.
 */
function RingPanel({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={productHref(product.slug)}
      className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-sand shadow-[0_18px_40px_-18px_rgb(11_41_26/0.45)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      {product.image ? (
        <Image
          src={product.image.medium}
          alt={product.imageAlt ?? product.name}
          fill
          sizes="(min-width: 1024px) 22rem, 46vw"
          className="object-cover"
        />
      ) : (
        <PhotoPlaceholder />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/35 to-transparent px-3 pt-12 pb-3 text-white sm:px-4 sm:pb-4">
        <h3 className="line-clamp-2 font-display text-sm leading-tight font-semibold sm:text-lg">
          {product.name}
        </h3>
        <PriceRange
          min={product.priceRange.min}
          max={product.priceRange.max}
          className="mt-1 block text-xs text-white/90! sm:text-sm"
        />
      </div>
    </Link>
  );
}

/**
 * A 3D ring you drag to spin (owner, 2026-11-23), or with fewer than 3 products
 * (a ring needs 3) the plain row: four columns on desktop, sideways on phones.
 */
function ProductRow({ products, label }: { products: ProductCardData[]; label: string }) {
  if (products.length >= MIN_RING_ITEMS)
    return (
      <ProductRing
        label={label}
        items={products.map((product) => ({
          key: product.id,
          node: <RingPanel product={product} />,
        }))}
      />
    );
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
  // Five tall columns, as in the owner's sample (2026-11-23).
  const products = await load(() => getBestSellers(5));
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
      <BestSellerColumns products={products.slice(0, 5)} />
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
          ? [
              {
                key: "rated",
                label: "Best rated",
                panel: <ProductRow products={data.rated} label="Best rated" />,
              },
            ]
          : []),
        {
          key: "new",
          label: "New arrivals",
          panel: <ProductRow products={data.newest} label="New arrivals" />,
        },
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

/**
 * Real reviews as React Bits' Bounce Cards (owner, 2026-11-23): up to 8
 * reviews chosen by the admin, else by the API (5-star, saying something,
 * photos first), in a fanned stack that bounces in; each shows its photo, and
 * clicking one flips it over to the review. Hidden when there are no reviews: never invented quotes.
 */
export async function TestimonialsSection() {
  const featured = (await load(() => getFeaturedReviews(HOME_REVIEW_COUNT))) ?? [];
  if (featured.length === 0) return null;
  return (
    <section aria-labelledby="reviews-heading" className={`${shell} overflow-x-clip py-14`}>
      <div className="text-center">
        <h2 id="reviews-heading" className="font-display text-3xl font-semibold sm:text-4xl">
          Loved by women like you
        </h2>
        <p className="mt-2 text-muted">What customers say about HairCraft, in their own words.</p>
      </div>
      <ReviewBounceCards reviews={featured.slice(0, HOME_REVIEW_COUNT)} />
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
