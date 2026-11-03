import { describe, expect, it } from "vitest";
import { brandPromises } from "@/components/home/copy";
import { swatchFor } from "@/lib/product/swatch";

describe("colour swatches", () => {
  it("colour swatches by the shade's words, neutral when unknown", () => {
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
