import { describe, expect, it } from "vitest";
import { CATEGORY_GUIDES, categoryGuide } from "@/content/categories";
import { findGuide, GUIDES, readingMinutes, wordCount } from "@/content/guides";
import { INFO_PAGES } from "@/content/pages";
import { shopLinks } from "@/content/shop-links";
import { blockText } from "@/content/types";
import type { PublicProduct } from "@/lib/api/types";
import { parseSettings } from "@/lib/env";
import type { ShopPolicies } from "@/lib/info/policies";
import { parseRich } from "@/lib/info/rich-text";
import { articleJsonLd } from "@/lib/seo/article";
import {
  categoryDescription,
  categoryTitle,
  clip,
  DESCRIPTION_MAX,
  HOME_DESCRIPTION,
  HOME_TITLE,
  lengthRange,
  priceFrom,
  productDescription,
  productTitle,
  TITLE_MAX,
} from "@/lib/seo/titles";

const policies: ShopPolicies = {
  currency: "INR",
  shippingFee: "99.00",
  freeShippingThreshold: "1999.00",
  gstRatePercent: 18,
  paymentWindowMinutes: 30,
  cashOnDelivery: { enabled: false, maxOrderAmount: null },
};

type ProductBits = Pick<
  PublicProduct,
  "name" | "options" | "shortDescription" | "description" | "priceRange"
>;
const product = (over: Partial<ProductBits> = {}): ProductBits => ({
  name: "Wrap-around Ponytail",
  options: { lengths: [22], colors: [], textures: [], weights: [] },
  shortDescription: "A full, sleek ponytail in seconds.",
  description: null,
  priceRange: { min: "4999.00", max: "6999.00" },
  ...over,
});

describe("titles", () => {
  it("adds human hair and the length to product titles", () => {
    expect(productTitle(product())).toBe("Wrap-around Ponytail — Human Hair, 22 inch");
    expect(
      productTitle(
        product({ options: { lengths: [14, 22, 18], colors: [], textures: [], weights: [] } }),
      ),
    ).toBe("Wrap-around Ponytail — Human Hair, 14–22 inch");
  });

  it("never says human hair twice, and drops facts to fit", () => {
    expect(productTitle(product({ name: "Human Hair Topper" }))).toBe(
      "Human Hair Topper — 22 inch",
    );
    const long = productTitle(
      product({ name: "Brazilian Body Wave Seamless Clip-in Extensions Set" }),
    );
    // The name alone is already long, so no facts are added (the name is never cut).
    expect(long).toBe("Brazilian Body Wave Seamless Clip-in Extensions Set");
    const fits = productTitle(product({ name: "Seamless Clip-in Set" }));
    expect(fits.length + " | HairCraft".length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("names categories with the words people search for", () => {
    expect(categoryTitle("Clip-in Extensions")).toBe("Human Hair Clip-in Extensions in India");
    expect(categoryTitle("Human Hair Wigs")).toBe("Human Hair Wigs in India");
    expect(HOME_TITLE.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("reads lengths", () => {
    expect(lengthRange([])).toBeNull();
    expect(lengthRange([18, 18])).toBe("18 inch");
    expect(lengthRange([22, 14])).toBe("14–22 inch");
  });
});

describe("descriptions", () => {
  it("give the product's own words, its price and the delivery promise, within 160 characters", () => {
    const text = productDescription(product(), policies);
    expect(text).toBe(
      "A full, sleek ponytail in seconds. 100% human hair, from ₹4,999. Free delivery over ₹1,999 and easy returns.",
    );
    expect(text.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("drop the promise, then shorten, when the product's own words are long", () => {
    const long = productDescription(
      product({ shortDescription: "Soft, natural, ".repeat(12) + "and lovely" }),
      null,
    );
    expect(long.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(long.endsWith("…")).toBe(true);
    expect(priceFrom(product({ priceRange: { min: "999.00", max: "999.00" } }))).toBe("₹999");
  });

  it("never leave a description empty", () => {
    expect(productDescription(product({ shortDescription: null }), null)).toMatch(
      /^Wrap-around Ponytail\. 100% human hair/,
    );
    expect(categoryDescription("Wigs", null, policies)).toMatch(/^Shop wigs in 100% human hair\./);
    for (const text of [
      categoryDescription("Clip-in Extensions", "Instant length and volume.", policies),
      HOME_DESCRIPTION,
    ])
      expect(text.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it("cut at a word", () => {
    expect(clip("one two three four", 12)).toBe("one two…");
  });
});

describe("guides", () => {
  const known = new Set<string>([
    ...INFO_PAGES.map((p) => p.href),
    ...(Object.values(shopLinks).filter((v) => typeof v === "string") as string[]),
    ...GUIDES.map((g) => `/guides/${g.slug}`),
  ]);
  const links = (texts: string[]) =>
    texts.flatMap((t) =>
      parseRich(t).flatMap((p) => (p.kind === "link" && p.href.startsWith("/") ? [p.href] : [])),
    );

  it("have unique addresses, real content and a reading time", () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
    for (const guide of GUIDES) {
      expect(wordCount(guide), guide.slug).toBeGreaterThan(450);
      expect(readingMinutes(guide)).toBeGreaterThanOrEqual(2);
      expect(guide.summary.length, guide.slug).toBeLessThanOrEqual(DESCRIPTION_MAX + 40);
      expect(guide.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Set(guide.sections.map((s) => s.id)).size).toBe(guide.sections.length);
    }
  });

  it("link only to pages that exist", () => {
    for (const guide of GUIDES) {
      const texts = guide.sections.flatMap((s) => s.blocks.flatMap(blockText));
      for (const href of [...links(texts), ...guide.shop.map((s) => s.href)])
        expect(known, `${guide.slug} → ${href}`).toContain(href.split("#")[0]);
    }
    for (const [slug, guide] of Object.entries(CATEGORY_GUIDES)) {
      const texts = [
        guide.intro,
        ...guide.sections.flatMap((s) => s.blocks.flatMap(blockText)),
        ...guide.faqs.map((f) => f.answer),
      ];
      for (const href of links(texts)) expect(known, `${slug} → ${href}`).toContain(href);
      for (const related of guide.guides) expect(findGuide(related), related).not.toBeNull();
    }
  });

  it("describe themselves as articles for Google", () => {
    expect(articleJsonLd(GUIDES[0], "https://haircraft.in")).toMatchObject({
      "@type": "Article",
      headline: GUIDES[0].title,
      url: `https://haircraft.in/guides/${GUIDES[0].slug}`,
      author: { "@type": "Organization", name: "HairCraft" },
      image: ["https://haircraft.in/opengraph-image"],
    });
  });
});

describe("category buying guides", () => {
  it("fall back to the nearest parent, or none", () => {
    expect(categoryGuide(["seamless-clip-ins", "clip-in-extensions"])).toBe(
      CATEGORY_GUIDES["clip-in-extensions"],
    );
    expect(categoryGuide(["lace-front-wigs", "wigs"])).toBe(CATEGORY_GUIDES.wigs);
    expect(categoryGuide(["something-new"])).toBeNull();
  });
});

describe("Bing verification setting", () => {
  it("accepts a Bing code and refuses a whole meta tag", () => {
    expect(
      parseSettings({ BING_SITE_VERIFICATION: "0123456789ABCDEF0123456789ABCDEF" })
        .bingSiteVerification,
    ).toBe("0123456789ABCDEF0123456789ABCDEF");
    expect(() =>
      parseSettings({ BING_SITE_VERIFICATION: '<meta name="msvalidate.01" content="x">' }),
    ).toThrow(/BING_SITE_VERIFICATION/);
  });
});
