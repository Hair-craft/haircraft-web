import { describe, expect, it } from "vitest";
import { matchApiHref, matchShopHref, matchSteps, swatchFor } from "@/components/home/match";
import { brandPromises } from "@/components/home/copy";

describe("find your match", () => {
  const all = { category: "wigs", texture: "Body Wave", color: "Natural Black" };

  it("tries everything chosen first, then drops the shade, then the texture", () => {
    expect(matchSteps(all)).toEqual([
      all,
      { ...all, color: null },
      { ...all, texture: null },
      { ...all, texture: null, color: null },
    ]);
  });

  it("never tries the same search twice", () => {
    const goalOnly = { category: "wigs", texture: null, color: null };
    expect(matchSteps(goalOnly)).toEqual([goalOnly]);
    expect(matchSteps({ ...goalOnly, color: "Brown" })).toHaveLength(2);
  });

  it("links to the shop with the listing's filters set", () => {
    expect(matchShopHref(all)).toBe("/shop/wigs?color=natural-black&texture=body-wave");
    expect(matchShopHref({ category: null, texture: null, color: null })).toBe("/shop");
    expect(matchShopHref({ category: "wigs", texture: null, color: null })).toBe("/shop/wigs");
  });

  it("asks /bff/match with the names as the API spells them", () => {
    expect(matchApiHref(all)).toBe(
      "/bff/match?category=wigs&texture=Body+Wave&color=Natural+Black",
    );
    expect(matchApiHref({ category: null, texture: null, color: null })).toBe("/bff/match");
  });

  it("colours swatches by the shade's words, neutral when unknown", () => {
    expect(swatchFor("Natural Black")).toBe("#151312");
    expect(swatchFor("Dark Brown")).toBe("#2c1f1d");
    expect(swatchFor("Brown")).toBe("#4e2b1e");
    expect(swatchFor("Caramel Highlights")).toMatch(/gradient/);
    expect(swatchFor("Mystery")).toBe("#d9cfc0");
  });
});

describe("hero badges", () => {
  it("say the free-shipping amount in a few words", () => {
    const shipping = brandPromises("599")[1];
    expect(shipping.short).toBe("On orders ₹599+");
    expect(brandPromises("0")[1].short).toBe("On every order");
    expect(brandPromises(null)[1].short).toBe("Across India");
  });
});
