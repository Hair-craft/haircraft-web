import { describe, expect, it } from "vitest";
import { announcementItems } from "@/components/layout/announcement-bar";
import { authorised, requestedTags } from "@/lib/revalidate";

const secret = "s".repeat(40);

describe("cache refresh from the API", () => {
  it("needs the shared secret as a bearer token", () => {
    expect(authorised(`Bearer ${secret}`, secret)).toBe(true);
    expect(authorised(`Bearer ${secret}x`, secret)).toBe(false);
    expect(authorised(secret, secret)).toBe(false);
    expect(authorised(null, secret)).toBe(false);
  });

  it("is off without a long enough secret", () => {
    expect(authorised("Bearer ", "")).toBe(false);
    expect(authorised("Bearer short", "short")).toBe(false);
    expect(authorised(`Bearer ${secret}`, undefined)).toBe(false);
  });

  it("refreshes the known tags asked for, or all of them", () => {
    expect(requestedTags({ tags: ["products"] })).toEqual(["products"]);
    expect(requestedTags({ tags: ["products", "categories", "users"] })).toEqual([
      "products",
      "categories",
    ]);
    expect(requestedTags({ tags: ["users"] })).toEqual(["products", "categories"]);
    expect(requestedTags(null)).toEqual(["products", "categories"]);
  });
});

describe("free delivery", () => {
  it("is announced from ₹599", () => {
    expect(announcementItems("599")[0]).toBe("Free shipping above ₹599");
  });
});
