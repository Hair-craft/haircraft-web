import type { CSSProperties } from "react";

/** How the admin framed a Best seller's home photo (owner, 2026-11-24). */
export interface HomeFocus {
  x: number;
  y: number;
  zoom: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/**
 * The photo's style for a framing: the chosen point stays in view in every card
 * shape (tall strips, the open card, phone cards), zoomed from that point.
 * No framing: centred and unzoomed, as before.
 */
export function homeFocusStyle(focus: HomeFocus | null | undefined): CSSProperties | undefined {
  if (!focus) return undefined;
  const x = clamp(focus.x, 0, 100);
  const y = clamp(focus.y, 0, 100);
  const zoom = clamp(focus.zoom, 1, 3);
  return {
    objectPosition: `${x}% ${y}%`,
    ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` } : {}),
  };
}
