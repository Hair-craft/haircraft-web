import { Marquee } from "@/components/motion/marquee";
import { settings } from "@/lib/env";
import { formatPrice } from "@/lib/format";

/** The offers strip above the header, on every shop page. */
export function announcementItems(freeShippingThreshold: string | null): string[] {
  const shipping =
    freeShippingThreshold === null
      ? "Tracked delivery across India"
      : Number(freeShippingThreshold) === 0
        ? "Free shipping on every order"
        : `Free shipping above ${formatPrice(freeShippingThreshold)}`;
  return [shipping, "100% human hair", "Secure UPI, card & net banking payments"];
}

export function AnnouncementBar() {
  const items = announcementItems(settings().freeShippingThreshold);
  return (
    <Marquee
      label="Offers"
      items={items}
      repeat={2}
      className="bg-deep py-2 text-mint"
      itemClassName="text-xs tracking-[0.2em] uppercase"
      speedSeconds={45}
    />
  );
}
