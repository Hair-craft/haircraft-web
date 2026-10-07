"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { LazyMotionProvider } from "@/components/motion/lazy";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface ProductTab {
  key: string;
  label: string;
  /** The tab's content (rendered on the server and passed in). */
  panel: ReactNode;
}

/**
 * "Best rated / New arrivals" tabs over one product grid, after the
 * references. A gold underline slides between tabs and the grid cross-fades.
 * Follows the WAI tabs pattern: arrow keys, Home and End move between tabs.
 * With one tab, no tab list is shown at all.
 */
export function ProductTabs({ tabs, label }: { tabs: ProductTab[]; label: string }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const base = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  if (tabs.length === 0) return null;
  if (tabs.length === 1) return <div className="mt-10">{tabs[0].panel}</div>;

  const select = (index: number) => {
    setActive(index);
    buttons.current[index]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const last = tabs.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      select(moves[event.key]);
    }
  };

  return (
    <LazyMotionProvider>
      <div className="mt-8">
        <div
          role="tablist"
          aria-label={label}
          className="flex justify-center gap-2"
          onKeyDown={onKeyDown}
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.key}`}
              aria-selected={i === active}
              aria-controls={`${base}-panel-${tab.key}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cx(
                "relative px-4 py-2 text-xs tracking-[0.25em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-deep",
                i === active ? "text-deep" : "text-deep/70 hover:text-deep/80",
              )}
            >
              {tab.label}
              {i === active ? (
                <m.span
                  layoutId={`${base}-underline`}
                  className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold"
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                  }
                />
              ) : null}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={tabs[active].key}
            role="tabpanel"
            id={`${base}-panel-${tabs[active].key}`}
            aria-labelledby={`${base}-tab-${tabs[active].key}`}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0 : 0.28 }}
            className="mt-8"
          >
            {tabs[active].panel}
          </m.div>
        </AnimatePresence>
      </div>
    </LazyMotionProvider>
  );
}
