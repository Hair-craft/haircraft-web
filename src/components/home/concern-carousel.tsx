"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export interface CarouselItem {
  key: string;
  node: ReactNode;
}

/** How long each card stays before the row moves on. */
const AUTO_SLIDE_MS = 4500;
/** The preview when the row first comes into view: out, then back to the first card. */
const PREVIEW_OUT_MS = 1200;
const PREVIEW_BACK_MS = 800;
/** After the preview, the arrows and the auto-slide arrive this much later. */
const READY_DELAY_MS = 750;
/** A finger lifted: auto-sliding waits this long before it goes on. */
const TOUCH_REST_MS = 4000;

type Phase = "waiting" | "preview" | "ready";

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * The concern cards as a sideways slider, the same on phones and desktop
 * (owner, 2026-11-05).
 *
 * When the row first comes into view, the cards glide on for about two
 * seconds as a preview and come back to the first card; 0.75 s later the
 * arrows appear and the row starts moving on by itself. It can be slid by
 * hand at any time (swipe, trackpad, arrows), which also ends the preview.
 *
 * It loops: the cards repeat on both sides, and once a slide settles the row
 * jumps by one whole set, which looks the same, so it never runs out. Only
 * the middle set is real for screen readers and the keyboard; the repeats are
 * hidden from them but can still be tapped and clicked. (They were inert
 * until 2026-11-05: after the last card the repeats are what's on screen,
 * so the "second round" of cards didn't open when tapped.) Auto-sliding stops while the row is hovered, focused or
 * touched, and while it is off screen or the tab is hidden. With reduced
 * motion there is no preview and no auto-slide: the arrows are there at once.
 */
export function ConcernCarousel({
  items,
  label,
  header,
}: {
  items: CarouselItem[];
  label: string;
  /** The section's heading, shown above the row. */
  header?: ReactNode;
}) {
  const list = useRef<HTMLUListElement>(null);
  const n = items.length;
  const loops = n >= 2;
  // Enough repeats that the row can always slide a card further either way.
  const copies = loops ? Math.max(3, Math.ceil(8 / n) + 2) : 1;
  const realCopy = loops ? 1 : 0;

  const [phase, setPhase] = useState<Phase>("waiting");
  const [held, setHeld] = useState(false);
  const [motionOk, setMotionOk] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const preview = useRef<{ frame: number; cancel: () => void } | null>(null);
  const touchRest = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    if (!el || !size || !loops || size.set <= 0 || preview.current) return;
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
      preview.current?.cancel();
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

  // The repeats' links and buttons stay clickable but out of the Tab order.
  useEffect(() => {
    list.current
      ?.querySelectorAll<HTMLElement>("li[data-repeat] a, li[data-repeat] button")
      .forEach((el) => el.setAttribute("tabindex", "-1"));
  }, [items, copies]);

  // Motion only for people who haven't asked for less.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setMotionOk(query.matches);
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

  // The preview, once, the first time the row is in view: glide on, then back to the first card.
  useEffect(() => {
    if (phase !== "waiting" || !onScreen) return;
    const el = list.current;
    const size = measure();
    if (!loops || !motionOk || !el || !size) {
      setPhase("ready");
      return;
    }
    const start = size.set;
    const distance = Math.min(size.set - size.step / 2, size.step * 2);
    const began = performance.now();
    // No snapping while the row is moved frame by frame.
    el.style.scrollSnapType = "none";
    const finish = () => {
      if (!preview.current) return;
      cancelAnimationFrame(preview.current.frame);
      preview.current = null;
      el.style.scrollSnapType = "";
      readyTimer.current = setTimeout(() => setPhase("ready"), READY_DELAY_MS);
    };
    const tick = (now: number) => {
      const t = now - began;
      if (t < PREVIEW_OUT_MS) {
        el.scrollLeft = start + distance * easeInOut(t / PREVIEW_OUT_MS);
      } else if (t < PREVIEW_OUT_MS + PREVIEW_BACK_MS) {
        el.scrollLeft = start + distance * (1 - easeInOut((t - PREVIEW_OUT_MS) / PREVIEW_BACK_MS));
      } else {
        el.scrollLeft = start;
        return finish();
      }
      if (preview.current) preview.current.frame = requestAnimationFrame(tick);
    };
    preview.current = { frame: requestAnimationFrame(tick), cancel: finish };
    setPhase("preview");
    // A swipe, a wheel or a press ends the preview where it is.
    const stop = () => preview.current?.cancel();
    el.addEventListener("pointerdown", stop);
    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchstart", stop, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchstart", stop);
    };
    // Runs again only to start; the preview finishes on its own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScreen, motionOk]);

  // Cleanup when leaving the page mid-preview.
  useEffect(
    () => () => {
      if (preview.current) cancelAnimationFrame(preview.current.frame);
      clearTimeout(touchRest.current);
      clearTimeout(readyTimer.current);
    },
    [],
  );

  const ready = phase === "ready";
  const running = loops && ready && motionOk && onScreen && !held;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") slide(1);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [running, slide]);

  const arrow = cx(
    "absolute top-[38%] z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-deep shadow-md transition-[opacity,transform,background-color] duration-500 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep motion-safe:hover:scale-105 sm:size-11",
    ready ? "opacity-100" : "pointer-events-none opacity-0",
  );

  return (
    <div>
      {header}
      <div
        className="relative"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
        }}
        onTouchStart={() => {
          clearTimeout(touchRest.current);
          setHeld(true);
        }}
        onTouchEnd={() => {
          clearTimeout(touchRest.current);
          touchRest.current = setTimeout(() => setHeld(false), TOUCH_REST_MS);
        }}
      >
        <ul
          ref={list}
          aria-label={label}
          data-reveal-row
          className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pt-2 pb-5 sm:mx-0 sm:scroll-px-0 sm:gap-6 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {Array.from({ length: copies }, (_, copy) =>
            items.map((item) => {
              const real = copy === realCopy;
              return (
                <li
                  key={`${copy}-${item.key}`}
                  aria-hidden={real ? undefined : true}
                  data-repeat={real ? undefined : true}
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
              tabIndex={ready ? undefined : -1}
              onClick={() => slide(-1)}
              className={cx(arrow, "left-2 lg:-left-5")}
            >
              <ChevronRightIcon width={20} height={20} className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next concerns"
              tabIndex={ready ? undefined : -1}
              onClick={() => slide(1)}
              className={cx(arrow, "right-2 lg:-right-5")}
            >
              <ChevronRightIcon width={20} height={20} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
