"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Give up (and hide the bar) if a page takes longer than this. */
const SAFETY_MS = 20_000;

type Phase = "idle" | "loading" | "done";

/** Where a loading bar started, so it finishes when the page changes. */
type Started = { from: string } | null;

/**
 * A slim bar across the top of the screen from the moment a link is tapped
 * until the new page arrives (owner, 2026-11-06: "the product pages are not
 * open"). Shop pages are rendered whole on the server before they are sent
 * (so a missing product is a real 404), which takes a second or two; without
 * this, nothing on screen showed that the tap had worked.
 *
 * It follows ordinary same-site links only: not new tabs, downloads, links
 * with a modifier key, or links marked `data-no-progress` (the option
 * choices on a product page change the URL without a new page).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  const [started, setStarted] = useState<Started>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Loading until the page changes; then "done" briefly while it fades.
  const phase: Phase = started === null ? "idle" : started.from === here ? "loading" : "done";

  // A new page arrived: let the full bar fade, then remove it.
  useEffect(() => {
    if (phase !== "done") return;
    clearTimeout(safety.current);
    const timer = setTimeout(() => setStarted(null), 400);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const link = (event.target as Element | null)?.closest?.("a");
      if (!link || link.hasAttribute("download") || link.hasAttribute("data-no-progress")) return;
      const target = link.getAttribute("target");
      if (target && target !== "_self") return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || /^(mailto|tel|sms|whatsapp):/i.test(href)) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // The same page (or only its #section): nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      clearTimeout(safety.current);
      setStarted({
        // Written the way useSearchParams() writes it, so it matches `here`.
        from: `${window.location.pathname}?${new URLSearchParams(window.location.search).toString()}`,
      });
      safety.current = setTimeout(() => setStarted(null), SAFETY_MS);
    };
    // Capturing: the shop's links handle (and prevent) the click themselves to
    // move without a reload, so the bar must see it first.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(safety.current);
    };
  }, []);

  if (phase === "idle") return null;
  return (
    <div
      aria-hidden
      data-navigation-progress={phase}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
    >
      <div
        className={
          phase === "loading"
            ? "h-full w-[85%] origin-left animate-[hc-nav-progress_8s_cubic-bezier(0.1,0.7,0.2,1)_both] bg-gold shadow-[0_0_8px_rgba(201,154,91,0.7)] motion-reduce:animate-none"
            : "h-full w-full bg-gold opacity-0 transition-opacity duration-300"
        }
      />
    </div>
  );
}
