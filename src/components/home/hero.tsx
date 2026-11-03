import Image from "next/image";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { type ReactNode } from "react";
import { type BrandPromise } from "./copy";
import { heroImage } from "./home-images";

/*
 * Two fonts from the older hero, as the owner asked (2026-11-03): the
 * elegant italic for "confidence." and the clean sans-serif for the text
 * under the headline. Loaded here rather than in the site layout, so only
 * the home page downloads them.
 */
const italic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "600",
  style: "italic",
  fallback: ["Georgia", "serif"],
});

const clean = Geist({
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
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
 * The hero banner, after the owner's design and photo (2026-11-03): the wide
 * photo across the whole page width, kept clear (only a light fade behind
 * the words). On wide screens the banner takes the photo's own shape, so the
 * whole picture shows, with the words and one button on the right, over its
 * open space. On phones and tablets the photo shows above the words, so
 * nothing covers it; on phones it is square (framed on the stylist) and the
 * words sit in a white panel over its foot. No button (owner).
 *
 * The shutter (owner, 2026-11-03): the hero is sticky, and the rest of the
 * page (`HeroShutterPanel`) slides up over it as you scroll, while the hero
 * eases back a little (`.hc-shutter` in globals.css; none for people who
 * prefer reduced motion). The words rise in with CSS, so they are visible at once.
 */
export function Hero() {
  return (
    <section className="hc-shutter sticky top-0 z-0 w-full overflow-hidden bg-white xl:flex xl:h-[38rem] xl:items-center 2xl:h-[42rem]">
      <div className="relative aspect-square w-full sm:aspect-[16/8] xl:absolute xl:inset-0 xl:aspect-auto">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          sizes="100vw"
          className="hc-settle object-cover object-[30%_center] sm:object-[35%_center] xl:object-[40%_center]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-l from-white/50 via-white/10 to-transparent xl:block"
        />
      </div>
      <div className="relative z-10 mx-auto -mt-7 w-full max-w-7xl rounded-t-[1.75rem] bg-white px-5 pt-6 pb-8 sm:mt-0 sm:rounded-none sm:px-6 sm:py-8 xl:bg-transparent xl:py-10">
        <div className="flex max-w-xl flex-col items-start gap-3 sm:gap-4 xl:ml-auto xl:w-[42%]">
          <p className="hc-rise inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-3 py-1 text-[0.625rem] font-bold tracking-widest text-deep uppercase shadow-sm backdrop-blur-sm sm:px-3.5 sm:text-[0.7rem]">
            <span aria-hidden className="text-gold">
              ✦
            </span>
            The Art of Bespoke Hair
          </p>
          <h1 className="hc-rise hc-delay font-display text-[1.95rem] leading-[1.15] font-semibold tracking-tight text-deep sm:text-5xl">
            Crafted for{" "}
            <em
              className={`${italic.className} hc-script text-[1.15em] leading-none text-gold-ink`}
            >
              Pure Confidence.
            </em>
          </h1>
          {/* The clean sans-serif of the older hero (owner, 2026-11-03). */}
          <p
            className={`${clean.className} hc-rise hc-delay-2 max-w-md text-[0.95rem] leading-relaxed text-deep/80 sm:text-lg`}
          >
            100% ethically sourced Indian Remy hair extensions, custom toppers, and couture pieces
            made to blend flawlessly.
          </p>
        </div>
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
