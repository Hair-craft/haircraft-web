"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { ChevronDownIcon } from "@/components/ui/icons";
import { splitMenu, type NavItem } from "./nav";

/**
 * Category bar, from tablet width up (phones use the menu button). The
 * first five categories sit in the bar; any more go under "More". A
 * category with sub-categories opens a small panel (disclosure pattern):
 * click or Enter/Space toggles it, Escape closes it and returns focus, and
 * it closes when focus or the pointer leaves.
 */
export function CategoryMenu({ items }: { items: NavItem[] }) {
  const { shown, more } = splitMenu(items);
  return (
    <nav aria-label="Categories" className="hidden md:block">
      <ul className="flex items-center gap-0.5 lg:gap-1">
        {shown.map((item) =>
          item.children.length > 0 ? (
            <DropDown key={item.href} label={item.label}>
              <PanelLink href={item.href} strong>
                All {item.label}
              </PanelLink>
              {item.children.map((child) => (
                <PanelLink key={child.href} href={child.href}>
                  {child.label}
                </PanelLink>
              ))}
            </DropDown>
          ) : (
            <li key={item.href}>
              <NavLink href={item.href} label={item.label} />
            </li>
          ),
        )}
        {more.length > 0 ? (
          <DropDown label="More" alignRight>
            {more.map((item) => (
              <li key={item.href}>
                <ul>
                  <PanelLink href={item.href} strong>
                    {item.label}
                  </PanelLink>
                  {item.children.map((child) => (
                    <PanelLink key={child.href} href={child.href} indent>
                      {child.label}
                    </PanelLink>
                  ))}
                </ul>
              </li>
            ))}
          </DropDown>
        ) : null}
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
        "rounded-full px-2 py-2 text-sm tracking-wide whitespace-nowrap transition-colors hover:bg-deep/5 lg:px-3",
        "focus-visible:outline-2 focus-visible:outline-deep",
        active && "font-semibold",
      )}
    >
      {label}
    </Link>
  );
}

function PanelLink({
  href,
  strong,
  indent,
  children,
}: {
  href: string;
  strong?: boolean;
  indent?: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cx(
          "block rounded-xl px-3 py-2 text-sm hover:bg-mint focus-visible:outline-2 focus-visible:outline-deep",
          strong && "font-semibold",
          indent && "pl-6",
        )}
      >
        {children}
      </Link>
    </li>
  );
}

/** A bar item that opens a panel of links. */
function DropDown({
  label,
  alignRight,
  children,
}: {
  label: string;
  /** "More" sits at the end of the bar: its panel opens towards the left. */
  alignRight?: boolean;
  children: ReactNode;
}) {
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
        className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-sm tracking-wide whitespace-nowrap hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep lg:px-3"
      >
        {label}
        <ChevronDownIcon
          width={14}
          height={14}
          className={cx("transition-transform", open && "rotate-180")}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className={cx("absolute top-full z-40 min-w-56 pt-2", alignRight ? "right-0" : "left-0")}
      >
        <ul className="max-h-[70vh] overflow-y-auto rounded-2xl border border-deep/10 bg-white p-2 shadow-xl">
          {children}
        </ul>
      </div>
    </li>
  );
}
