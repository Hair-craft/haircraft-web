import type { Metadata } from "next";
import { ShopChrome } from "@/components/layout/shop-chrome";
import { NotFoundMessage } from "@/components/not-found-message";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * An address that matches no page at all: there is no shop layout around it,
 * so the header and footer are added here. (A shop page that finds nothing,
 * e.g. an unknown category, uses `(shop)/not-found.tsx` inside the layout.)
 */
export default function NotFound() {
  return (
    <ShopChrome>
      <NotFoundMessage />
    </ShopChrome>
  );
}
