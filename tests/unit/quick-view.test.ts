import { describe, expect, it, vi } from "vitest";

// What the mocked catalog does next, and the slugs it was asked for.
let answer: (slug: string) => Promise<unknown> = async () => null;
const asked: string[] = [];
vi.mock("@/lib/api/catalog", () => ({
  getProduct: (slug: string) => {
    asked.push(slug);
    return answer(slug);
  },
}));

const { quickView } = await import("@/lib/home/quick-view");
const { ApiError } = await import("@/lib/api/errors");

const product = {
  id: "p1",
  slug: "silk-base-wig",
  name: "Silk Base Wig",
  description: "<p>Soft <b>silk</b> base.</p><script>alert(1)</script>",
  variants: [
    { id: "v1", sku: "SBW-18", isActive: true, inStock: true, isMain: true },
    { id: "v2", sku: "SBW-20", isActive: true, inStock: true, isMain: false },
  ],
};

describe("Best sellers quick view (owner, 2026-11-23)", () => {
  it("loads the product, its first option and its description as safe HTML", async () => {
    answer = async () => product;
    const result = await quickView("silk-base-wig");
    expect(asked.at(-1)).toBe("silk-base-wig");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product.name).toBe("Silk Base Wig");
    expect(result.initialSku).not.toBe("");
    expect(result.descriptionHtml).toContain("silk");
    expect(result.descriptionHtml).not.toContain("<script");
  });

  it("refuses a malformed slug without asking the API", async () => {
    const before = asked.length;
    expect((await quickView("../admin")).ok).toBe(false);
    expect((await quickView("")).ok).toBe(false);
    expect(asked.length).toBe(before);
  });

  it("explains calmly when the product is gone", async () => {
    answer = () => Promise.reject(new ApiError(404, "NOT_FOUND", "x"));
    expect(await quickView("old-wig")).toEqual({
      ok: false,
      message: "This product isn't available any more.",
    });
  });

  it("explains calmly when the shop can't reach the API", async () => {
    answer = () => Promise.reject(new ApiError(0, "NETWORK", "x"));
    expect((await quickView("silk-base-wig")).ok).toBe(false);
  });
});
