import { formatPrice } from "@/lib/format";

/** The brand promises (the hero badges). Pure, so the wording is unit-tested. */
export interface BrandPromise {
  icon: "hair" | "truck" | "lock" | "chat";
  title: string;
  text: string;
  /** A few words, for the small badges under the hero. */
  short: string;
}

/** "Free shipping above ₹599", or no amount when the setting is empty (0 = always free). */
export function shippingPromise(threshold: string | null): BrandPromise {
  if (threshold === null) {
    return {
      icon: "truck",
      title: "Tracked delivery",
      text: "Fast, tracked delivery across India.",
      short: "Across India",
    };
  }
  if (Number(threshold) === 0) {
    return {
      icon: "truck",
      title: "Free shipping",
      text: "On every order, anywhere in India.",
      short: "On every order",
    };
  }
  return {
    icon: "truck",
    title: "Free shipping",
    text: `On orders above ${formatPrice(threshold)}, anywhere in India.`,
    short: `On orders ${formatPrice(threshold)}+`,
  };
}

export function brandPromises(freeShippingThreshold: string | null): BrandPromise[] {
  return [
    {
      icon: "hair",
      title: "100% human hair",
      text: "Soft, natural hair you can style, curl and colour.",
      short: "Style, curl & colour",
    },
    shippingPromise(freeShippingThreshold),
    {
      icon: "lock",
      title: "Secure payments",
      text: "UPI, cards, net banking and wallets.",
      short: "UPI, cards & net banking",
    },
    {
      icon: "chat",
      title: "Here to help",
      text: "Unsure about length or shade? Ask us before you buy.",
      short: "Ask before you buy",
    },
  ];
}
