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

export async function Header() {
  const [{ items, unavailable }, session] = await Promise.all([loadNav(), getSession()]);
  return (
    <header className="sticky top-0 z-30 border-b border-deep/10 bg-mint/90 backdrop-blur">
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
          className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-deep"
        >
          <Image
            src="/images/logo.png"
            alt="HairCraft home"
            width={73}
            height={64}
            priority
            className="h-12 w-auto lg:h-16"
          />
        </Link>
        <div className="flex flex-1 justify-center">
          <CategoryMenu items={items} />
        </div>
        <nav aria-label="Account and cart" className="flex items-center gap-1">
          {/* The search bar reads the address, so it waits for it; until then, a plain link. */}
          <Suspense
            fallback={
              <Link href={routes.search} className={iconLink} aria-label="Search">
                <SearchIcon />
              </Link>
            }
          >
            <HeaderSearch />
          </Suspense>
          <WishlistLink className="hidden sm:inline-flex" />
          <AccountMenu firstName={session.user ? session.user.firstName || "there" : null} />
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
