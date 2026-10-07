import { returnRules } from "@/content/returns-rules";
import type { ShopPolicies } from "@/lib/info/policies";

/** "1–2" → [1, 2]; "3" → [3, 3]. */
export function dayRange(text: string): [number, number] {
  const [min, max = min] = text.split(/[–-]/).map((n) => Number(n.trim()));
  return [min, max];
}

const isZero = (amount: string) => Number(amount) === 0;

/**
 * schema.org delivery details for one item at this price, from the shop's
 * rules (B15) and the delivery times (S14): free when the item alone reaches
 * the free-delivery minimum, otherwise the delivery charge.
 */
export function shippingDetails(policies: ShopPolicies, price: string) {
  const free =
    isZero(policies.shippingFee) ||
    isZero(policies.freeShippingThreshold) ||
    Number(price) >= Number(policies.freeShippingThreshold);
  const [handlingMin, handlingMax] = dayRange(returnRules.dispatchWorkingDays);
  const [transitMin, transitMax] = dayRange(returnRules.deliveryWorkingDays);
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: free ? "0.00" : policies.shippingFee,
      currency: policies.currency,
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: handlingMin,
        maxValue: handlingMax,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: transitMin,
        maxValue: transitMax,
        unitCode: "DAY",
      },
    },
  };
}

/** schema.org returns policy, from the returns rules (S14). */
export function returnPolicy(siteUrl: string) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: returnRules.changeOfMindDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    merchantReturnLink: new URL("/returns", siteUrl).toString(),
  };
}
