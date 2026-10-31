"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { business } from "@/content/business";
import { cx } from "@/lib/cx";
import { whatsappChatHref } from "@/lib/info/contact";
import { signOutAction } from "@/lib/session/actions";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/reviews", label: "My reviews" },
  { href: "/wishlist", label: "My wishlist" },
  { href: "/account/security", label: "Password and security" },
] as const;

/** The current page, including an address being added or edited under Addresses. */
function isCurrent(pathname: string, href: string) {
  return href === "/account"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The account menu, after the owner's design: a white card beside the page
 * on computers (the current page in deep green with a gold dot, a help box
 * and Sign out under it); a row of tabs that scrolls sideways on phones.
 */
export function AccountNav() {
  const pathname = usePathname();
  const whatsapp = whatsappChatHref(business);
  return (
    <nav
      aria-label="My account"
      className="min-w-0 lg:sticky lg:top-28 lg:self-start lg:rounded-xl lg:bg-white lg:p-4 lg:shadow-sm"
    >
      <p className="hidden px-3 py-2 text-[0.625rem] font-bold tracking-[0.15em] text-muted uppercase lg:block">
        My account
      </p>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:mt-2 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0">
        {LINKS.map((link) => {
          const current = isCurrent(pathname, link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "flex items-center justify-between gap-3 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-deep lg:rounded-lg lg:px-3.5 lg:py-3 lg:text-xs",
                  current
                    ? "bg-deep text-white shadow-sm"
                    : "bg-white hover:bg-sand lg:bg-transparent",
                )}
              >
                {link.label}
                {current ? (
                  <span aria-hidden className="hidden size-2 rounded-full bg-gold lg:inline" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {whatsapp ? (
        <div className="mt-6 hidden rounded-lg bg-sand p-3 lg:block">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-deep text-white"
            >
              ✦
            </span>
            <span>
              <span className="block text-xs font-semibold">Need help?</span>
              <span className="block text-[0.8125rem] text-muted">We reply on WhatsApp</span>
            </span>
          </div>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block rounded-full bg-white py-2 text-center text-xs font-semibold shadow-sm transition-colors hover:bg-sand-deep focus-visible:outline-2 focus-visible:outline-deep"
          >
            Chat on WhatsApp
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      ) : null}
      <form action={signOutAction} className="mt-4 hidden lg:block">
        <button
          type="submit"
          className="w-full rounded-lg px-3.5 py-2.5 text-left text-xs font-semibold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/30 focus-visible:outline-2 focus-visible:outline-deep"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
