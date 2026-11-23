"use client";

import { useEffect, useRef, type RefObject } from "react";

/** How often a home slider moves on by itself (owner, 2026-11-23). */
export const AUTO_SLIDE_MS = 3000;

/** How long it waits after someone touches, clicks, drags or uses a key on it. */
const AFTER_USE_MS = 6000;

/**
 * Moves a slider on by itself every 3 s (owner, 2026-11-23: Shop by concern and
 * Customer favourites slide on their own). It waits while the mouse is over the
 * slider, while something in it has focus, for 6 s after it was used, while
 * it is off screen or the tab is hidden, and never moves with "reduce motion".
 */
export function useAutoSlide(
  box: RefObject<HTMLElement | null>,
  onTick: () => void,
  enabled = true,
  everyMs = AUTO_SLIDE_MS,
) {
  // The latest callback, without restarting the timer when it changes.
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  }, [onTick]);

  useEffect(() => {
    const element = box.current;
    if (!element || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let hover = false;
    let visible = true;
    let usedAt = 0;
    const used = () => {
      usedAt = Date.now();
    };
    const enter = () => {
      hover = true;
    };
    const leave = () => {
      hover = false;
    };
    element.addEventListener("pointerdown", used);
    element.addEventListener("keydown", used);
    element.addEventListener("wheel", used, { passive: true });
    element.addEventListener("mouseenter", enter);
    element.addEventListener("mouseleave", leave);

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          });
    observer?.observe(element);

    const timer = window.setInterval(() => {
      if (hover || !visible || document.hidden) return;
      if (element.contains(document.activeElement)) return;
      if (Date.now() - usedAt < AFTER_USE_MS) return;
      tick.current();
    }, everyMs);

    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
      element.removeEventListener("pointerdown", used);
      element.removeEventListener("keydown", used);
      element.removeEventListener("wheel", used);
      element.removeEventListener("mouseenter", enter);
      element.removeEventListener("mouseleave", leave);
    };
  }, [box, enabled, everyMs]);
}
