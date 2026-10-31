import { settings } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { cx } from "@/lib/cx";

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

/** Which points fit: two on phones, three on tablets, all on desktop. */
const fits = ["inline-flex", "inline-flex", "hidden md:inline-flex", "hidden lg:inline-flex"];

/** A still strip of points, each after a gold sparkle (it used to scroll). */
export function AnnouncementBar() {
  const items = announcementItems(settings().freeShippingThreshold);
  return (
    <section aria-label="Offers" className="bg-deep px-4 py-2 text-white">
      <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[0.7rem] font-semibold tracking-wider uppercase sm:text-xs">
        {items.map((item, i) => (
          <li key={item} className={cx("items-center gap-1.5", fits[i] ?? "hidden lg:inline-flex")}>
            <span aria-hidden className="text-gold-light">
              ✦
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
