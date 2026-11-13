import { describe, expect, it } from "vitest";
import { concernPhoto } from "@/components/home/concerns";
import { concernDescription, concernTitle } from "@/lib/seo/titles";
import { descriptionText, isPlainDescription } from "@/lib/product/description";
import { descriptionHtml } from "@/lib/product/description-html";
import { sizeKey, sizeLabel, sizeText, unitKey } from "@/lib/product/size";

// The owner's changes of 2026-11-03.

describe("variant sizes", () => {
  it("key both sides, one side, and a unit other than cm", () => {
    expect(sizeKey({ sizeHeightCm: 13, sizeWidthCm: 15 })).toBe("13x15");
    expect(sizeKey({ sizeHeightCm: 13, sizeWidthCm: null })).toBe("13x");
    expect(sizeKey({ sizeHeightCm: null, sizeWidthCm: 15, sizeUnit: "cm" })).toBe("x15");
    expect(sizeKey({ sizeHeightCm: 5, sizeWidthCm: 6, sizeUnit: " Inch " })).toBe("5x6~inch");
    expect(sizeKey({ sizeHeightCm: null, sizeWidthCm: null, sizeUnit: "mm" })).toBeNull();
    expect(unitKey("CM")).toBeNull();
  });

  it("read back as words", () => {
    expect(sizeLabel("13x15")).toBe("13 × 15 cm");
    expect(sizeLabel("13x")).toBe("13 cm (height)");
    expect(sizeLabel("x15~mm")).toBe("15 mm (width)");
    expect(sizeText({ sizeHeightCm: 5, sizeWidthCm: 6, sizeUnit: "inch" })).toBe("5 × 6 inch");
    expect(sizeText({ sizeHeightCm: null, sizeWidthCm: null })).toBeNull();
  });
});

describe("rich descriptions", () => {
  it("read as plain text", () => {
    expect(
      descriptionText(
        "<h2>Care</h2><p>Wash <strong>gently</strong> &amp; dry.</p><ul><li>One</li><li>Two</li></ul>",
      ),
    ).toBe("Care Wash gently & dry. One Two");
    expect(descriptionText(null)).toBe("");
    expect(isPlainDescription("Just words & more")).toBe(true);
    expect(isPlainDescription("<p>Formatted</p>")).toBe(false);
  });
});

describe("description HTML for the product page", () => {
  it("keeps the editor's formatting and drops anything else", () => {
    expect(
      descriptionHtml(
        '<p style="text-align: center; color: red">Hi <strong>there</strong></p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">bad</a><a href="https://haircraft.in">good</a>',
      ),
    ).toBe(
      '<p style="text-align:center">Hi <strong>there</strong></p><a target="_blank" rel="noopener noreferrer">bad</a><a href="https://haircraft.in" target="_blank" rel="noopener noreferrer">good</a>',
    );
  });

  it("keeps lists, headings, quotes and line breaks (sanitize-html 2.18.2)", () => {
    const html =
      "<h2>Care</h2><ul><li><em>Wash</em> gently</li><li><u>Air</u> dry</li></ul><ol><li>One</li></ol><blockquote>Soft<br>and light</blockquote><h3>Tip</h3><p><s>old</s> <b>new</b> <i>look</i></p>";
    // A line break comes back self-closed; browsers read both the same.
    expect(descriptionHtml(html)).toBe(html.replace("<br>", "<br />"));
  });

  it("turns older plain text into escaped paragraphs", () => {
    expect(descriptionHtml("Line one\nLine two & three")).toBe(
      "<p>Line one</p><p>Line two &amp; three</p>",
    );
    expect(descriptionHtml("   ")).toBeNull();
  });
});

describe("shop by concern", () => {
  const urls = (name: string) => ({
    thumbnail: `${name}-t`,
    medium: `${name}-m`,
    large: `${name}-l`,
    original: `${name}-o`,
  });

  it("shows the concern's own photo with its description, else the category's, else none", () => {
    expect(concernPhoto({ image: urls("own"), imageAlt: "A topper" }, urls("cat"))).toEqual({
      src: "own-m",
      alt: "A topper",
    });
    expect(concernPhoto({ image: urls("own"), imageAlt: null }, null)).toEqual({
      src: "own-m",
      alt: "",
    });
    expect(concernPhoto({ image: null, imageAlt: "ignored" }, urls("cat"))).toEqual({
      src: "cat-m",
      alt: "",
    });
    expect(concernPhoto({ image: null, imageAlt: null }, null)).toBeNull();
  });
});

describe("concern pages for search engines", () => {
  it("title the page by the concern", () => {
    expect(concernTitle("Grey hair")).toBe("Grey hair: Human Hair Solutions");
    // Too long for search results with the addition: the title alone.
    expect(concernTitle("Thinning hair or a wide parting")).toBe("Thinning hair or a wide parting");
  });

  it("describe it with its line and categories, within 160 characters", () => {
    const text = concernDescription(
      "Thinning hair",
      "Cover it at the crown",
      ["Toppers", "Clip-in Extensions"],
      null,
    );
    expect(text).toMatch(
      /^Thinning hair\? Cover it at the crown\. Shop toppers, clip-in extensions in 100% human hair\./,
    );
    expect(text.length).toBeLessThanOrEqual(160);
    expect(concernDescription("Grey hair", null, ["Wigs"], null)).toMatch(/^Grey hair\? Shop wigs/);
    expect(concernDescription("x".repeat(200), null, ["Wigs"], null).length).toBeLessThanOrEqual(
      160,
    );
  });
});
