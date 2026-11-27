import { describe, expect, it } from "vitest";
import { heroSlides, shownHeroSlides } from "@/components/home/home-images";

describe("Hero slideshow: the admin shows or hides the built-in slides (owner, 2026-11-26)", () => {
  const keys = (list: { key: string }[]) => list.map((slide) => slide.key);

  it("has the stylist slide, then the toppers, each with its pictures", () => {
    expect(keys([...heroSlides])).toEqual(["stylist", "toppers"]);
    for (const slide of heroSlides) {
      // Sized WebP copies of the owner's artwork (owner, 2026-11-27: faster to load).
      expect(slide.desktop).toMatch(/^\/images\/home\/.+\.webp$/);
      expect(slide.mobile).toMatch(/^\/images\/home\/.+\.webp$/);
      expect(slide.desktop).not.toBe(slide.mobile);
    }
  });

  it("shows the ones left on, in order", () => {
    expect(
      keys(
        shownHeroSlides([
          { key: "stylist", shown: false },
          { key: "toppers", shown: true },
        ]),
      ),
    ).toEqual(["toppers"]);
    expect(keys(shownHeroSlides([{ key: "toppers", shown: false }]))).toEqual(["stylist"]);
  });

  it("shows every slide for an older API, no API, or (never expected) all of them off", () => {
    expect(keys(shownHeroSlides(undefined))).toEqual(["stylist", "toppers"]);
    expect(keys(shownHeroSlides(null))).toEqual(["stylist", "toppers"]);
    expect(
      keys(
        shownHeroSlides([
          { key: "stylist", shown: false },
          { key: "toppers", shown: false },
        ]),
      ),
    ).toEqual(["stylist", "toppers"]);
  });
});
