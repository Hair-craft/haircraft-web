"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { NavItem } from "./nav";

/**
 * Desktop category bar. A category with sub-categories opens a small panel
 * (disclosure pattern): click or Enter/Space toggles it, Escape closes it
 * and returns focus, and it closes when focus or the pointer leaves.
 */
export function CategoryMenu({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Categories" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) =>
          item.children.length > 0 ? (
            <MenuWithChildren key={item.href} item={item} />
          ) : (
            <li key={item.href}>
              <NavLink href={item.href} label={item.label} />
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "rounded-full px-3 py-2 text-sm tracking-wide transition-colors hover:bg-deep/5",
        "focus-visible:outline-2 focus-visible:outline-deep",
        active && "font-semibold",
      )}
    >
      {label}
    </Link>
  );
}

function MenuWithChildren({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const container = useRef<HTMLLIElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // The panel was just opened by the pointer arriving: the click that follows
  // must not close it again.
  const openedByHover = useRef(false);
  const pathname = usePathname();

  // Close after navigating (React's "adjust state while rendering" pattern).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  return (
    <li
      ref={container}
      className="relative"
      onMouseEnter={() => {
        if (!open) openedByHover.current = true;
        setOpen(true);
      }}
      onMouseLeave={() => {
        openedByHover.current = false;
        setOpen(false);
      }}
      onBlur={(event) => {
        if (!container.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          setOpen((value) => !value);
        }}
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm tracking-wide hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep"
      >
        {item.label}
        <ChevronDownIcon
          width={14}
          height={14}
          className={cx("transition-transform", open && "rotate-180")}
        />
      </button>
      <div id={panelId} hidden={!open} className="absolute top-full left-0 z-40 min-w-56 pt-2">
        <ul className="rounded-2xl border border-deep/10 bg-white p-2 shadow-xl">
          <li>
            <Link
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-mint focus-visible:outline-2 focus-visible:outline-deep"
            >
              All {item.label}
            </Link>
          </li>
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className="block rounded-xl px-3 py-2 text-sm hover:bg-mint focus-visible:outline-2 focus-visible:outline-deep"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
