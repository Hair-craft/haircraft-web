"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { WhyCard } from "./content";

export interface WhyStackCard extends WhyCard {
  image: { src: string; alt: string } | null;
}

/**
 * "Why HairCraft": large photo-and-text cards. On desktop (and only when
 * motion is welcome) each card sticks near the top and the next one slides
 * over it, while GSAP ScrollTrigger gently shrinks and dims the card below,
 * like the reference's stacking cards. On phones, and with reduced motion,
 * it is a plain list: no sticking, no scripted motion.
 */
export function WhyStack({ cards }: { cards: WhyStackCard[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let revert: (() => void) | undefined;
    let cancelled = false;

    // Only desktops that welcome motion get the effect, so only they download GSAP.
    const wanted = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );
    const start = () => {
      wanted.removeEventListener("change", start);
      void load();
    };
    const load = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-why-card]", element);
        items.slice(0, -1).forEach((card, i) => {
          gsap.to(card.querySelector("[data-why-inner]"), {
            scale: 0.92,
            opacity: 0.55,
            ease: "none",
            scrollTrigger: {
              trigger: items[i + 1],
              start: "top bottom",
              end: "top top+=160",
              scrub: true,
            },
          });
        });
      });
      revert = () => mm.revert();
    };
    if (wanted.matches) void load();
    else wanted.addEventListener("change", start);

    return () => {
      cancelled = true;
      wanted.removeEventListener("change", start);
      revert?.();
    };
  }, []);

  return (
    <div ref={root} className="mt-12 flex flex-col gap-8 lg:gap-24">
      {cards.map((card, i) => (
        <div
          key={card.title}
          data-why-card
          className="lg:motion-safe:sticky"
          style={{ top: `${7 + i * 1.25}rem` }}
        >
          <article
            data-why-inner
            className="grid origin-top overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 shadow-deep/5 ring-deep/5 lg:min-h-[28rem] lg:grid-cols-2"
          >
            <div className="relative aspect-[4/3] bg-mint-deep lg:aspect-auto">
              {card.image ? (
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-col justify-center gap-4 p-8 lg:p-14">
              <p className="text-xs tracking-[0.3em] text-deep-soft uppercase">{card.eyebrow}</p>
              <h3 className="font-display text-3xl leading-tight lg:text-4xl">{card.title}</h3>
              <p className="text-deep/70 lg:text-lg">{card.text}</p>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
