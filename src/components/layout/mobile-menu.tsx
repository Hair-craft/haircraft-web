"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { MenuIcon } from "@/components/ui/icons";
import { routes, type NavItem } from "./nav";

/** Phones and tablets: a menu button that opens the categories in a drawer. */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close after navigating (React's "adjust state while rendering" pattern).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
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
                className="block rounded-xl px-3 py-3 font-semibold hover:bg-white/70"
              >
                Shop all
              </Link>
            </li>
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-xl px-3 py-3 hover:bg-white/70">
                  {item.label}
                </Link>
                {item.children.length > 0 ? (
                  <ul className="mb-2 ml-4 border-l border-deep/15 pl-2">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-xl px-3 py-2 text-sm hover:bg-white/70"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          <Link
            href={routes.wishlist}
            className="mt-4 block rounded-xl border-t border-deep/10 px-3 pt-4 pb-3 hover:bg-white/70"
          >
            My wishlist
          </Link>
        </nav>
      </Dialog>
    </div>
  );
}
