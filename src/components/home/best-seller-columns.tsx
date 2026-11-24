"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { productHref } from "@/components/product/product-card";
import { PhotoPlaceholder } from "@/components/product/photo-placeholder";
import { ProductView } from "@/components/product-page/product-view";
import { CloseIcon } from "@/components/ui/icons";
import type { ProductCard as ProductCardData } from "@/lib/api/types";
import { quickView, type QuickViewResult } from "@/lib/home/quick-view";
import { cx } from "@/lib/cx";

/** Phones: how long each column stands open before the next opens (owner, 2026-11-23). */
const WIDE_MS = 3000;

/** How long a column takes to grow to full width (the sample's 0.6 + 0.1 + 0.7 s). */
const EXPAND_MS = 1400;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Best sellers as tall photo columns, after the owner's sample (Nikolay
 * Talanov's "Satellite", 2026-11-23). The columns slide up one by one when the
 * section comes into view; hovering one brightens it and raises its number;
 * clicking one grows it to fill the section while the others shrink and fade,
 * then opens the product's quick view in it (the product page's own buying
 * panel). The address never changes. ✕, Esc or the back button close it.
 * Each column is still a link to the product, for search engines and for
 * opening in a new tab. The motion is CSS (globals.css, `.hc-cols`).
 */
export function BestSellerColumns({ products }: { products: ProductCardData[] }) {
  const count = products.length;
  const box = useRef<HTMLDivElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const closer = useRef<HTMLButtonElement>(null);
  const pushed = useRef(false);
  const titleId = useId();
  // "static": as the server drew it (visible); "waiting": below the screen, columns
  // lowered; "ready": risen into place.
  const [phase, setPhase] = useState<"static" | "waiting" | "ready">("static");
  const [active, setActive] = useState<number | null>(null);
  const [view, setView] = useState<QuickViewResult | null>(null);
  // The column has finished growing: the quick view shows once this and its data are ready.
  const [grown, setGrown] = useState(false);
  // Phones get the quick view as a full-screen sheet (owner, 2026-11-23).
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  // The page behind the sheet stays still.
  useEffect(() => {
    if (!phone || active === null) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [phone, active]);

  // Phones: the column that stands open (wide), moving on by itself (owner, 2026-11-23).
  const [wide, setWide] = useState(0);
  const touched = useRef(0);
  const shown = grown && view !== null;

  useLayoutEffect(() => {
    const element = box.current;
    if (!element || reducedMotion() || typeof IntersectionObserver === "undefined") return;
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    setPhase("waiting");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        // One frame lowered first, so the rise always plays.
        requestAnimationFrame(() => setPhase("ready"));
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const shut = useCallback(() => {
    setActive((current) => {
      if (current !== null) {
        const back = links.current[current];
        window.setTimeout(() => back?.focus({ preventScroll: true }), 0);
      }
      return null;
    });
    setGrown(false);
  }, []);

  const close = useCallback(() => {
    // Opening added a history step (so the back button closes it): take it back.
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    }
    shut();
  }, [shut]);

  const open = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    // A new tab (Ctrl, ⌘, Shift or middle click) still opens the product page.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    if (active !== null) return;
    setActive(index);
    setView(null);
    setGrown(false);
    window.history.pushState({ hcQuickView: true }, "", window.location.href);
    pushed.current = true;
    // Desktop: the section comes into view while the column grows (phones open a sheet).
    if (!phone)
      box.current?.scrollIntoView({
        behavior: reducedMotion() ? "auto" : "smooth",
        block: "center",
      });
    const slug = products[index].slug;
    // The sheet shows at once on phones; on desktop, once the column has grown.
    window.setTimeout(() => setGrown(true), reducedMotion() || phone ? 0 : EXPAND_MS);
    void quickView(slug)
      .catch(() => ({ ok: false, message: "We couldn't load this product just now." }) as const)
      .then(setView);
  };

  // The back button closes the quick view instead of leaving the page.
  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      shut();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [shut]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  useEffect(() => {
    if (shown) closer.current?.focus({ preventScroll: true });
  }, [shown]);

  // Phones: one column stands open and the next opens every 3 s, going round. It waits
  // while a quick view is open, for 6 s after a touch, off screen, or with "reduce motion".
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 639px)");
    if (count < 2 || reducedMotion()) return;
    let visible = true;
    const element = box.current;
    const observer =
      element && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          })
        : null;
    if (element) observer?.observe(element);
    const timer = window.setInterval(() => {
      if (!phone.matches || !visible || document.hidden || active !== null) return;
      if (Date.now() - touched.current < 6000) return;
      setWide((current) => (current + 1) % count);
    }, WIDE_MS);
    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [active, count]);

  // The quick view's contents: the close button and the product page's buying panel.
  const details = (product: ProductCardData) => (
    <>
      <button
        ref={closer}
        type="button"
        onClick={close}
        aria-label="Close quick view"
        className="hc-col__close"
      >
        <CloseIcon width={22} height={22} />
      </button>
      {view === null ? (
        <p className="p-8 text-sm text-muted" id={titleId}>
          Loading {product.name}…
        </p>
      ) : view.ok ? (
        <ProductView
          product={view.product}
          initialSku={view.initialSku}
          descriptionHtml={view.descriptionHtml}
          quickView={{ titleId }}
        />
      ) : (
        <p className="p-8 text-sm" id={titleId} role="alert">
          {view.message}
        </p>
      )}
    </>
  );

  return (
    <>
      {/* Phones (owner, 2026-11-23: the quick view wasn't mobile friendly inside a 272 px
          column): a full-screen sheet over the page instead. */}
      {phone && active !== null
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={cx("hc-col__sheet", grown && "is-shown")}
            >
              {details(products[active])}
            </div>,
            document.body,
          )
        : null}
      <div
        ref={box}
        className="hc-cols"
        data-phase={phase}
        data-open={(active !== null && !phone) || undefined}
        onPointerDown={() => (touched.current = Date.now())}
        style={{ "--n": count } as CSSProperties}
      >
        {products.map((product, i) => {
          const isActive = active === i;
          return (
            <div
              key={product.id}
              className="hc-col"
              data-active={isActive || undefined}
              data-wide={wide === i || undefined}
              style={{ "--i": i } as CSSProperties}
              inert={(active !== null && !isActive) || undefined}
              aria-hidden={(active !== null && !isActive) || undefined}
            >
              <div className="hc-col__inner">
                <div className="hc-col__bg">
                  {(product.homeImage ?? product.image) ? (
                    <Image
                      // The admin's home thumbnail when chosen (owner, 2026-11-24), else the main photo.
                      src={(product.homeImage ?? product.image)!.large}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 22vw, 60vw"
                      className="object-cover"
                    />
                  ) : (
                    <PhotoPlaceholder />
                  )}
                </div>
                <span aria-hidden className="hc-col__shade" />
                <a
                  ref={(el) => {
                    links.current[i] = el;
                  }}
                  href={productHref(product.slug)}
                  onClick={(event) => open(event, i)}
                  aria-haspopup="dialog"
                  // Opens the quick view, not a page: no loading bar.
                  data-no-progress=""
                  aria-label={`Quick view: ${product.name}`}
                  tabIndex={isActive ? -1 : undefined}
                  className="hc-col__link"
                >
                  <span className="hc-col__name">{product.name}</span>
                </a>
              </div>

              {isActive && !phone ? (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={titleId}
                  className={cx("hc-col__panel", shown && "is-shown")}
                >
                  {details(product)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
