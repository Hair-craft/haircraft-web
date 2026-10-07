import { describe, expect, it } from "vitest";
import {
  heartLabel,
  MAX_WISHLIST_ITEMS,
  movePlan,
  pendingSaveId,
  wishlistErrorMessage,
} from "@/lib/wishlist/rules";

const variant = (id: string, inStock: boolean, effectivePrice = "1000.00") => ({
  id,
  inStock,
  effectivePrice,
});

describe("Move to bag", () => {
  it("goes straight in the bag when only one option is in stock", () => {
    expect(movePlan([variant("a", false), variant("b", true, "2499.00")])).toEqual({
      kind: "direct",
      variantId: "b",
      price: "2499.00",
    });
  });

  it("goes straight in the bag for a product with a single option", () => {
    expect(movePlan([variant("a", true)])).toMatchObject({ kind: "direct", variantId: "a" });
  });

  it("asks the shopper to choose when several options are in stock", () => {
    expect(movePlan([variant("a", true), variant("b", true), variant("c", false)])).toEqual({
      kind: "choose",
    });
  });

  it("is sold out when no option is in stock (or there are none)", () => {
    expect(movePlan([variant("a", false), variant("b", false)])).toEqual({ kind: "soldout" });
    expect(movePlan([])).toEqual({ kind: "soldout" });
  });
});

describe("the heart's label", () => {
  it("says what pressing it will do", () => {
    expect(heartLabel("Silky Straight Clip-ins", false)).toBe(
      "Save Silky Straight Clip-ins to your wishlist",
    );
    expect(heartLabel("Silky Straight Clip-ins", true)).toBe(
      "Remove Silky Straight Clip-ins from your wishlist",
    );
  });
});

describe("wishlist errors", () => {
  it("explains the 200-product limit", () => {
    const message = wishlistErrorMessage(422, "WISHLIST_LIMIT_REACHED");
    expect(message).toContain(String(MAX_WISHLIST_ITEMS));
    expect(message).toContain("Remove some first");
    expect(MAX_WISHLIST_ITEMS).toBe(200);
  });

  it("explains a product that is no longer sold", () => {
    expect(wishlistErrorMessage(422, "PRODUCT_UNAVAILABLE")).toBe(
      "This product is no longer available.",
    );
  });

  it("asks to sign in again when the session has ended", () => {
    expect(wishlistErrorMessage(401, "UNAUTHORIZED")).toMatch(/sign in again/);
  });

  it("says the shop can't be reached when the API is down", () => {
    expect(wishlistErrorMessage(0, "NETWORK_ERROR")).toMatch(/can't reach the shop/);
    expect(wishlistErrorMessage(503, "SERVICE_UNAVAILABLE")).toMatch(/can't reach the shop/);
  });

  it("falls back to a plain sentence (never the API's wording)", () => {
    expect(wishlistErrorMessage(404, "NOT_FOUND")).toBe("That didn't work. Please try again.");
  });
});

describe("the save-after-sign-in cookie", () => {
  it("keeps a product id", () => {
    expect(pendingSaveId("2D6B1F3A-1C2B-4D3E-8F9A-0B1C2D3E4F5A")).toBe(
      "2d6b1f3a-1c2b-4d3e-8f9a-0b1c2d3e4f5a",
    );
  });

  it("ignores anything else", () => {
    expect(pendingSaveId(undefined)).toBeNull();
    expect(pendingSaveId("")).toBeNull();
    expect(pendingSaveId("not-an-id")).toBeNull();
    expect(pendingSaveId("2d6b1f3a-1c2b-4d3e-8f9a-0b1c2d3e4f5a; drop")).toBeNull();
  });
});
