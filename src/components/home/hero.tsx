import Image from "next/image";
import Link from "next/link";
import { routes } from "@/components/layout/nav";
import { Cormorant_Garamond } from "next/font/google";
import { type ReactNode } from "react";
import { type BrandPromise } from "./copy";
import { heroImage } from "./home-images";

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
 * full width, the banner a little taller than before (owner, 2026-11-20: 24,
 * 30, 38 and 42rem from tablets up); the photo sits low, so the table stays in
 * view. From tablets up the words sit over the photo's open cream space on
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
export function Hero() {
  return (
    <section className="hc-shutter sticky top-0 z-0 w-full overflow-hidden bg-[#fbf6f2] md:flex md:h-[24rem] md:items-center lg:h-[30rem] xl:h-[38rem] 2xl:h-[42rem]">
      {/* The whole banner opens Shop all (owner, 2026-11-20); still no button. */}
      <Link
        href={routes.shop}
        aria-label="Shop all human hair"
        className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-deep"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-6 sm:px-6 sm:pt-8 md:pt-6 md:pb-16 lg:pb-24 xl:pt-10 xl:pb-32">
        <div className="flex max-w-xl flex-col items-start gap-3 sm:gap-4 md:w-[40%] md:gap-3 lg:w-[42%] lg:gap-5 xl:w-[46%] xl:max-w-2xl">
          {/* The badge a little higher than the headline (owner, 2026-11-20). */}
          <p className="hc-rise relative -top-1 inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-3 py-1 text-[0.625rem] font-bold tracking-widest text-deep uppercase shadow-sm backdrop-blur-sm sm:px-3.5 sm:text-[0.7rem] md:-top-2 md:text-[0.65rem] lg:-top-3 lg:px-4 lg:py-1.5 lg:text-[0.8rem] xl:-top-4 xl:text-[0.9rem]">
            <span aria-hidden className="text-gold">
              ✦
            </span>
            100% Real Human Hair
          </p>
          <h1 className="hc-rise hc-delay font-display text-[1.75rem] leading-[1.15] font-semibold tracking-tight text-deep sm:text-5xl md:text-[2rem] lg:text-[2.75rem] xl:text-[3.5rem] 2xl:text-[3.75rem]">
            {/* The owner's banner words (2026-11-20). */}
            Fuller Hair, A More{" "}
            <em
              className={`${italic.className} hc-script block text-[1.15em] leading-tight text-gold-ink`}
            >
              Confident You
            </em>
          </h1>
        </div>
      </div>
      <div className="relative -mt-8 aspect-[6/5] w-full sm:-mt-24 sm:aspect-[16/8] md:absolute md:inset-0 md:mt-0 md:aspect-auto">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          sizes="100vw"
          // Sharp, not soft (owner, 2026-11-20): the higher of the allowed qualities.
          quality={90}
          className="hc-settle object-cover object-[80%_20%] md:object-[100%_65%]"
        />
        {/* Phones: a cream fade over the photo's top, behind the words (owner, 2026-11-04). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[#fbf6f2] to-transparent md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[#fbf6f2]/60 via-[#fbf6f2]/10 to-transparent md:block"
        />
      </div>
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
