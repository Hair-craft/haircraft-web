"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { spotSlot, spotStep, waitingCards } from "@/lib/home/spotlight";

export interface SpotlightItem {
  key: string;
  title: string;
  line: string | null;
  href: string;
  photo: { src: string; alt: string } | null;
  /** For screen readers: what the link shops ("Toppers, Wigs"). */
  shops: string;
}

/**
 * Shop by concern as a spotlight slider (owner, 2026-11-23, after MDJAmin's
 * sample): the current concern's photo fills the box, its title, line and
 * "Shop now" rise in out of a blur on the left, and the next ones wait on the
 * right as small cards. ◁ ▷, the arrow keys, a swipe or a tap on a small card
 * move it on. It never moves by itself: only this effect, as in the sample
 * (owner, 2026-11-23). The positions are CSS (globals.css, `.hc-spot`).
 */
export function ConcernSpotlight({
  label,
  header,
  items,
}: {
  label: string;
  header: ReactNode;
  items: SpotlightItem[];
}) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState("");
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);

  const go = useCallback(
    (next: number, byHand: boolean) => {
      setActive(next);
      if (byHand) setAnnounce(`${next + 1} of ${count}: ${items[next].title}`);
    },
    [count, items],
  );
  const step = (by: number) => go(spotStep(active, by, count), true);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? 1 : -1);
  };

  // A sideways swipe moves it on; an up-and-down one scrolls the page as usual.
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
  };

  const current = items[active];

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} onKeyDown={onKeyDown}>
      {header}
      <div
        className="hc-spot"
        style={{ "--qn": waitingCards(count) } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (swipe.current = null)}
      >
        {items.map((item, i) => {
          const slot = spotSlot(i, active, count);
          const waiting = slot === "q1" || slot === "q2" || slot === "q3";
          return (
            <div key={item.key} className="hc-spot__item" data-slot={slot} aria-hidden>
              {item.photo ? (
                // Three layers of the same photo (owner, 2026-11-23: the big card shows the
                // whole photo): filling a small card; blurred, filling the big one; and the
                // whole photo, uncropped, in the middle of the big one. CSS fades between them.
                <>
                  <Image
                    src={item.photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 80vw, 100vw"
                    priority={i === 0}
                    className="hc-spot__photo object-cover"
                  />
                  <Image
                    src={item.photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 80vw, 100vw"
                    className="hc-spot__blur object-cover"
                  />
                  <Image
                    src={item.photo.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 80vw, 100vw"
                    priority={i === 0}
                    className="hc-spot__whole object-contain"
                  />
                </>
              ) : null}
              {waiting ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => go(i, true)}
                  aria-label={`Show ${item.title}`}
                />
              ) : null}
            </div>
          );
        })}

        {/* Re-keyed on each change, so the words rise in again (the sample's blur-up). */}
        <div key={current.key} className="hc-spot__content">
          <h3 className="hc-spot__rise hc-spot__name">{current.title}</h3>
          {current.line ? (
            <p className="hc-spot__rise hc-spot__des [animation-delay:0.4s]">{current.line}</p>
          ) : null}
          <Link href={current.href} className="hc-spot__rise hc-spot__more [animation-delay:0.8s]">
            See More
            <span className="sr-only">
              : {current.title} ({current.shops})
            </span>
          </Link>
        </div>

        {count > 1 ? (
          <div className="hc-spot__buttons">
            <button
              type="button"
              aria-label="Previous concern"
              onClick={() => step(-1)}
              className="hc-spot__button"
            >
              <span aria-hidden>◁</span>
            </button>
            <button
              type="button"
              aria-label="Next concern"
              onClick={() => step(1)}
              className="hc-spot__button"
            >
              <span aria-hidden>▷</span>
            </button>
          </div>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
      {/* Every concern as a plain link, for search engines and screen readers. */}
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.key}>
            <a href={item.href} tabIndex={-1}>
              {item.title}
              {item.line ? ` — ${item.line}` : ""}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
