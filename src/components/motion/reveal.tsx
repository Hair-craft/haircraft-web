"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Phase = "static" | "waiting" | "shown";

/**
 * Fades and lifts its content in, once, when it scrolls into view.
 *
 * Content is rendered visible on the server and stays visible without
 * JavaScript; only sections that start below the screen are hidden (after
 * the page has loaded, before anyone scrolls to them) and then revealed.
 * With "reduce motion" switched on nothing moves.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("static");

  useEffect(() => {
    const element = ref.current;
    if (
      !element ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          // Already on screen when the page loaded: never hide it.
          setPhase(entry.isIntersecting ? "static" : "waiting");
          if (entry.isIntersecting) observer.disconnect();
          return;
        }
        if (entry.isIntersecting) {
          setPhase("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Plain CSS (no animation library): hidden while waiting, then a 0.7 s fade and lift.
  return (
    <div
      ref={ref}
      className={cx(
        className,
        phase === "waiting" && "translate-y-7 opacity-0",
        phase === "shown" &&
          "translate-y-0 opacity-100 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
      style={phase === "shown" && delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
