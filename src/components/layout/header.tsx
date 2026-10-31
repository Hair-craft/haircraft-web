import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { HeaderSearch } from "@/components/search/header-search";
import { getCategories } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import { AccountMenu } from "@/components/auth/account-menu";
import { CartButton } from "@/components/cart/cart-ui";
import { SearchIcon } from "@/components/ui/icons";
import { WishlistLink } from "@/components/wishlist/wishlist-ui";
import { getSession } from "@/lib/session/session";
import { business } from "@/content/business";
import { whatsappChatHref } from "@/lib/info/contact";
import { CategoryMenu } from "./category-menu";
import { MobileMenu } from "./mobile-menu";
import { categoryNav, routes, type NavItem } from "./nav";

const iconLink =
  "rounded-full p-2 transition-colors hover:bg-deep/5 focus-visible:outline-2 focus-visible:outline-deep";

/** Loads the menu; if the API is down the header still renders, with a notice. */
async function loadNav(): Promise<{ items: NavItem[]; unavailable: boolean }> {
  try {
    return { items: categoryNav(await getCategories()), unavailable: false };
  } catch (error) {
    if (!isApiError(error)) console.error("Loading categories failed", error);
    return { items: [], unavailable: true };
  }
}

function ChatIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
    >
      <path d="M4 5h16v11H9l-5 4V5Z" />
    </svg>
  );
}

export async function Header() {
  const consultHref = whatsappChatHref(business);
  const [{ items, unavailable }, session] = await Promise.all([loadNav(), getSession()]);
  return (
    <header className="sticky top-0 z-30 bg-white/95 shadow-[0_4px_20px_rgba(11,41,26,0.06)] backdrop-blur-md">
      {unavailable ? (
        <p role="status" className="bg-gold/20 px-4 py-2 text-center text-sm">
          We can&apos;t reach the shop right now, so some things may be missing. Please try again in
          a moment.
        </p>
      ) : null}
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-22">
        <MobileMenu items={items} />
        <Link
          href={routes.home}
          className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-deep"
        >
          <Image
            src="/images/logo.png"
            alt="HairCraft home"
            width={73}
            height={64}
            priority
            className="h-9 w-auto lg:h-10"
          />
          <span aria-hidden className="hidden flex-col xl:flex">
            <span className="font-display text-xl leading-none font-semibold tracking-tight text-deep">
              HairCraft
            </span>
            <span className="mt-1 text-[0.625rem] font-bold tracking-[0.15em] text-gold-ink uppercase">
              Luxury Human Hair Co.
            </span>
          </span>
        </Link>
        <div className="flex flex-1 justify-center">
          <CategoryMenu items={items} />
        </div>
        <nav aria-label="Account and cart" className="flex items-center gap-1.5">
          {/* The search bar reads the address, so it waits for it; until then, a plain link. */}
          <Suspense
            fallback={
              <Link href={routes.search} className={iconLink} aria-label="Search">
                <SearchIcon />
              </Link>
            }
          >
            <HeaderSearch popular={items.map(({ label, href }) => ({ label, href }))} />
          </Suspense>
          {consultHref ? (
            <a
              href={consultHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-1 hidden items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-sage-ink transition-colors hover:bg-mint-deep focus-visible:outline-2 focus-visible:outline-deep xl:inline-flex"
            >
              <ChatIcon />
              Consultation
              <span className="sr-only"> on WhatsApp (opens in a new tab)</span>
            </a>
          ) : null}
          <WishlistLink className="hidden sm:inline-flex" />
          <AccountMenu firstName={session.user ? session.user.firstName || "there" : null} />
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
