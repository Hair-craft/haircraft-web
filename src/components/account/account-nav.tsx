"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { signOutAction } from "@/lib/session/actions";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/reviews", label: "My reviews" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/security", label: "Password and security" },
  { href: "/wishlist", label: "My wishlist" },
] as const;

/** The current page, including an address being added or edited under Addresses. */
function isCurrent(pathname: string, href: string) {
  return href === "/account"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The account menu: a column beside the page on computers, a row of tabs
 * that scrolls sideways on phones.
 */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="My account" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {LINKS.map((link) => {
          const current = isCurrent(pathname, link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "block rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-deep lg:rounded-xl lg:py-2.5 lg:text-base",
                  current
                    ? "bg-deep font-medium text-mint"
                    : "bg-white/70 hover:bg-white lg:bg-transparent lg:hover:bg-white/70",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={signOutAction} className="mt-6 hidden border-t border-deep/10 pt-4 lg:block">
        <button
          type="submit"
          className="rounded-xl px-4 py-2.5 text-deep/70 hover:bg-white/70 hover:text-deep focus-visible:outline-2 focus-visible:outline-deep"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
