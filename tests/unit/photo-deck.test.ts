import { describe, expect, it } from "vitest";
import { promiseItems } from "@/components/home/sections";
import { counterDigits, deckPose, deckStack, deckStep } from "@/lib/home/photo-deck";

describe("Customer favourites Photo Deck (owner, 2026-11-24)", () => {
  it("steps through the prints, going round", () => {
    expect(deckStep(0, 1, 5)).toBe(1);
    expect(deckStep(4, 1, 5)).toBe(0);
    expect(deckStep(0, -1, 5)).toBe(4);
    expect(deckStep(0, 1, 0)).toBe(0);
  });

  it("stacks the active print on top, then the next few", () => {
    expect(deckStack(3, 5)).toEqual([3, 4, 0, 1]);
    expect(deckStack(0, 2)).toEqual([0, 1]);
    expect(deckStack(0, 1)).toEqual([0]);
  });

  it("lays the top print straight and the others turned, alternately left and right", () => {
    expect(deckPose(0)).toEqual({ rotate: 0, x: 0, y: 0, scale: 1 });
    expect(deckPose(1).rotate).toBeGreaterThan(0);
    expect(deckPose(2).rotate).toBeLessThan(0);
    expect(deckPose(2).y).toBeGreaterThan(deckPose(1).y);
  });

  it("counts with two digits at least, like an odometer", () => {
    expect(counterDigits(3, 8)).toBe("03");
    expect(counterDigits(8, 8)).toBe("08");
    expect(counterDigits(7, 120)).toBe("007");
  });
});

describe("the running lines under Shop by concern (owner, 2026-11-24)", () => {
  it("are the owner's four lines", () => {
    expect(promiseItems).toEqual([
      "Exclusively Crafted In-House",
      "From Our Hands to Yours",
      "Direct from Our Factory",
      "15+ Years of Crafting Excellence",
    ]);
  });
});
