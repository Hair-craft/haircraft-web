"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

const loadFeatures = () => import("./features").then((module) => module.default);

/**
 * Lets `m.*` components animate once Framer Motion's engine has loaded in the
 * background. Until then (a fraction of a second after the page is usable)
 * they render without animating, so nothing waits for it.
 */
export function LazyMotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
