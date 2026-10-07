import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { FlashNote } from "@/components/auth/account-menu";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-ui";
import { ToastProvider } from "@/components/ui/toast";
import { WishlistProvider } from "@/components/wishlist/wishlist-ui";
import { cartCount } from "@/lib/cart/server";
import { settings } from "@/lib/env";
import { FLASH_COOKIE } from "@/lib/session/cookies";
import { getSession } from "@/lib/session/session";
import { wishlistCount } from "@/lib/wishlist/server";
import { AnnouncementBar } from "./announcement-bar";
import { Footer } from "./footer";
import { Header } from "./header";

/** Header, main content and footer, with a skip link for keyboard users. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  // A one-time note for this page (e.g. "You're signed out"), set by a server action.
  const note = (await cookies()).get(FLASH_COOKIE)?.value ?? null;
  const [count, session, saved] = await Promise.all([cartCount(), getSession(), wishlistCount()]);
  return (
    <ToastProvider>
      <CartProvider initialCount={count} freeShippingThreshold={settings().freeShippingThreshold}>
        <WishlistProvider signedIn={session.accessToken !== null} initialCount={saved}>
          <a
            href="#main"
            className="sr-only z-50 rounded-full bg-deep px-4 py-2 text-mint focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <AnnouncementBar />
          <Header />
          <main id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
            {children}
          </main>
          <Footer />
          {/* Keyed by the note, so a new note always shows (and the same one isn't shown twice). */}
          <FlashNote key={note ?? "none"} note={note} />
          <CartDrawer />
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  );
}
