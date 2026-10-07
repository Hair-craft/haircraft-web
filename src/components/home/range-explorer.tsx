"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { LazyMotionProvider } from "@/components/motion/lazy";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export interface RangeItem {
  name: string;
  href: string;
  description: string | null;
  productCount: number;
  image: { src: string; alt: string } | null;
}

/**
 * "Explore our range", after 1hairstop.in: large category names on the
 * left; pointing at, focusing or tapping one cross-fades its photo and
 * description on the right. The link in the panel opens the category.
 */
export function RangeExplorer({ items }: { items: RangeItem[] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  if (items.length === 0) return null;
  const current = items[Math.min(active, items.length - 1)];

  return (
    <LazyMotionProvider>
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <ul className="order-2 flex flex-col lg:order-1">
          {items.map((item, i) => (
            <li key={item.href}>
              <button
                type="button"
                aria-pressed={i === active}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={cx(
                  "w-full py-2 text-left font-display text-3xl leading-tight transition-colors sm:text-4xl lg:text-5xl",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep",
                  i === active ? "text-deep" : "text-deep/60 hover:text-deep",
                )}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="order-1 lg:order-2" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={current.href}
              initial={reduced ? false : { opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
              transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-deep/5"
            >
              <div className="relative aspect-[16/11] bg-mint-deep">
                {current.image ? (
                  <Image
                    src={current.image.src}
                    alt={current.image.alt}
                    fill
                    sizes="(min-width: 1024px) 48vw, 92vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                <div>
                  <p className="text-xs tracking-[0.3em] text-deep-soft uppercase">
                    {current.productCount} {current.productCount === 1 ? "product" : "products"}
                  </p>
                  {current.description ? (
                    <p className="mt-2 max-w-sm text-deep/75">{current.description}</p>
                  ) : null}
                </div>
                <Link
                  href={current.href}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-deep"
                >
                  Shop {current.name}
                  <ChevronRightIcon width={16} height={16} />
                </Link>
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </LazyMotionProvider>
  );
}
