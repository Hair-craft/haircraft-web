"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export interface CarouselItem {
  key: string;
  node: ReactNode;
}

/** How long each card stays before the row moves on, on desktop. */
const AUTO_SLIDE_MS = 4500;

/**
 * The concern cards as a sideways slider (owner, 2026-11-04): it moves on by
 * itself on desktop, and can be slid by hand everywhere (swipe, trackpad, the
 * arrows). It loops: the cards repeat on both sides, and once a slide settles
 * the row jumps by one whole set, which looks the same, so it never runs out.
 *
 * Only the middle set is real for screen readers and the keyboard; the repeats
 * are hidden and inert. Auto-sliding stops while the row is hovered, focused
 * or touched, and while it is off screen or the tab is hidden; it never starts
 * for people who prefer reduced motion. No pause button (owner, 2026-11-04).
 *
 * On phones (owner, 2026-11-04) the row is pinned instead: it stays on screen
 * while scrolling down slides the cards sideways, once each (no loop), and
 * the page moves on after the last card. Not with reduced motion, where the
 * row is the normal swipeable slider.
 */
export function ConcernCarousel({
  items,
  label,
  header,
}: {
  items: CarouselItem[];
  label: string;
  /** The section's heading, shown above the row (and pinned with it on phones). */
  header?: ReactNode;
}) {
  const list = useRef<HTMLUListElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const n = items.length;

  const [pinned, setPinned] = useState(false);
  /** While pinned: the space the pinned row takes up, and where it sticks. */
  const [pinLayout, setPinLayout] = useState<{ height: number; top: number } | null>(null);

  const loops = n >= 2 && !pinned;
  // Enough repeats that the row can always slide a card further either way.
  const copies = loops ? Math.max(3, Math.ceil(8 / n) + 2) : 1;
  const realCopy = loops ? 1 : 0;

  const [held, setHeld] = useState(false);
  const [autoAllowed, setAutoAllowed] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  // Pinned on phones only, and never with reduced motion.
  useEffect(() => {
    const query = window.matchMedia(
      "(max-width: 639px) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setPinned(query.matches && n >= 2);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [n]);

  // While pinned, the page's scroll position drives the row's: the wrapper is as
  // tall as the row plus the row's sideways travel, and the row sticks inside it.
  useEffect(() => {
    const el = list.current;
    const box = pin.current;
    const wrap = outer.current;
    if (!pinned || !el || !box || !wrap) {
      setPinLayout(null);
      return;
    }
    let distance = 0;
    let top = 0;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const travelled = top - wrap.getBoundingClientRect().top;
      el.scrollLeft = distance > 0 ? Math.min(distance, Math.max(0, travelled)) : 0;
    };
    const layout = () => {
      distance = Math.max(0, el.scrollWidth - el.clientWidth);
      const header = document.querySelector("header")?.offsetHeight ?? 0;
      // Centred in the space below the sticky site header.
      top = header + Math.max(8, (window.innerHeight - header - box.offsetHeight) / 2);
      setPinLayout({ height: box.offsetHeight + distance, top });
      sync();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    // A card focused from the keyboard: scroll the page to where it is in view.
    const onFocusIn = (event: FocusEvent) => {
      const card = (event.target as HTMLElement).closest("li");
      if (!card) return;
      const target = Math.min(distance, Math.max(0, card.offsetLeft - 16));
      window.scrollTo({
        top: window.scrollY + wrap.getBoundingClientRect().top - top + target,
        behavior: "instant",
      });
    };
    layout();
    const resize = new ResizeObserver(layout);
    resize.observe(el);
    resize.observe(box);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    el.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [pinned]);

  /** Width of one card plus the gap, and of one whole set. */
  const measure = useCallback(() => {
    const el = list.current;
    if (!el || el.children.length < 2) return null;
    const first = el.children[0] as HTMLElement;
    const step = (el.children[1] as HTMLElement).offsetLeft - first.offsetLeft;
    const set = loops ? (el.children[n] as HTMLElement).offsetLeft - first.offsetLeft : 0;
    return { step, set };
  }, [loops, n]);

  /** Keeps the view inside the real (middle) set, by jumping a whole set; it looks the same. */
  const recentre = useCallback(() => {
    const el = list.current;
    const size = measure();
    if (!el || !size || !loops || size.set <= 0) return;
    const { set } = size;
    if (el.scrollLeft < set - size.step / 2)
      el.scrollTo({ left: el.scrollLeft + set, behavior: "instant" });
    else if (el.scrollLeft >= 2 * set - size.step / 2)
      el.scrollTo({ left: el.scrollLeft - set, behavior: "instant" });
  }, [loops, measure]);

  const slide = useCallback(
    (direction: 1 | -1) => {
      const el = list.current;
      const size = measure();
      if (!el || !size) return;
      recentre();
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollBy({ left: direction * size.step, behavior: smooth ? "smooth" : "instant" });
    },
    [measure, recentre],
  );

  // Start on the real set, and recentre whenever a slide (by hand or not) settles.
  useEffect(() => {
    const el = list.current;
    const size = measure();
    if (!el || !size || !loops) return;
    el.scrollTo({ left: size.set, behavior: "instant" });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settled = () => recentre();
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(settled, 160);
    };
    const hasScrollEnd = "onscrollend" in window;
    el.addEventListener(hasScrollEnd ? "scrollend" : "scroll", hasScrollEnd ? settled : onScroll);
    const onResize = () => recentre();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      el.removeEventListener(
        hasScrollEnd ? "scrollend" : "scroll",
        hasScrollEnd ? settled : onScroll,
      );
      window.removeEventListener("resize", onResize);
    };
  }, [loops, measure, recentre]);

  // Auto-sliding: desktop only, and never with reduced motion.
  useEffect(() => {
    const query = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setAutoAllowed(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.4,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const running = loops && autoAllowed && onScreen && !held;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") slide(1);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [running, slide]);

  const arrow =
    "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-deep shadow-md transition-[transform,background-color] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep motion-safe:hover:scale-105 sm:grid";

  return (
    <div ref={outer} style={pinLayout ? { height: pinLayout.height } : undefined}>
      <div
        ref={pin}
        className={cx(pinned && "sticky")}
        style={pinLayout ? { top: pinLayout.top } : undefined}
      >
        {header}
        <div
          className="relative"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
          }}
          onTouchStart={() => setHeld(true)}
        >
          <ul
            ref={list}
            aria-label={label}
            data-reveal-row
            className={cx(
              "relative -mx-4 flex scroll-px-4 [scrollbar-width:none] gap-4 overflow-y-hidden px-4 pt-2 pb-5 sm:mx-0 sm:scroll-px-0 sm:gap-6 sm:px-0 [&::-webkit-scrollbar]:hidden",
              // Pinned: the page's scroll moves the row, so no swiping or snapping of its own.
              pinned
                ? "overflow-x-hidden"
                : "snap-x snap-mandatory overflow-x-auto overscroll-x-contain",
            )}
          >
            {Array.from({ length: copies }, (_, copy) =>
              items.map((item) => {
                const real = copy === realCopy;
                return (
                  <li
                    key={`${copy}-${item.key}`}
                    aria-hidden={real ? undefined : true}
                    inert={!real}
                    className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                  >
                    {item.node}
                  </li>
                );
              }),
            )}
          </ul>
          {loops ? (
            <>
              <button
                type="button"
                aria-label="Previous concerns"
                onClick={() => slide(-1)}
                className={cx(arrow, "left-2 lg:-left-5")}
              >
                <ChevronRightIcon width={20} height={20} className="rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Next concerns"
                onClick={() => slide(1)}
                className={cx(arrow, "right-2 lg:-right-5")}
              >
                <ChevronRightIcon width={20} height={20} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
