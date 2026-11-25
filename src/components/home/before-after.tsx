"use client";

import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * A before / after comparison (owner, 2026-11-25, after a CodePen "video
 * compare"): the After photo fills the frame and the Before photo is shown on
 * the left up to the divider, which follows the pointer (mouse or finger), so
 * moving across the photo wipes from one to the other. Keyboard: the divider
 * is a slider (arrow keys, Home, End). Both are short looping animations.
 */
export function BeforeAfter({
  before,
  after,
  beforeAlt,
  afterAlt,
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);

  const track = (event: PointerEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(clamp(((event.clientX - rect.left) / rect.width) * 100));
  };

  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    const next: Record<string, number> = {
      ArrowLeft: position - step,
      ArrowDown: position - step,
      ArrowRight: position + step,
      ArrowUp: position + step,
      Home: 0,
      End: 100,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    setPosition(clamp(next[event.key]));
  };

  return (
    <div
      ref={box}
      className="hc-compare relative aspect-[267/357] w-full touch-pan-y overflow-hidden rounded-3xl bg-sand shadow-[0_24px_48px_-24px_rgba(11,41,26,0.45)] select-none"
      onPointerMove={track}
      onPointerDown={track}
    >
      {/* After: the whole frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- animated WebP, served as is */}
      <img
        src={after}
        alt={afterAlt}
        width={267}
        height={357}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Before: the same frame, cut off at the divider. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- animated WebP, served as is */}
      <img
        src={before}
        alt={beforeAlt}
        width={267}
        height={357}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-deep/75 px-3.5 py-1.5 text-xs font-bold tracking-widest text-white uppercase backdrop-blur-sm">
        Before
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold tracking-widest text-deep uppercase">
        After
      </span>

      {/* The divider and its handle; the handle is the keyboard slider. */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]"
        style={{ left: `${position}%` }}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)}% before`}
          onKeyDown={key}
          className="pointer-events-auto absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-deep shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
