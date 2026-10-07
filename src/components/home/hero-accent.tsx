"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/** three.js and React Three Fiber are only downloaded when the accent is actually shown. */
const HeroAccentScene = dynamic(() => import("./hero-accent-scene"), { ssr: false });

/**
 * When to show the 3D accent: a desktop-sized screen, a pointer that can
 * hover (not a phone in landscape), no "reduce motion", and WebGL available.
 * Pure, so the rules are unit-tested.
 */
export function shouldShowAccent(env: {
  wide: boolean;
  finePointer: boolean;
  reducedMotion: boolean;
  webgl: boolean;
}): boolean {
  return env.wide && env.finePointer && !env.reducedMotion && env.webgl;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The decorative 3D accent behind the hero photo. It never delays the page:
 * it is decided after the page has loaded, downloaded when the browser is
 * idle, and paused whenever the hero is scrolled out of view.
 */
export function HeroAccent() {
  const holder = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const decide = () => {
      const show = shouldShowAccent({
        wide: window.matchMedia("(min-width: 1024px)").matches,
        finePointer: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        webgl: hasWebGL(),
      });
      setEnabled(show);
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(decide, { timeout: 2500 })
      : window.setTimeout(decide, 1200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    const element = holder.current;
    if (!enabled || !element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <div
      ref={holder}
      aria-hidden
      data-testid="hero-accent"
      data-active={enabled ? "true" : "false"}
      className="pointer-events-none absolute -inset-x-16 -inset-y-8 -z-0 hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] lg:block"
    >
      {enabled ? <HeroAccentScene active={visible} /> : null}
    </div>
  );
}
