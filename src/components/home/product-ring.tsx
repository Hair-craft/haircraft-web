"use client";

import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "@/lib/cx";
import {
  faceAngle,
  frontIndex,
  parallaxShift,
  restingRotation,
  ringFaces,
  ringStep,
  rotationFor,
} from "@/lib/home/ring";

export interface RingItem {
  key: string;
  /** The product card, rendered on the server. */
  node: ReactNode;
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Products standing round a 3D ring that you drag or swipe to spin (owner,
 * 2026-11-23, after a GSAP image ring they sent): it carries on a little after
 * a flick and settles with one card at the front, each photo shifts as its
 * card turns (parallax), the cards rise in one by one when the section comes
 * into view, and hovering a card dims the others. The ‹ › buttons and the
 * arrow keys turn it one card at a time; tabbing to a card turns it to the
 * front. The geometry is in CSS (globals.css, `.hc-ring`), so the server's
 * HTML already stands as a ring; with "reduce motion" it is a plain sideways row.
 */
export function ProductRing({ label, items }: { label: string; items: RingItem[] }) {
  const products = items.length;
  // Few products go round more than once, so the ring is always full; the repeats
  // are only for the eye (hidden from screen readers, can't be tabbed to).
  const count = ringFaces(products);
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLUListElement>(null);
  const faces = useRef<(HTMLLIElement | null)[]>([]);
  const state = useRef({ rotation: 0 });
  const [front, setFront] = useState(0);

  const apply = useCallback(() => {
    const rotation = state.current.rotation;
    ring.current?.style.setProperty("--rot", `${rotation}deg`);
    faces.current.forEach((face, i) => {
      if (!face) return;
      const angle = faceAngle(i, rotation, count);
      face.style.setProperty("--px", `${parallaxShift(angle)}px`);
      // Cards turned away can't be clicked through the ones in front.
      face.toggleAttribute("data-back", Math.abs(angle) > 100);
    });
    const next = frontIndex(rotation, count);
    setFront((current) => (current === next ? current : next));
  }, [count]);

  const turnTo = useCallback(
    (rotation: number, duration = 0.7, ease = "power3.out") => {
      gsap.to(state.current, { rotation, duration, ease, overwrite: true, onUpdate: apply });
    },
    [apply],
  );

  const move = useCallback(
    (by: number, focus = false) => {
      const target = Math.round(state.current.rotation / ringStep(count)) * ringStep(count);
      const rotation = target - by * ringStep(count);
      if (reducedMotion()) {
        state.current.rotation = rotation;
        apply();
      } else turnTo(rotation);
      if (focus) {
        const index = frontIndex(rotation, count) % products;
        faces.current[index]?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
      }
    },
    [apply, count, products, turnTo],
  );

  // The entrance: if the ring is still below the screen, its cards wait lower down
  // and rise in one by one (the given code's y:200, stagger 0.1) as it turns into place.
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element || reducedMotion() || typeof IntersectionObserver === "undefined") {
      apply();
      return;
    }
    const rises = faces.current.map((face) => face?.firstElementChild).filter(Boolean);
    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      apply();
      return;
    }
    gsap.set(rises, { y: 200, opacity: 0 });
    state.current.rotation = ringStep(count) * 2;
    apply();
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        gsap.to(rises, { y: 0, opacity: 1, duration: 1.5, stagger: 0.1, ease: "expo.out" });
        turnTo(0, 1.6, "power3.out");
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      gsap.killTweensOf(rises);
      gsap.set(rises, { clearProps: "transform,opacity" });
    };
  }, [apply, count, turnTo]);

  // Dragging: a sideways drag spins the ring (one card's width turns it one card);
  // an up-and-down one is left to the page, so scrolling still works over it.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const tween = state.current;
    let pointer = -1;
    let deciding = false;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    // Where the drag wants the ring; the ring glides after it (as in the sample, which
    // tweens to each new position), so a jerky mouse or finger still turns it smoothly.
    let target = 0;
    let swallowClick = false;
    const width = () => ring.current?.offsetWidth || 260;

    const down = (event: PointerEvent) => {
      if (reducedMotion() || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointer = event.pointerId;
      startX = lastX = event.clientX;
      startY = event.clientY;
      lastTime = event.timeStamp;
      velocity = 0;
      deciding = true;
      dragging = false;
    };
    const drag = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (deciding) {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        deciding = false;
        if (Math.abs(dy) > Math.abs(dx)) {
          pointer = -1;
          return;
        }
        dragging = true;
        element.setPointerCapture(event.pointerId);
        element.dataset.dragging = "";
        target = tween.rotation;
      }
      if (!dragging) return;
      const delta = ((event.clientX - lastX) * ringStep(count)) / width();
      const elapsed = Math.max(1, event.timeStamp - lastTime);
      velocity = velocity * 0.6 + (delta / elapsed) * 0.4;
      lastX = event.clientX;
      lastTime = event.timeStamp;
      target += delta;
      gsap.to(tween, {
        rotation: target,
        duration: 0.5,
        ease: "power2.out",
        overwrite: true,
        onUpdate: apply,
      });
    };
    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      pointer = -1;
      deciding = false;
      if (!dragging) return;
      dragging = false;
      delete element.dataset.dragging;
      // The click that ends a drag must not open the card under the finger.
      swallowClick = true;
      window.setTimeout(() => (swallowClick = false), 350);
      // A pause before letting go is a stop, not a flick.
      const still = event.timeStamp - lastTime > 120;
      turnTo(restingRotation(target, still ? 0 : velocity, count), 1.1);
    };
    const click = (event: MouseEvent) => {
      if (!swallowClick) return;
      event.preventDefault();
      event.stopPropagation();
      swallowClick = false;
    };
    const noDrag = (event: DragEvent) => event.preventDefault();

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", drag);
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("click", click, true);
    element.addEventListener("dragstart", noDrag);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", drag);
      element.removeEventListener("pointerup", release);
      element.removeEventListener("pointercancel", release);
      element.removeEventListener("click", click, true);
      element.removeEventListener("dragstart", noDrag);
      gsap.killTweensOf(tween);
    };
  }, [apply, count, turnTo]);

  /** Turn the ring the short way to the nearest panel showing product `index`. */
  const goTo = (index: number) => {
    const rotation = state.current.rotation;
    let best = rotationFor(index, rotation, count);
    for (let face = index + products; face < count; face += products) {
      const candidate = rotationFor(face, rotation, count);
      if (Math.abs(candidate - rotation) < Math.abs(best - rotation)) best = candidate;
    }
    if (reducedMotion()) {
      state.current.rotation = best;
      apply();
    } else turnTo(best, 0.9);
  };

  const onFocus = (event: FocusEvent<HTMLUListElement>) => {
    const index = faces.current.findIndex((face) => face?.contains(event.target));
    // Already showing this product at the front (perhaps one of its repeats): stay put.
    if (index < 0 || index === frontIndex(state.current.rotation, count) % products) return;
    const rotation = rotationFor(index, state.current.rotation, count);
    if (reducedMotion()) {
      state.current.rotation = rotation;
      apply();
    } else turnTo(rotation);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (!(event.target instanceof HTMLElement) || !ring.current?.contains(event.target)) return;
    event.preventDefault();
    move(event.key === "ArrowRight" ? 1 : -1, true);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="hc-ring-wrap"
      data-front={front}
      onKeyDown={onKeyDown}
    >
      <div ref={stage} className="hc-ring-stage -mx-4 sm:-mx-6">
        <ul
          ref={ring}
          className="hc-ring"
          style={{ "--n": count } as CSSProperties}
          onFocus={onFocus}
        >
          {Array.from({ length: count }, (_, i) => {
            const item = items[i % products];
            const copy = i >= products;
            return (
              <li
                key={copy ? `${item.key}-${i}` : item.key}
                ref={(el) => {
                  faces.current[i] = el;
                }}
                className="hc-ring-face"
                style={{ "--i": i } as CSSProperties}
                data-copy={copy || undefined}
                aria-hidden={copy || undefined}
                inert={copy || undefined}
              >
                <div className="h-full">{item.node}</div>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Dots instead of arrows and a counter (owner, 2026-11-23): one per product; the
          one at the front is filled, and a tap turns the ring to it. */}
      <div className="hc-ring-controls mt-6 flex items-center justify-center gap-1">
        {items.map((item, index) => {
          const current = front % products === index;
          return (
            <button
              key={item.key}
              type="button"
              aria-label={`Show product ${index + 1} of ${products}`}
              aria-current={current || undefined}
              onClick={() => goTo(index)}
              className="group grid size-7 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-deep"
            >
              <span
                aria-hidden
                className={cx(
                  "block h-2.5 rounded-full transition-all duration-500 ease-out",
                  current ? "w-7 bg-deep" : "w-2.5 bg-deep/25 group-hover:bg-deep/50",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
