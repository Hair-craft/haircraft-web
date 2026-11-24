"use client";

import { AnimatePresence, m, useReducedMotion, type PanInfo } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { LazyMotionProvider } from "@/components/motion/lazy";
import { productHref } from "@/components/product/product-card";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { ChevronRightIcon } from "@/components/ui/icons";
import { PriceRange } from "@/components/ui/display";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { counterDigits, deckPose, deckStack, deckStep } from "@/lib/home/photo-deck";
import { useAutoSlide } from "./use-auto-slide";

/** Odometer digits: each digit rolls up (next) or down (back) to its new value. */
function Odometer({ value, direction }: { value: string; direction: number }) {
  return (
    <span className="inline-flex overflow-hidden tabular-nums">
      {value.split("").map((digit, i) => (
        <span key={i} className="relative inline-block h-[1.15em] w-[0.62em] overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <m.span
              key={digit}
              custom={direction}
              className="absolute inset-0 text-center"
              variants={{
                enter: (d: number) => ({ y: d >= 0 ? "100%" : "-100%" }),
                center: { y: "0%" },
                leave: (d: number) => ({ y: d >= 0 ? "-100%" : "100%" }),
              }}
              initial="enter"
              animate="center"
              exit="leave"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {digit}
            </m.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/**
 * Customer favourites as a Photo Deck (owner, 2026-11-24, after 21st.dev's
 * "Photo Deck"): the products as a stack of photo prints. Drag or flick the
 * top print, use the ‹ › buttons or the arrow keys: the top print flies off
 * with a tilt, going back flies the previous one in from the left, the
 * counter rolls like an odometer and the caption (name, a short line, the
 * price and Shop now) hands over line by line. It moves on by itself every 3 s.
 */
export function PhotoDeck({ label, products }: { label: string; products: ProductCardData[] }) {
  const count = products.length;
  const reduced = useReducedMotion();
  const [state, setState] = useState({ active: 0, direction: 1 });
  const box = useRef<HTMLDivElement>(null);
  const { active, direction } = state;

  const go = useCallback(
    (by: number) =>
      setState((s) => ({ active: deckStep(s.active, by, count), direction: by >= 0 ? 1 : -1 })),
    [count],
  );
  useAutoSlide(box, () => go(1), count > 1);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    go(event.key === "ArrowRight" ? 1 : -1);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (swipe < -80) go(1);
    else if (swipe > 80) go(-1);
  };

  const current = products[active];
  const stack = deckStack(active, count);
  // The top print leaves to the right going on, to the left going back.
  const fly = reduced
    ? { opacity: 0 }
    : { x: direction > 0 ? "115%" : "-115%", rotate: direction > 0 ? 16 : -16, opacity: 0 };
  const arrive = reduced
    ? { opacity: 0 }
    : direction > 0
      ? { opacity: 0, scale: 0.96 }
      : { x: "-115%", rotate: -16, opacity: 0 };

  return (
    <LazyMotionProvider>
      <div
        ref={box}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        onKeyDown={onKeyDown}
        // Sideways only: the fanned prints, and the one flying off, never widen the page.
        className="grid items-center gap-8 overflow-x-clip py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-14"
      >
        {/* The stack of prints. */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[19rem] sm:max-w-[22rem]">
          <AnimatePresence initial={false} custom={direction}>
            {[...stack].reverse().map((index) => {
              const place = stack.indexOf(index);
              const product = products[index];
              const pose = deckPose(place);
              const top = place === 0;
              return (
                <m.div
                  key={product.id}
                  className="absolute inset-0 rounded-[1.25rem] bg-white p-2.5 pb-10 shadow-[0_18px_40px_-18px_rgb(11_41_26/0.45)] sm:p-3 sm:pb-12"
                  style={{ zIndex: 10 - place }}
                  initial={top ? arrive : { ...pose, opacity: 0 }}
                  animate={{
                    ...(reduced ? { rotate: 0, x: 0, y: 0, scale: 1 } : pose),
                    opacity: 1,
                  }}
                  exit={fly}
                  transition={{ duration: reduced ? 0.2 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                  drag={top && count > 1 ? "x" : false}
                  dragSnapToOrigin
                  dragElastic={0.6}
                  onDragEnd={top ? onDragEnd : undefined}
                  whileDrag={{ rotate: 0, cursor: "grabbing" }}
                  aria-hidden={!top || undefined}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-sand">
                    {product.image ? (
                      <Image
                        src={product.image.medium}
                        alt={top ? (product.imageAlt ?? product.name) : ""}
                        fill
                        sizes="(min-width: 640px) 22rem, 19rem"
                        draggable={false}
                        className="pointer-events-none object-cover select-none"
                      />
                    ) : (
                      <PhotoPlaceholder />
                    )}
                  </div>
                  <p className="absolute inset-x-3 bottom-3 truncate text-center font-display text-sm text-deep/80 sm:bottom-4">
                    {product.name}
                  </p>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* The caption, handing over line by line. */}
        <div className="flex flex-col items-start gap-4 text-left">
          <p className="font-display text-sm text-muted" aria-hidden>
            <span className="text-2xl text-deep">
              <Odometer value={counterDigits(active + 1, count)} direction={direction} />
            </span>
            <span className="mx-1.5">/</span>
            {counterDigits(count, count)}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={current.id}
              initial="hidden"
              animate="shown"
              exit="gone"
              variants={{
                hidden: {},
                shown: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
                gone: {},
              }}
              className="flex flex-col items-start gap-3"
            >
              {[
                <h3
                  key="name"
                  className="font-display text-2xl leading-tight font-semibold sm:text-3xl"
                >
                  {current.name}
                </h3>,
                current.summary ? (
                  <p key="line" className="max-w-md text-sm text-muted sm:text-base">
                    {current.summary}
                  </p>
                ) : null,
                <PriceRange
                  key="price"
                  min={current.priceRange.min}
                  max={current.priceRange.max}
                  className="text-lg font-bold"
                />,
                <Link
                  key="shop"
                  href={productHref(current.slug)}
                  className="mt-1 inline-flex items-center gap-2 rounded-full bg-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
                >
                  Shop now
                  <span className="sr-only">: {current.name}</span>
                  <ChevronRightIcon width={16} height={16} aria-hidden />
                </Link>,
              ]
                .filter(Boolean)
                .map((line, i) => (
                  <m.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: reduced ? 0 : 14 },
                      shown: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                      gone: { opacity: 0, y: reduced ? 0 : -8, transition: { duration: 0.18 } },
                    }}
                  >
                    {line}
                  </m.div>
                ))}
            </m.div>
          </AnimatePresence>

          {count > 1 ? (
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                aria-label="Previous favourite"
                onClick={() => go(-1)}
                className="grid size-11 place-items-center rounded-full border border-deep/15 bg-white text-deep shadow-sm transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
              >
                <ChevronRightIcon width={18} height={18} className="rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Next favourite"
                onClick={() => go(1)}
                className="grid size-11 place-items-center rounded-full border border-deep/15 bg-white text-deep shadow-sm transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
              >
                <ChevronRightIcon width={18} height={18} />
              </button>
            </div>
          ) : null}
          <p aria-live="polite" className="sr-only">
            {active + 1} of {count}: {current.name}
          </p>
        </div>
      </div>
    </LazyMotionProvider>
  );
}
