import { settings } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { Marquee } from "@/components/motion/marquee";

/** The offers strip above the header, on every shop page. */
export function announcementItems(freeShippingThreshold: string | null): string[] {
  const shipping =
    freeShippingThreshold === null
      ? "Tracked delivery across India"
      : Number(freeShippingThreshold) === 0
        ? "Free shipping on every order"
        : `Free shipping above ${formatPrice(freeShippingThreshold)}`;
  return [
    shipping,
    "100% human hair",
    "Secure UPI, card & net banking payments",
    "Free shade advice on WhatsApp",
  ];
}

/**
 * The points slide by on their own, endlessly (owner, 2026-11-04); the strip
 * pauses on hover and stands still for people who prefer reduced motion.
 */
export function AnnouncementBar() {
  const items = announcementItems(settings().freeShippingThreshold);
  return (
    <Marquee
      items={items}
      label="Offers"
      repeat={2}
      speedSeconds={36}
      className="bg-deep py-1.5 text-white sm:py-2"
      itemClassName="text-[0.625rem] font-semibold tracking-wide uppercase sm:text-xs sm:tracking-wider"
    />
  );
}
