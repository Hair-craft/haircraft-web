import { describe, expect, it } from "vitest";
import { aboutContent } from "@/content/about";
import { GUIDES } from "@/content/guides";
import { business, sellerName, type Business } from "@/content/business";
import { faqGroups, homeFaqs } from "@/content/faq";
import { INFO_PAGES, LAST_UPDATED } from "@/content/pages";
import { privacyContent } from "@/content/privacy";
import { returnsContent } from "@/content/returns";
import { shippingContent } from "@/content/shipping";
import { termsContent } from "@/content/terms";
import { blockText, type Block, type InfoContent } from "@/content/types";
import { faqJsonLd } from "@/components/home/content";
import { deliveryAndReturns } from "@/components/product-page/content";
import {
  contactMethods,
  displayPhone,
  telHref,
  whatsappChatHref,
  whatsappHref,
} from "@/lib/info/contact";
import {
  cashOnDeliveryLine,
  deliveryLine,
  deliveryShort,
  paymentWindowLine,
  type ShopPolicies,
} from "@/lib/info/policies";
import { parseRich, plainText } from "@/lib/info/rich-text";

const policies = (over: Partial<ShopPolicies> = {}): ShopPolicies => ({
  currency: "INR",
  shippingFee: "99.00",
  freeShippingThreshold: "1999.00",
  gstRatePercent: 18,
  paymentWindowMinutes: 30,
  cashOnDelivery: { enabled: false, maxOrderAmount: null },
  ...over,
});

describe("policy wording from the API's settings", () => {
  it("states the delivery charge and the free-delivery minimum", () => {
    expect(deliveryLine(policies())).toBe(
      "Delivery is free on orders of ₹1,999 or more; below that it costs ₹99.",
    );
    expect(deliveryShort(policies())).toBe("Free delivery over ₹1,999");
  });

  it("says delivery is always free when the charge or the minimum is 0", () => {
    expect(deliveryLine(policies({ freeShippingThreshold: "0.00" }))).toBe(
      "Delivery is free on every order.",
    );
    expect(deliveryShort(policies({ shippingFee: "0.00" }))).toBe("Free delivery on every order");
  });

  it("leaves numbers out when the API can't be reached", () => {
    expect(deliveryLine(null)).not.toMatch(/₹/);
    expect(deliveryShort(null)).toBe("Delivery charge shown at checkout");
    expect(paymentWindowLine(null)).not.toMatch(/\d/);
  });

  it("mentions cash on delivery only when it's on", () => {
    expect(cashOnDeliveryLine(policies())).toBeNull();
    expect(cashOnDeliveryLine(null)).toBeNull();
    expect(
      cashOnDeliveryLine(
        policies({ cashOnDelivery: { enabled: true, maxOrderAmount: "10000.00" } }),
      ),
    ).toBe("Cash on delivery is available for orders up to ₹10,000.");
  });

  it("states the time to pay in minutes or hours", () => {
    expect(paymentWindowLine(policies())).toMatch(/within 30 minutes/);
    expect(paymentWindowLine(policies({ paymentWindowMinutes: 60 }))).toMatch(/within 1 hour,/);
    expect(paymentWindowLine(policies({ paymentWindowMinutes: 120 }))).toMatch(/within 2 hours/);
  });

  it("Shipping follows the settings, and shows cash on delivery only when it's on", () => {
    const text = (c: InfoContent) => JSON.stringify(c);
    expect(text(shippingContent(policies()))).toMatch(/₹1,999/);
    expect(text(shippingContent(policies()))).not.toMatch(/Cash on delivery/);
    expect(
      text(
        shippingContent(policies({ cashOnDelivery: { enabled: true, maxOrderAmount: "5000.00" } })),
      ),
    ).toMatch(/Cash on delivery is available for orders up to ₹5,000/);
  });
});

describe("rich text", () => {
  it("reads bold and links", () => {
    expect(parseRich("See **this** and [Returns](/returns#damaged).")).toEqual([
      { kind: "text", text: "See " },
      { kind: "bold", text: "this" },
      { kind: "text", text: " and " },
      { kind: "link", text: "Returns", href: "/returns#damaged", external: false },
      { kind: "text", text: "." },
    ]);
  });

  it("marks https links as external and refuses unsafe ones", () => {
    expect(parseRich("[Razorpay](https://razorpay.com)")[0]).toMatchObject({ external: true });
    expect(parseRich("[x](javascript:alert(1))")).toEqual([
      { kind: "text", text: "x" },
      { kind: "text", text: ")" },
    ]);
    expect(parseRich("[x](//evil.example)")).toEqual([{ kind: "text", text: "x" }]);
  });

  it("gives plain text for search engines", () => {
    expect(plainText("**Free** [delivery](/shipping)")).toBe("Free delivery");
  });
});

describe("contact details", () => {
  const base: Business = { ...business, phone: null, whatsapp: null, whatsappChat: null };

  it("uses the WhatsApp chat link when there is one, else the number", () => {
    const chat = contactMethods({ ...base, whatsappChat: "https://wa.me/message/ABC123" });
    expect(chat.at(-1)).toEqual({
      kind: "whatsapp",
      label: "WhatsApp",
      value: "Chat with us",
      href: "https://wa.me/message/ABC123",
      external: true,
    });
    expect(whatsappChatHref({ whatsapp: "9876543210", whatsappChat: null })).toBe(
      "https://wa.me/919876543210",
    );
    // Only WhatsApp's own addresses are used as chat links.
    expect(whatsappChatHref({ whatsapp: null, whatsappChat: "https://example.com/wa" })).toBeNull();
    expect(business.whatsappChat).toBe("https://wa.me/message/5EXU5MQ2N5Y3B1");
  });

  it("formats Indian numbers and builds call and WhatsApp links", () => {
    expect(displayPhone("+919876543210")).toBe("+91 98765 43210");
    expect(displayPhone("9876543210")).toBe("98765 43210");
    expect(telHref("98765 43210")).toBe("tel:+919876543210");
    expect(whatsappHref("+91 98765-43210")).toBe("https://wa.me/919876543210");
  });

  it("shows only the ways to reach us that are filled in", () => {
    expect(contactMethods(base).map((m) => m.kind)).toEqual(["email"]);
    const all = contactMethods({ ...base, phone: "+919876543210", whatsapp: "+919876543210" });
    expect(all.map((m) => [m.kind, m.href, m.external])).toEqual([
      ["email", `mailto:${business.email}`, false],
      ["phone", "tel:+919876543210", false],
      ["whatsapp", "https://wa.me/919876543210", true],
    ]);
  });

  it("names the seller, with the legal name when it differs", () => {
    expect(sellerName({ ...base, legalName: null })).toBe("HairCraft");
    expect(sellerName({ ...base, legalName: "HairCraft Private Limited" })).toBe(
      "HairCraft (HairCraft Private Limited)",
    );
  });
});

describe("the pages' text", () => {
  const pages: InfoContent[] = [
    shippingContent(policies()),
    returnsContent,
    aboutContent,
    privacyContent(),
    termsContent(policies()),
  ];
  const strings = (blocks: Block[]) => blocks.flatMap(blockText);
  const everything = [
    ...pages.flatMap((p) => [p.intro, ...p.sections.flatMap((s) => strings(s.blocks))]),
    ...faqGroups(policies()).flatMap((g) => g.faqs.map((f) => f.answer)),
    ...homeFaqs.map((f) => f.answer),
    ...deliveryAndReturns,
  ];
  const known = new Set<string>([
    ...INFO_PAGES.map((p) => p.href),
    "/shop",
    "/account",
    "/account/orders",
    "/account/reviews",
    "/guides",
    ...GUIDES.map((g) => `/guides/${g.slug}`),
  ]);

  it("every link inside the shop goes to a page that exists", () => {
    const links = everything.flatMap((s) =>
      parseRich(s).flatMap((p) => (p.kind === "link" && p.href.startsWith("/") ? [p.href] : [])),
    );
    expect(links.length).toBeGreaterThan(10);
    for (const href of links) expect(known).toContain(href.split("#")[0]);
  });

  it("section addresses are unique on each page", () => {
    for (const page of pages) {
      const ids = page.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("every page has a last-updated date", () => {
    for (const page of INFO_PAGES) expect(LAST_UPDATED[page.slug]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("the full FAQ is grouped and described for search engines without marks", () => {
    const groups = faqGroups(policies());
    expect(groups.map((g) => g.id)).toEqual(["ordering", "delivery", "returns", "hair"]);
    const data = faqJsonLd(groups.flatMap((g) => g.faqs));
    expect(JSON.stringify(data)).not.toMatch(/\]\(|\*\*/);
  });

  it("the terms and privacy policy name the grievance officer's contact", () => {
    expect(JSON.stringify(privacyContent())).toContain(business.grievanceOfficer.email);
    expect(JSON.stringify(termsContent(null))).toContain("/contact#grievance");
  });
});
