import { describe, expect, it } from "vitest";
import {
  HOME_REVIEW_COUNT,
  bounceTransforms,
  fanLayout,
  pushedTransform,
  reviewCardPicture,
  reviewDate,
  straightTransform,
} from "@/lib/home/bounce-cards";

describe("review Bounce Cards (owner, 2026-11-23, from React Bits)", () => {
  it("shows up to 8 reviews", () => {
    expect(HOME_REVIEW_COUNT).toBe(8);
    expect(bounceTransforms(12)).toHaveLength(8);
    expect(bounceTransforms(0)).toEqual([]);
  });

  it("fans 5 cards exactly as React Bits does", () => {
    expect(bounceTransforms(5, 100)).toEqual([
      "rotate(10deg) translate(-200px)",
      "rotate(5deg) translate(-100px)",
      "rotate(-3deg) translate(0px)",
      "rotate(-10deg) translate(100px)",
      "rotate(2deg) translate(200px)",
    ]);
  });

  it("centres any number of cards, tipped outwards at the ends", () => {
    expect(bounceTransforms(1)).toEqual(["rotate(-3deg) translate(0px)"]);
    const eight = bounceTransforms(8, 100);
    expect(eight[0]).toBe("rotate(10deg) translate(-350px)");
    expect(eight[7]).toBe("rotate(-10deg) translate(350px)");
    expect(bounceTransforms(2, 100)).toEqual([
      "rotate(10deg) translate(-50px)",
      "rotate(-10deg) translate(50px)",
    ]);
  });

  it("packs the fan tighter on a phone", () => {
    expect(fanLayout(true, 8).step).toBeLessThan(fanLayout(false, 8).step);
    expect(fanLayout(false, 5)).toEqual({ step: 100, push: 160 });
  });

  it("straightens a card (React Bits' getNoRotationTransform)", () => {
    expect(straightTransform("rotate(10deg) translate(-200px)")).toBe(
      "rotate(0deg) translate(-200px)",
    );
    expect(straightTransform("none")).toBe("rotate(0deg)");
    expect(straightTransform("translate(5px)")).toBe("translate(5px) rotate(0deg)");
  });

  it("pushes a card sideways (React Bits' getPushedTransform)", () => {
    expect(pushedTransform("rotate(5deg) translate(-100px)", -160)).toBe(
      "rotate(5deg) translate(-260px)",
    );
    expect(pushedTransform("rotate(-3deg)", 160)).toBe("rotate(-3deg) translate(160px)");
    expect(pushedTransform("none", 160)).toBe("translate(160px)");
  });

  it("puts a picture on every card: the customer's photo, else the product's", () => {
    const urls = (name: string) => ({ medium: name + "-m", large: name + "-l" });
    const review = (photos: { urls: { medium: string; large: string } }[]) => ({
      reviewerName: "Kavya M.",
      photos,
    });
    expect(
      reviewCardPicture({
        review: review([{ urls: urls("own") }]),
        product: { name: "Wig", image: urls("prod") },
      }),
    ).toEqual({ src: "own-m", alt: "Photo by Kavya M. of Wig" });
    expect(
      reviewCardPicture({ review: review([]), product: { name: "Wig", image: urls("prod") } }),
    ).toEqual({ src: "prod-m", alt: "Wig" });
    expect(
      reviewCardPicture({ review: review([]), product: { name: "Wig", image: null } }),
    ).toBeNull();
  });

  it("dates the review in India time", () => {
    expect(reviewDate("2026-11-22T20:00:00Z")).toBe("23 Nov 2026");
    expect(reviewDate("not a date")).toBe("");
  });
});
