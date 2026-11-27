import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { Cormorant_Garamond } from "next/font/google";
import { type ReactNode } from "react";
import { type BrandPromise } from "./copy";
import { heroImage, type HeroSlide, shownHeroSlides } from "./home-images";
import { HeroSlides } from "./hero-slides";
import { getHomeContent } from "@/lib/api/home";

/*
 * The elegant italic of the older hero (owner, 2026-11-03), now for
 * "Confident You" (2026-11-20). Loaded here rather than in the site layout,
 * so only the home page downloads it.
 */
const italic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "600",
  style: "italic",
  fallback: ["Georgia", "serif"],
});

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

/**
 * The hero banner, after the owner's design and photo (2026-11-04: the words
 * on the LEFT; 2026-11-20: the stylist with a hair piece, two mannequins and
 * the HairCraft box, on a cream ground the section matches). The photo at the
 * full width; from tablets up the banner is 48% of the screen's width (at
 * least 24rem; owner, 2026-11-21), so the whole photo fits on wide screens too. From tablets up the words sit over the photo's open cream space on
 * the left, a little above the middle (owner, 2026-11-20). No button (owner).
 *
 * Phones (owner, 2026-11-04, kept 2026-11-20): the words on top, over the
 * photo's upper part, with a cream fade behind them; the photo, closer in on
 * the stylist, runs on below.
 *
 * The shutter (owner, 2026-11-03): the hero is sticky, and the rest of the
 * page (`HeroShutterPanel`) slides up over it as you scroll, while the hero
 * eases back a little (`.hc-shutter` in globals.css; none for people who
 * prefer reduced motion). The words rise in with CSS, so they are visible at once.
 */
/** A banner file as is (the owner's SVGs), or a photo through next/image. */
function bannerSource(src: string): { src: string; srcSet: string | undefined } {
  if (src.endsWith(".svg")) return { src, srcSet: undefined };
  // Sharp, not soft (owner, 2026-11-20): the higher of the allowed qualities.
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: "100vw", quality: 90 });
  return { src: props.src, srcSet: props.srcSet };
}

/**
 * The banner, one picture per screen (owner, 2026-11-24): the desktop banner from 768 px
 * up, the mobile one below, each the owner's SVG as is.
 * Each screen downloads only its own, fetched first as the page's largest picture.
 *
 * Both banners are 16:9 with the stylist and the table on the right. The framing always
 * shows her raised hand at the top down to the table's stand at the bottom (owner,
 * 2026-11-24): from tablets up the whole width, its empty top trimmed; on phones a close
 * window on the stylist and the table (see the frame in `Hero`).
 */
function HeroPicture({
  desktopSrc,
  mobileSrc,
  first,
}: {
  desktopSrc: string;
  mobileSrc: string;
  first: boolean;
}) {
  const desktop = bannerSource(desktopSrc);
  const mobile = bannerSource(mobileSrc);
  if (first)
    for (const [banner, media] of [
      [desktop, "(min-width: 768px)"],
      [mobile, "(max-width: 767px)"],
    ] as const)
      preload(banner.src, {
        as: "image",
        ...(banner.srcSet ? { imageSrcSet: banner.srcSet, imageSizes: "100vw" } : {}),
        fetchPriority: "high",
        media,
      });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop.srcSet ?? desktop.src} sizes="100vw" />
      <img
        src={mobile.src}
        srcSet={mobile.srcSet}
        sizes="100vw"
        alt={heroImage.alt}
        width={2240}
        height={1260}
        fetchPriority={first ? "high" : "low"}
        loading="eager"
        decoding="async"
        className={
          // The picture ends exactly at the bottom of the table's stand, where the sliding
          // panel begins: no empty ground under it (owner, 2026-11-24). Measured in the SVGs:
          // the stand ends at 98.6% of the mobile banner's height, 92.1% of the desktop one's.
          // Phones: 15%–98.6% of the mobile banner fills the square window (212.7% of its
          // width), moved to the stylist and the table; 640–767 px the same at 4:3.
          // Tablets up: 16%–92.1% of the desktop banner fills the height down to the panel's
          // edge (2rem above the bottom), on the right; the cream on the left.
          "hc-settle absolute top-[-17.94%] left-[-97.95%] h-auto w-[212.7%] max-w-none " +
          "sm:left-[-59.5%] sm:w-[159.5%] " +
          "md:top-[calc(-21.02%_+_0.42rem)] md:right-0 md:left-auto md:h-[calc(131.4%_-_2.628rem)] md:w-auto"
        }
      />
    </picture>
  );
}
/** The banners' pill and headline (the first banner's design, owner 2026-11-20; the toppers banner's too, 2026-11-26). */
const badgeClass =
  "relative -top-1 inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-3 py-1 text-[0.625rem] font-bold tracking-widest text-deep uppercase shadow-sm backdrop-blur-sm sm:px-3.5 sm:text-[0.7rem] md:-top-2 md:text-[0.65rem] lg:-top-3 lg:px-4 lg:py-1.5 lg:text-[0.8rem] xl:-top-4 xl:text-[0.9rem] min-[112.5rem]:px-5 min-[112.5rem]:py-2 min-[112.5rem]:text-[1.05rem]";
const headlineClass =
  "font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-deep sm:text-5xl md:text-[2rem] lg:text-[2.75rem] xl:text-[3.5rem] 2xl:text-[3.75rem] min-[112.5rem]:text-[4.5rem]";
const scriptClass = `${italic.className} hc-script block text-[1.15em] leading-tight text-gold-ink`;

/** The pill: a gold star and the words. */
function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`${badgeClass} ${className}`}>
      <span aria-hidden className="text-gold">
        ✦
      </span>
      {children}
    </p>
  );
}

/** The headline, shown on the stylist slide (and to screen readers when that slide is off). */
function Headline({ className }: { className: string }) {
  return (
    <h1 className={className}>
      {/* The owner's banner words (2026-11-20). */}
      Fuller Hair, A More <em className={scriptClass}>Confident You</em>
    </h1>
  );
}

/** The first slide: the words on the cream and the stylist at her table (see `HeroPicture`). */
function StylistSlide({ first }: { first: boolean }) {
  return (
    <div className="relative md:flex md:h-full md:items-center">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-6 sm:px-6 sm:pt-8 md:pt-6 md:pb-16 lg:pb-24 xl:pt-10 xl:pb-32">
        <div className="flex max-w-xl flex-col items-start gap-3 sm:gap-4 md:w-[40%] md:gap-3 lg:w-[42%] lg:gap-5 xl:w-[46%] xl:max-w-2xl min-[112.5rem]:w-[60%] min-[112.5rem]:max-w-[46rem] min-[112.5rem]:gap-6">
          {/* The badge a little higher than the headline (owner, 2026-11-20). */}
          <Badge className="hc-rise">100% Real Human Hair</Badge>
          <Headline className={`hc-rise hc-delay ${headlineClass}`} />
        </div>
      </div>
      {/*
        Phones: a square window (4:3 from 640 px) on the stylist and the table, plus a strip
        of the banner's green under it that the sliding panel covers, so the stand is never
        hidden (owner, 2026-11-24). Tablets up: the whole banner behind the words.
      */}
      <div className="relative mt-3 w-full overflow-hidden bg-[#e0e9d2] pb-6 sm:mt-2 sm:pb-8 md:absolute md:inset-0 md:mt-0 md:bg-transparent md:pb-0">
        <div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
          <HeroPicture desktopSrc={heroImage.src} mobileSrc={heroImage.mobile} first={first} />
        </div>
        {/* Phones: the photo starts under the words, its top edge softened into the cream. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#fbf6f2] to-transparent md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#fbf6f2]/60 via-[#fbf6f2]/10 to-transparent md:block"
        />
      </div>
    </div>
  );
}

/**
 * The toppers slide (owner, 2026-11-26), sized for each screen, with words styled like the
 * first banner's (the pill and the two-line headline) in another place: from 768 px up at
 * the top right, in the picture's open cream space; on phones on top, like the first
 * banner, with the closer phone picture filling the rest, kept on the people. Its own
 * height on phones is used when it is the only slide; with the stylist slide it takes
 * that one's height.
 */
function ToppersSlide({
  slide,
  first,
}: {
  slide: Extract<HeroSlide, { key: "toppers" }>;
  first: boolean;
}) {
  if (first)
    for (const [src, media] of [
      [slide.desktop, "(min-width: 768px)"],
      [slide.mobile, "(max-width: 767px)"],
    ] as const)
      preload(src, { as: "image", fetchPriority: "high", media });
  return (
    <div className="relative h-full min-h-[calc(100vw+10rem)] overflow-hidden bg-[#ecded3] sm:min-h-[calc(75vw+12rem)] md:min-h-0 md:bg-transparent">
      <div className="relative z-20 px-5 pt-6 sm:px-6 sm:pt-8 md:absolute md:top-[9%] md:right-[2.5%] md:p-0 xl:top-[10%]">
        <div className="flex max-w-xl flex-col items-start gap-3 sm:gap-4 md:gap-3 lg:gap-5 xl:max-w-2xl min-[112.5rem]:max-w-[46rem] min-[112.5rem]:gap-6">
          <Badge>{slide.tagline}</Badge>
          <p className={headlineClass}>
            {/* Each line whole, as in the first banner, so the words stay in the open space. */}
            <span className="md:whitespace-nowrap">{slide.headline[0]}</span>{" "}
            <em className={`${scriptClass} md:whitespace-nowrap`}>{slide.headline[1]}</em>
          </p>
        </div>
      </div>
      {/*
        Phones: the tall phone picture (beige, like the slide) from the bottom up, its green
        wave (ending at 92% of its height) just above the sliding panel; its open top sits
        behind the words. 640–767 px: the same, 75% wide and centred, its sides faded into the
        beige. Tablets up: the wide
        computer picture fills the hero.
      */}
      <picture>
        <source media="(min-width: 768px)" srcSet={slide.desktop} width={2240} height={1260} />
        <img
          src={slide.mobile}
          alt={slide.alt}
          width={1890}
          height={3780}
          fetchPriority={first ? "high" : "low"}
          loading="eager"
          decoding="async"
          className={
            "absolute bottom-[calc(1.5rem-16vw)] left-0 h-auto w-full max-w-none " +
            "sm:bottom-[calc(2rem-12vw)] sm:left-[12.5%] sm:w-[75%] sm:[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] md:[mask-image:none] " +
            "md:inset-0 md:h-full md:w-full md:object-cover md:object-[50%_30%]"
          }
        />
      </picture>
    </div>
  );
}

export async function Hero() {
  // The slides the admin left on (owner, 2026-11-26), else every one.
  const slides = shownHeroSlides((await getHomeContent())?.slides);
  const withWords = slides.some((slide) => slide.key === "stylist");
  return (
    <section className="hc-shutter sticky top-0 z-0 w-full overflow-hidden bg-[#fbf6f2] md:h-[min(48vw,calc(100svh-7.5rem))] md:min-h-[24rem]">
      {!withWords && <Headline className="sr-only" />}
      <HeroSlides labels={slides.map((slide) => slide.label)}>
        {slides.map((slide, i) =>
          slide.key === "stylist" ? (
            <StylistSlide key={slide.key} first={i === 0} />
          ) : (
            <ToppersSlide key={slide.key} slide={slide} first={i === 0} />
          ),
        )}
      </HeroSlides>
    </section>
  );
}

/** The rest of the home page: it slides up over the sticky hero like a shutter. */
export function HeroShutterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 -mt-6 rounded-t-[2rem] bg-mint pt-4 shadow-[0_-18px_40px_-22px_rgba(11,41,26,0.45)] sm:-mt-8 sm:rounded-t-[2.5rem]">
      {children}
    </div>
  );
}
