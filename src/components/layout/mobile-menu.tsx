"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { MenuIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import { routes, type NavItem } from "./nav";

/** The address is this page or one under it. */
const within = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Phones (and narrow tablets): a menu button that opens the categories in a
 * side drawer. A category with sub-categories has a drop-down (+ / −, a
 * disclosure button) that opens them in place; the one you're in starts open.
 */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const base = useId();
  // The category open now: the one this page is in, until another is chosen.
  const [expanded, setExpanded] = useState<string | null>(
    () =>
      items.find((item) => item.children.length > 0 && within(pathname, item.href))?.href ?? null,
  );
  // Close after navigating (React's "adjust state while rendering" pattern).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="rounded-full p-2 hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep"
      >
        <MenuIcon />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Menu" placement="left">
        <nav aria-label="Categories">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                href={routes.shop}
                aria-current={pathname === routes.shop ? "page" : undefined}
                className="block rounded-xl px-3 py-3 font-accent font-semibold hover:bg-white"
              >
                Shop all
              </Link>
            </li>
            {items.map((item, i) => {
              const panel = `${base}-sub-${i}`;
              const isOpen = expanded === item.href;
              const current = within(pathname, item.href);
              return (
                <li key={item.href}>
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cx(
                        "flex-1 rounded-xl px-3 py-3 font-accent hover:bg-white",
                        current && "font-semibold",
                      )}
                    >
                      {item.label}
                    </Link>
                    {item.children.length > 0 ? (
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panel}
                        aria-label={`${isOpen ? "Hide" : "Show"} ${item.label} types`}
                        onClick={() => setExpanded(isOpen ? null : item.href)}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg hover:bg-white focus-visible:outline-2 focus-visible:outline-deep"
                      >
                        <span aria-hidden>{isOpen ? "−" : "+"}</span>
                      </button>
                    ) : null}
                  </div>
                  {item.children.length > 0 ? (
                    <ul id={panel} hidden={!isOpen} className="mb-2 ml-4 border-l border-line pl-2">
                      <li>
                        <Link
                          href={item.href}
                          className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-white"
                        >
                          All {item.label}
                        </Link>
                      </li>
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            aria-current={pathname === child.href ? "page" : undefined}
                            className="block rounded-xl px-3 py-2 text-sm hover:bg-white"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <Link
            href={routes.wishlist}
            className="mt-4 block rounded-xl border-t border-line px-3 pt-4 pb-3 font-accent hover:bg-white"
          >
            My wishlist
          </Link>
        </nav>
      </Dialog>
    </div>
  );
}
