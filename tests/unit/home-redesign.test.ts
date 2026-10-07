import { describe, expect, it } from "vitest";
import { faqJsonLd, faqs, trustPoints, whyCards } from "@/components/home/content";
import { plainText } from "@/lib/info/rich-text";
import { shouldShowAccent } from "@/components/home/hero-accent";
import { announcementItems } from "@/components/layout/announcement-bar";

describe("3D hero accent", () => {
  const desktop = { wide: true, finePointer: true, reducedMotion: false, webgl: true };

  it("shows only on a desktop with motion welcome and WebGL", () => {
    expect(shouldShowAccent(desktop)).toBe(true);
    expect(shouldShowAccent({ ...desktop, wide: false })).toBe(false);
    expect(shouldShowAccent({ ...desktop, finePointer: false })).toBe(false);
    expect(shouldShowAccent({ ...desktop, reducedMotion: true })).toBe(false);
    expect(shouldShowAccent({ ...desktop, webgl: false })).toBe(false);
  });
});

describe("announcement bar", () => {
  it("states the free-shipping amount only when it is configured", () => {
    expect(announcementItems("1999")[0]).toBe("Free shipping above ₹1,999");
    expect(announcementItems("0")[0]).toBe("Free shipping on every order");
    expect(announcementItems(null)[0]).toBe("Tracked delivery across India");
    expect(announcementItems(null)).toHaveLength(3);
  });
});

describe("home page wording", () => {
  it("describes every FAQ for search engines", () => {
    const data = faqJsonLd(faqs);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(faqs.length);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: faqs[0].question,
      acceptedAnswer: { "@type": "Answer", text: plainText(faqs[0].answer) },
    });
  });

  it("makes no unverified claims about years or numbers of customers", () => {
    const text = JSON.stringify({ faqs, trustPoints, whyCards });
    expect(text).not.toMatch(/\d+\+?\s*(years|yrs)/i);
    expect(text).not.toMatch(/\d[\d,]*\+?\s*(happy\s+)?(customers|clients|women)/i);
  });
});
