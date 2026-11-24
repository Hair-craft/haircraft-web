import { describe, expect, it } from "vitest";
import {
  HOME_REVIEW_COUNT,
  cardTilt,
  reviewCardPicture,
  reviewDate,
} from "@/lib/home/review-cards";

describe("review cards (owner, 2026-11-24: tilted cards in a sliding row)", () => {
  it("asks for every chosen review, no longer 8", () => {
    expect(HOME_REVIEW_COUNT).toBe(50);
  });

  it("tilts each card a little, either way, repeating", () => {
    expect([0, 1, 2, 3].map(cardTilt)).toEqual([-4, 3, -2, 5]);
    expect(cardTilt(8)).toBe(cardTilt(0));
    expect(cardTilt(9)).toBe(cardTilt(1));
    expect(new Set(Array.from({ length: 8 }, (_, i) => Math.sign(cardTilt(i)))).size).toBe(2);
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
