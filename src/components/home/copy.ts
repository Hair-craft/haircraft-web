import { formatPrice } from "@/lib/format";

/** The brand promises under the hero. Pure, so the wording is unit-tested. */
export interface BrandPromise {
  icon: "hair" | "truck" | "lock" | "chat";
  title: string;
  text: string;
}

/** "Free shipping above ₹1,999", or no amount when the setting is empty (0 = always free). */
export function shippingPromise(threshold: string | null): BrandPromise {
  if (threshold === null) {
    return {
      icon: "truck",
      title: "Tracked delivery",
      text: "Fast, tracked delivery across India.",
    };
  }
  if (Number(threshold) === 0) {
    return { icon: "truck", title: "Free shipping", text: "On every order, anywhere in India." };
  }
  return {
    icon: "truck",
    title: "Free shipping",
    text: `On orders above ${formatPrice(threshold)}, anywhere in India.`,
  };
}

export function brandPromises(freeShippingThreshold: string | null): BrandPromise[] {
  return [
    {
      icon: "hair",
      title: "100% human hair",
      text: "Soft, natural hair you can style, curl and colour.",
    },
    shippingPromise(freeShippingThreshold),
    { icon: "lock", title: "Secure payments", text: "UPI, cards, net banking and wallets." },
    {
      icon: "chat",
      title: "Here to help",
      text: "Unsure about length or shade? Ask us before you buy.",
    },
  ];
}
