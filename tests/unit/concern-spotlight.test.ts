import { describe, expect, it } from "vitest";
import { spotSlot, spotStep, waitingCards } from "@/lib/home/spotlight";

const layout = (active: number, count: number) =>
  Array.from({ length: count }, (_, i) => spotSlot(i, active, count));

describe("Shop by concern spotlight (owner, 2026-11-23)", () => {
  it("puts the active concern in the spotlight, the one before underneath, the next 2 waiting", () => {
    expect(layout(0, 6)).toEqual(["main", "q1", "q2", "out", "out", "under"]);
    expect(layout(2, 6)).toEqual(["out", "under", "main", "q1", "q2", "out"]);
  });

  it("goes round: after the last comes the first", () => {
    expect(layout(5, 6)).toEqual(["q1", "q2", "out", "out", "under", "main"]);
    expect(spotStep(5, 1, 6)).toBe(0);
    expect(spotStep(0, -1, 6)).toBe(5);
    expect(spotStep(3, 1, 6)).toBe(4);
  });

  it("copes with few concerns", () => {
    expect(layout(0, 1)).toEqual(["main"]);
    // With two, the other one waits as the next card.
    expect(layout(0, 2)).toEqual(["main", "q1"]);
    expect(layout(1, 3)).toEqual(["under", "main", "q1"]);
    expect(spotStep(0, 1, 0)).toBe(0);
  });

  it("moving on brings the first waiting card into the spotlight", () => {
    const before = layout(1, 8);
    const after = layout(spotStep(1, 1, 8), 8);
    const grew = before.indexOf("q1");
    expect(after[grew]).toBe("main");
    // The old spotlight stays full size underneath while the new one grows over it.
    expect(after[before.indexOf("main")]).toBe("under");
  });

  it("counts the small cards waiting, so the last one meets the right edge", () => {
    for (const count of [1, 2, 3, 4, 5, 6, 8]) {
      const shown = layout(0, count).filter(
        (slot) => slot === "q1" || slot === "q2" || slot === "q3",
      );
      expect(waitingCards(count)).toBe(shown.length);
    }
  });
});
