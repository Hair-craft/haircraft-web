import Image from "next/image";
import { routes } from "@/components/layout/nav";
import { ButtonLink } from "@/components/ui/button";
import type { ProductCard } from "@/lib/api/types";
import { HeroAccent } from "./hero-accent";

/**
 * Split hero, after the reference: words on the left, a large photo on the
 * right (below the words on phones). The text rises in with CSS (no waiting
 * for JavaScript, so it is visible at once); the photo settles from a slight
 * zoom; on desktop a lazy 3D accent of gold strands floats behind the photo.
 */
export function Hero({ featured }: { featured: ProductCard | null }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-mint to-[#e4f3d9]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:min-h-[42rem] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        <div className="text-center lg:text-left">
          <p className="hc-rise text-xs tracking-[0.35em] text-deep-soft uppercase sm:text-sm">
            Premium human hair extensions
          </p>
          <h1 className="hc-rise hc-delay mt-5 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            Hair extensions, <br />
            crafted for <em className="text-gold-ink">confidence</em>
          </h1>
          <p className="hc-rise hc-delay-2 mx-auto mt-6 max-w-lg text-base text-deep/75 sm:text-lg lg:mx-0">
            Clip-ins, tape-ins, wigs and ponytails in 100% human hair. Every length, colour and
            texture, made to feel like your own.
          </p>
          <div className="hc-rise hc-delay-3 mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
            <ButtonLink href={routes.shop} size="lg">
              Shop all
            </ButtonLink>
            <ButtonLink href={routes.category("wigs")} size="lg" variant="secondary">
              Shop wigs
            </ButtonLink>
          </div>
        </div>

        {featured?.image ? (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <HeroAccent />
            <div className="hc-rise hc-delay relative mx-auto aspect-[4/5] w-full max-w-[34rem] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-1 shadow-deep/15 ring-gold/20">
              <Image
                src={featured.image.large}
                alt={featured.imageAlt ?? featured.name}
                fill
                priority
                sizes="(min-width: 1024px) 34rem, 90vw"
                className="hc-settle object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
