import { describe, expect, it } from "vitest";
import { homeFocusStyle } from "@/lib/home/home-focus";

describe("home photo framing (owner, 2026-11-24)", () => {
  it("keeps the chosen point in view, zoomed from there", () => {
    expect(homeFocusStyle({ x: 62.5, y: 30, zoom: 1.4 })).toEqual({
      objectPosition: "62.5% 30%",
      transform: "scale(1.4)",
      transformOrigin: "62.5% 30%",
    });
    expect(homeFocusStyle({ x: 20, y: 80, zoom: 1 })).toEqual({ objectPosition: "20% 80%" });
  });

  it("looks as before without a framing, and keeps odd values in range", () => {
    expect(homeFocusStyle(null)).toBeUndefined();
    expect(homeFocusStyle(undefined)).toBeUndefined();
    expect(homeFocusStyle({ x: 140, y: -5, zoom: 9 })).toEqual({
      objectPosition: "100% 0%",
      transform: "scale(3)",
      transformOrigin: "100% 0%",
    });
  });
});
