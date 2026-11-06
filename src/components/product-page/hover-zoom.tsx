"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

/** How much the zoomed view enlarges the photo. */
const ZOOM = 2.5;
/** The zoomed view's width, as a share of the photo's (it must fit over the buying panel). */
const PANE = 0.72;

interface View {
  /** The lens over the photo (px, relative to the photo's box). */
  lens: { left: number; top: number; width: number; height: number };
  /** The zoomed view's background size and position (px). */
  size: string;
  position: string;
}

/**
 * Amazon-style zoom (owner, 2026-11-06): on a computer with a mouse,
 * hovering over the large photo shows a lens over it and, beside the photo,
 * that area enlarged from the full-size file. It follows the mouse and goes
 * when the mouse leaves. Nothing changes on touch screens (tap opens the
 * full-screen view there). Decorative for screen readers: the full-screen
 * view stays the accessible way to see detail.
 */
export function HoverZoom({ src, children }: { src: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [canHover, setCanHover] = useState(false);
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const onMove = (event: MouseEvent) => {
    const el = box.current;
    const img = el?.querySelector("img");
    if (!el || !img || !img.naturalWidth) return;
    const rect = el.getBoundingClientRect();
    // Where the photo is drawn inside the box (it is fitted, not cropped).
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const drawnW = img.naturalWidth * scale;
    const drawnH = img.naturalHeight * scale;
    const offsetX = (rect.width - drawnW) / 2;
    const offsetY = (rect.height - drawnH) / 2;
    // The lens covers what the zoomed view shows: its size divided by the zoom.
    const lensW = Math.min((rect.width * PANE) / ZOOM, drawnW);
    const lensH = Math.min((rect.height * PANE) / ZOOM, drawnH);
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const left = clamp(event.clientX - rect.left - lensW / 2, offsetX, offsetX + drawnW - lensW);
    const top = clamp(event.clientY - rect.top - lensH / 2, offsetY, offsetY + drawnH - lensH);
    setView({
      lens: { left, top, width: lensW, height: lensH },
      size: `${drawnW * ZOOM}px ${drawnH * ZOOM}px`,
      position: `${-(left - offsetX) * ZOOM}px ${-(top - offsetY) * ZOOM}px`,
    });
  };

  return (
    <div
      ref={box}
      className="relative"
      onMouseMove={canHover ? onMove : undefined}
      onMouseLeave={() => setView(null)}
      data-hover-zoom
    >
      {children}
      {view ? (
        <>
          <span
            aria-hidden
            data-zoom-lens
            className="pointer-events-none absolute z-10 rounded-md border border-deep/30 bg-white/30 shadow-sm"
            style={view.lens}
          />
          {/* Beside the photo, over the buying panel (desktop only: the gallery shows it there). */}
          <span
            aria-hidden
            data-zoom-view
            className="pointer-events-none absolute top-0 left-[calc(100%+3rem)] z-30 hidden aspect-square w-[72%] overflow-hidden rounded-2xl bg-white bg-no-repeat shadow-2xl ring-1 ring-black/5 lg:block"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundSize: view.size,
              backgroundPosition: view.position,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
