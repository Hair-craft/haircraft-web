import { describe, expect, it } from "vitest";
import { splitMenu, type NavItem } from "@/components/layout/nav";
import { deliveryAndReturns } from "@/components/product-page/content";
import { returnsContent } from "@/content/returns";
import { returnRules } from "@/content/returns-rules";

const item = (label: string, children: NavItem[] = []): NavItem => ({
  label,
  href: `/shop/${label.toLowerCase()}`,
  children,
});

describe("category bar", () => {
  it("shows up to five categories and puts the rest under More, in order", () => {
    const items = ["Topper", "Wig", "Clip-in", "Tape-in", "Ponytail", "Bangs", "Care"].map((l) =>
      item(l),
    );
    const { shown, more } = splitMenu(items);
    expect(shown.map((i) => i.label)).toEqual(["Topper", "Wig", "Clip-in", "Tape-in", "Ponytail"]);
    expect(more.map((i) => i.label)).toEqual(["Bangs", "Care"]);
  });

  it("has no More with five or fewer, and keeps sub-categories", () => {
    const items = [
      item("Topper", [item("Butterfly Hair Topper")]),
      item("Wig", [item("Silk Base Wig"), item("Mono Wig")]),
    ];
    const { shown, more } = splitMenu(items);
    expect(more).toEqual([]);
    expect(shown[1].children.map((c) => c.label)).toEqual(["Silk Base Wig", "Mono Wig"]);
  });
});

describe("exchange policy", () => {
  it("is exchange only, within 4 days, for defective and unused items", () => {
    expect(returnRules.exchangeDays).toBe(4);
    const text = JSON.stringify(returnsContent);
    expect(returnsContent.summary).toContain(
      "Defective and unused? Exchange within 4 days of delivery",
    );
    expect(returnsContent.summary).toContain("No returns or refunds after delivery");
    expect(text).toContain("within **4 days of delivery**");
    expect(text).not.toMatch(/change of mind, you can return|return within/i);
    expect(deliveryAndReturns[1]).toBe(
      "Defective items can be exchanged within 4 days of delivery if unused. No returns or refunds after delivery. [Exchange policy](/returns)",
    );
  });

  it("still refunds orders cancelled before they ship", () => {
    const cancel = returnsContent.sections.find((s) => s.id === "cancel");
    expect(JSON.stringify(cancel)).toContain("the full amount goes back to the way you paid");
  });
});
