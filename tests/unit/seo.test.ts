import { describe, expect, it } from "vitest";
import type { PublicProduct, PublicReview, PublicVariant } from "@/lib/api/types";
import { parseSettings } from "@/lib/env";
import { gateDecision } from "@/lib/gate";
import type { ShopPolicies } from "@/lib/info/policies";
import { socialName } from "@/lib/info/social";
import { MAX_JSON_LD_REVIEWS, productJsonLd } from "@/lib/product/structured-data";
import { dayRange, returnPolicy, shippingDetails } from "@/lib/seo/commerce";
import { itemListJsonLd } from "@/lib/seo/item-list";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { DEFAULT_SHARE_IMAGE, openGraph } from "@/lib/seo/open-graph";
import { siteJsonLd } from "@/lib/seo/organization";
import { PRIVATE_PATHS, robotsFor } from "@/lib/seo/robots";

const SITE = "https://haircraft.in";

const policies: ShopPolicies = {
  currency: "INR",
  shippingFee: "99.00",
  freeShippingThreshold: "1999.00",
  gstRatePercent: 18,
  paymentWindowMinutes: 30,
  cashOnDelivery: { enabled: false, maxOrderAmount: null },
};

const variant = (sku: string, price: string, inStock = true): PublicVariant => ({
  id: sku,
  sku,
  price,
  salePrice: null,
  effectivePrice: price,
  onSale: false,
  lengthInches: 18,
  color: "Natural Black",
  texture: "Straight",
  weightGrams: null,
  attributes: {},
  inStock,
});

const product: PublicProduct = {
  id: "p1",
  name: "Silky Tape-ins",
  slug: "silky-tape-ins",
  shortDescription: "Seamless",
  description: null,
  attributes: {},
  categories: [{ id: "c1", name: "Tape-ins", slug: "tape-ins" }],
  images: [],
  variants: [variant("ST-18", "1499.00"), variant("ST-22", "2499.00", false)],
  options: { lengths: [18, 22], colors: ["Natural Black"], textures: ["Straight"], weights: [] },
  priceRange: { min: "1499.00", max: "2499.00" },
  inStock: true,
  rating: 4.5,
  reviewCount: 7,
};

const review = (i: number): PublicReview => ({
  id: `r${i}`,
  rating: 5,
  title: i === 0 ? "Lovely" : null,
  body: "Blends perfectly.",
  reviewerName: "Anjali R.",
  verifiedPurchase: true,
  photos: [],
  createdAt: "2026-10-01T10:00:00.000Z",
});

describe("robots.txt", () => {
  it("keeps everything out unless indexing is allowed", () => {
    expect(robotsFor({ siteUrl: SITE, allowIndexing: false })).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("on the live site lets search engines in, except private pages, and names the sitemap", () => {
    const robots = robotsFor({ siteUrl: SITE, allowIndexing: true });
    expect(robots.sitemap).toBe("https://haircraft.in/sitemap.xml");
    expect(robots.rules).toEqual({ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS });
    for (const path of ["/account", "/checkout", "/cart", "/bff/", "/search"])
      expect(PRIVATE_PATHS).toContain(path);
  });
});

describe("settings for search engines", () => {
  it("indexing is off by default and needs ALLOW_INDEXING=true", () => {
    expect(parseSettings({ NODE_ENV: "production" }).allowIndexing).toBe(false);
    expect(parseSettings({ ALLOW_INDEXING: "true" }).allowIndexing).toBe(true);
    expect(() => parseSettings({ ALLOW_INDEXING: "yes" })).toThrow(/ALLOW_INDEXING/);
  });

  it("accepts a Search Console code and refuses anything that isn't one", () => {
    expect(
      parseSettings({ GOOGLE_SITE_VERIFICATION: "abcDEF123_-xyz456" }).googleSiteVerification,
    ).toBe("abcDEF123_-xyz456");
    expect(() =>
      parseSettings({ GOOGLE_SITE_VERIFICATION: '<meta name="google" content="x">' }),
    ).toThrow(/GOOGLE_SITE_VERIFICATION/);
  });
});

describe("link previews", () => {
  it("fills in the site name, locale and the default image", () => {
    expect(openGraph({ title: "Shop" })).toEqual({
      siteName: "HairCraft",
      locale: "en_IN",
      type: "website",
      title: "Shop",
      images: [DEFAULT_SHARE_IMAGE],
    });
  });

  it("keeps a page's own image, and can leave the image to the segment's file", () => {
    expect(openGraph({ images: [{ url: "/p.jpg" }] }).images).toEqual([{ url: "/p.jpg" }]);
    expect(openGraph({ title: "Wigs", image: false })).not.toHaveProperty("images");
    expect(openGraph({ title: "No photo", images: undefined }).images).toEqual([
      DEFAULT_SHARE_IMAGE,
    ]);
  });

  it("are always served, even while the shop is closed", () => {
    for (const path of ["/opengraph-image", "/shop/wigs/opengraph-image-rhlu6l", "/twitter-image"])
      expect(gateDecision(path, false)).toEqual({ action: "next" });
    expect(gateDecision("/opengraph-image-and-more/page", false).action).toBe("rewrite");
  });
});

describe("delivery and returns for search engines", () => {
  it("reads day ranges", () => {
    expect(dayRange("1–2")).toEqual([1, 2]);
    expect(dayRange("3-7")).toEqual([3, 7]);
    expect(dayRange("5")).toEqual([5, 5]);
  });

  it("charges delivery below the free minimum and not from it", () => {
    expect(shippingDetails(policies, "1499.00").shippingRate.value).toBe("99.00");
    expect(shippingDetails(policies, "1999.00").shippingRate.value).toBe("0.00");
    expect(
      shippingDetails({ ...policies, freeShippingThreshold: "0.00" }, "10.00").shippingRate.value,
    ).toBe("0.00");
    expect(shippingDetails(policies, "1499.00")).toMatchObject({
      shippingDestination: { addressCountry: "IN" },
      deliveryTime: {
        handlingTime: { minValue: 1, maxValue: 2, unitCode: "DAY" },
        transitTime: { minValue: 3, maxValue: 7, unitCode: "DAY" },
      },
    });
  });

  it("describes the returns window from the returns rules", () => {
    expect(returnPolicy(SITE)).toMatchObject({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      merchantReturnDays: 7,
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      merchantReturnLink: "https://haircraft.in/returns",
    });
  });
});

describe("product structured data", () => {
  it("has one offer per option with its SKU, price, stock, delivery and returns", () => {
    const data = productJsonLd(product, SITE, { policies, reviews: [] });
    expect(data.offers.offers).toHaveLength(2);
    expect(data.offers.offers[0]).toMatchObject({
      "@type": "Offer",
      sku: "ST-18",
      name: "18 in, Natural Black, Straight",
      price: "1499.00",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: "https://haircraft.in/product/silky-tape-ins?variant=ST-18",
      shippingDetails: { shippingRate: { value: "99.00" } },
      hasMerchantReturnPolicy: { merchantReturnDays: 7 },
    });
    expect(data.offers.offers[1]).toMatchObject({
      availability: "https://schema.org/OutOfStock",
      shippingDetails: { shippingRate: { value: "0.00" } },
    });
  });

  it("leaves delivery out when the shop's rules aren't known", () => {
    const data = productJsonLd(product, SITE, { policies: null });
    expect(data.offers.offers[0]).not.toHaveProperty("shippingDetails");
  });

  it("includes up to 5 approved reviews, only when the product has reviews", () => {
    const reviews = Array.from({ length: 8 }, (_, i) => review(i));
    const data = productJsonLd(product, SITE, { reviews });
    expect(data.review).toHaveLength(MAX_JSON_LD_REVIEWS);
    expect(data.review?.[0]).toEqual({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5, worstRating: 1 },
      author: { "@type": "Person", name: "Anjali R." },
      datePublished: "2026-10-01",
      name: "Lovely",
      reviewBody: "Blends perfectly.",
    });
    expect(
      productJsonLd({ ...product, reviewCount: 0, rating: 0 }, SITE, { reviews }),
    ).not.toHaveProperty("review");
  });

  it("names the SKU on a product with a single option", () => {
    expect(productJsonLd({ ...product, variants: [variant("ONE", "999.00")] }, SITE).sku).toBe(
      "ONE",
    );
  });
});

describe("site-wide structured data", () => {
  it("describes the business with its contact and returns policy", () => {
    const [site, organization] = siteJsonLd(SITE, "Premium hair");
    expect(site).toMatchObject({ "@type": "WebSite", url: "https://haircraft.in/" });
    expect(organization).toMatchObject({
      "@type": "Organization",
      logo: "https://haircraft.in/images/logo.png",
      contactPoint: { contactType: "customer service", areaServed: "IN" },
      hasMerchantReturnPolicy: { merchantReturnDays: 7 },
    });
    expect(organization).not.toHaveProperty("sameAs");
  });

  it("lists a category's products in the order shown, counting across pages", () => {
    const list = itemListJsonLd("Wigs", [{ name: "A", slug: "a" }], SITE, 25);
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 25, url: "https://haircraft.in/product/a", name: "A" },
    ]);
  });

  it("can't break out of its script tag", () => {
    expect(jsonLdScript({ text: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });

  it("names social profiles", () => {
    expect(socialName("https://www.instagram.com/haircraft")).toBe("Instagram");
    expect(socialName("https://m.facebook.com/haircraft")).toBe("Facebook");
    expect(socialName("https://example.com/x")).toBe("example.com");
  });
});
