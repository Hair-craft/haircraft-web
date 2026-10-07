import { describe, expect, it } from "vitest";
import { brandPromises, shippingPromise } from "@/components/home/copy";
import { cardBadges, productHref } from "@/components/product/product-card";
import { ratingLabel, starFills } from "@/components/product/rating-stars";
import { bestRatedOnly } from "@/lib/api/catalog";
import type { ProductCard } from "@/lib/api/types";
import { ConfigError, parseSettings } from "@/lib/env";

const card = (overrides: Partial<ProductCard> = {}): ProductCard => ({
  id: "p1",
  name: "Silky Tape-ins",
  slug: "silky-tape-ins",
  shortDescription: null,
  image: null,
  imageAlt: null,
  priceRange: { min: "5499.00", max: "6699.00" },
  onSale: false,
  inStock: true,
  rating: 0,
  reviewCount: 0,
  ...overrides,
});

describe("star ratings", () => {
  it("rounds to the nearest half star, always five stars", () => {
    expect(starFills(5)).toEqual(["full", "full", "full", "full", "full"]);
    expect(starFills(4.3)).toEqual(["full", "full", "full", "full", "half"]);
    expect(starFills(4.2)).toEqual(["full", "full", "full", "full", "empty"]);
    expect(starFills(2.75)).toEqual(["full", "full", "full", "empty", "empty"]);
    expect(starFills(0)).toEqual(["empty", "empty", "empty", "empty", "empty"]);
    expect(starFills(7)).toHaveLength(5);
    expect(starFills(-1).every((fill) => fill === "empty")).toBe(true);
  });

  it("reads out the exact rating and the review count", () => {
    expect(ratingLabel(4.33, 12)).toBe("Rated 4.3 out of 5, 12 reviews");
    expect(ratingLabel(5, 1)).toBe("Rated 5 out of 5, 1 review");
  });
});

describe("product card", () => {
  it("shows Sale only when something can be bought; Sold out wins", () => {
    expect(cardBadges({ inStock: true, onSale: false })).toEqual([]);
    expect(cardBadges({ inStock: true, onSale: true })).toEqual(["sale"]);
    expect(cardBadges({ inStock: false, onSale: true })).toEqual(["soldOut"]);
  });

  it("links to the product page", () => {
    expect(productHref("hd-lace-front-wig-body-wave")).toBe("/product/hd-lace-front-wig-body-wave");
  });
});

describe("best rated", () => {
  it("keeps only products that have reviews, in the API's order", () => {
    const products = [
      card({ id: "a", rating: 5, reviewCount: 5 }),
      card({ id: "b", rating: 0, reviewCount: 0 }),
      card({ id: "c", rating: 4, reviewCount: 1 }),
    ];
    expect(bestRatedOnly(products).map((p) => p.id)).toEqual(["a", "c"]);
    expect(bestRatedOnly([card()])).toEqual([]);
  });
});

describe("brand promises", () => {
  it("mentions the free-shipping amount only when it is configured", () => {
    expect(shippingPromise("1999")).toMatchObject({
      title: "Free shipping",
      text: "On orders above ₹1,999, anywhere in India.",
    });
    expect(shippingPromise("0").text).toBe("On every order, anywhere in India.");
    expect(shippingPromise(null)).toMatchObject({ title: "Tracked delivery" });
    expect(brandPromises("1999").map((p) => p.title)).toEqual([
      "100% human hair",
      "Free shipping",
      "Secure payments",
      "Here to help",
    ]);
  });

  it("validates the FREE_SHIPPING_THRESHOLD setting", () => {
    expect(parseSettings({ FREE_SHIPPING_THRESHOLD: "1999" }).freeShippingThreshold).toBe("1999");
    expect(parseSettings({ FREE_SHIPPING_THRESHOLD: "" }).freeShippingThreshold).toBeNull();
    expect(() => parseSettings({ FREE_SHIPPING_THRESHOLD: "₹1999" })).toThrow(ConfigError);
  });
});
