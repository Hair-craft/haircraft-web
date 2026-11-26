"use client";

import Link from "next/link";
import { Children, type ReactNode, type TouchEvent, useEffect, useRef, useState } from "react";
import { routes } from "@/components/layout/nav";

/** How long each slide stays before the next one fades in. */
export const SLIDE_SECONDS = 6;

/**
 * The hero's slideshow (owner, 2026-11-26: "multiple slide show banners"). The slides sit
 * on top of each other in one grid cell, so the hero is as tall as the tallest, and the
 * shown one fades in over the others. They move on by themselves every few seconds
 * and glide smoothly from one to the next: a slow cross-fade with a gentle settle (owner,
 * 2026-11-26: "make it's motion smoothly"); paused only while
 * keyboard focus is on the hero, while the tab is in the background, and never for
 * people who prefer reduced motion; the dots choose one, and
 * on phones a swipe moves on or back.
 *
 * The whole hero opens Shop all (owner, 2026-11-20), whichever slide shows.
 */
export function HeroSlides({ labels, children }: { labels: string[]; children: ReactNode }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (to: number) => setIndex(((to % count) + count) % count);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((i) => (i + 1) % count);
    }, SLIDE_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [count, paused, index]);

  const onTouchStart = (event: TouchEvent) => {
    touchX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined || Math.abs(end - start) < 40) return;
    go(end < start ? index + 1 : index - 1);
  };

  return (
    <div
      className="relative md:h-full"
      role="region"
      aria-roledescription="carousel"
      aria-label="Banners"
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Link
        href={routes.shop}
        aria-label="Shop all human hair"
        className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-deep"
      />
      <div className="grid md:h-full md:grid-rows-[100%]">
        {slides.map((slide, i) => (
          <div
            key={labels[i] ?? i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${labels[i] ?? ""}`}
            aria-hidden={i !== index}
            className={
              "col-start-1 row-start-1 self-stretch transition-[opacity,visibility,transform] duration-[1200ms] ease-in-out motion-reduce:transition-none " +
              (i === index ? "visible scale-100 opacity-100" : "invisible scale-[1.03] opacity-0")
            }
          >
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        // Above the sliding panel's rounded edge, which covers the hero's last 1.5–2rem.
        <div className="absolute inset-x-0 bottom-9 z-30 flex justify-center gap-2 sm:bottom-11 md:bottom-12">
          {labels.slice(0, count).map((label, i) => (
            <button
              key={label}
              type="button"
              aria-label={`Show banner ${i + 1}: ${label}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className="grid size-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep"
            >
              <span
                className={
                  // A ring so they show on the cream and on a dark picture alike.
                  "block h-2 rounded-full shadow-sm ring-2 transition-all duration-300 " +
                  (i === index
                    ? "w-6 bg-deep ring-white/90"
                    : "w-2 bg-white ring-deep/25 hover:bg-deep/40")
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
