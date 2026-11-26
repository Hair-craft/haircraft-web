import Image from "next/image";
import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { routes } from "@/components/layout/nav";
import { Skeleton } from "@/components/ui/display";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  getBestSellers,
  getCategoryPhoto,
  getConcerns,
  getChosenNewArrivals,
  getFeaturedReviews,
} from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { ConsultBanner } from "@/components/layout/consult-banner";
import { Marquee } from "@/components/motion/marquee";
import { story } from "@/content/about";
import { getFaqs } from "@/lib/api/faqs";
import { getHomeContent } from "@/lib/api/home";
import { faqJsonLd } from "./content";
import { FaqAccordion } from "./faq-accordion";
import { storyImage } from "./home-images";
import { PhotoDeck } from "./photo-deck";
import { HOME_REVIEW_COUNT } from "@/lib/home/review-cards";
import { ReviewTiltCards } from "./review-tilt-cards";
import { BeforeAfter } from "./before-after";
import { BestSellerColumns } from "./best-seller-columns";
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
  "Exclusively Crafted In-House",
  "From Our Hands to Yours",
  "Direct from Our Factory",
  "15+ Years of Crafting Excellence",
];

/** The lines come from Admin → Home page; these are shown until then, or if the API is down. */
export async function PromiseStrip() {
  const content = await getHomeContent();
  const lines = content?.promiseLines.length ? content.promiseLines : promiseItems;
  return (
    <Marquee
      items={lines}
      label="Why HairCraft"
      repeat={2}
      speedSeconds={36}
      className="bg-deep py-2.5 text-white sm:py-3"
      itemClassName="text-[0.7rem] font-semibold tracking-wide uppercase sm:text-sm sm:tracking-wider"
    />
  );
}

// ── Before and after ────────────────────────────────────────────────

/**
 * Before and after (owner, 2026-11-25), in place of "Shop by category": the
 * owner's two videos (2026-11-26) of thinning hair and of fuller, glossy hair, compared
 * by moving across the photo (see before-after.tsx). No data to load.
 */
export function BeforeAfterSection() {
  return (
    <section aria-labelledby="results-heading" className={`${shell} py-12`}>
      <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-12 lg:gap-16">
        {/* Bigger words than the other sections (owner, 2026-11-25: "make the texts bigger"). */}
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.2em] text-gold-ink uppercase sm:text-sm">
            Real results
          </p>
          <h2
            id="results-heading"
            className="mt-3 font-display text-4xl leading-tight font-medium tracking-tight sm:text-5xl lg:text-6xl"
          >
            See the difference
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">
            From thinning to fuller, glossier hair. Move across the photo to compare before and
            after.
          </p>
          <Link
            href={routes.shop}
            className="mt-7 inline-flex items-center gap-1.5 text-base font-semibold transition-colors hover:text-gold-ink focus-visible:outline-2 focus-visible:outline-deep sm:text-lg"
          >
            Shop all human hair
            <ChevronRightIcon width={20} height={20} />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-[22rem] md:max-w-none">
          <BeforeAfter
            before={{
              src: "/videos/before-hair.mp4",
              poster: "/videos/before-hair-poster.webp",
              label: "Before: a woman shows her thinning hair at the parting",
            }}
            after={{
              src: "/videos/after-hair.mp4",
              poster: "/videos/after-hair-poster.webp",
              label: "After: the same woman with fuller, glossy, long hair",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ── Bestsellers (tabs) ──────────────────────────────────────────────────

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

/**
 * Customer favourites (owner, 2026-11-24): only the products ticked "New arrival"
 * in the admin, as the Photo Deck; the Best rated tab is gone.
 */
export async function MostLovedSection() {
  const data = await load(() => getChosenNewArrivals(8));
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
          <PhotoDeck products={data} label="New arrivals" />
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
 * Real reviews as tilted cards in a row that slides sideways (owner, 2026-11-24):
 * every review the admin chose (up to the API's 50), else the API's pick (5-star,
 * saying something, photos first). Each shows its photo; hovering one turns it
 * over to the review. Hidden when there are no reviews: never invented quotes.
 */
export async function TestimonialsSection() {
  const featured =
    (await load(async () => {
      try {
        return await getFeaturedReviews(HOME_REVIEW_COUNT);
      } catch (error) {
        // An API from before 2026-11-24 allows at most 8: ask again for 8 rather than hide the reviews.
        if (isApiError(error) && error.status === 400) return getFeaturedReviews(8);
        throw error;
      }
    })) ?? [];
  if (featured.length === 0) return null;
  return (
    <section aria-labelledby="reviews-heading" className={`${shell} overflow-x-clip py-14`}>
      <div className="text-center">
        <h2 id="reviews-heading" className="font-display text-3xl font-semibold sm:text-4xl">
          Loved by women like you
        </h2>
        <p className="mt-2 text-muted">What customers say about HairCraft, in their own words.</p>
      </div>
      <ReviewTiltCards reviews={featured} />
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
