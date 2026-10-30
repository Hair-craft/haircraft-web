import { describe, expect, it } from "vitest";
import type { ProductImage, PublicProduct, PublicVariant } from "@/lib/api/types";
import { productJsonLd } from "@/lib/product/structured-data";
import {
  axisValues,
  choiceStatus,
  detailRows,
  defaultVariant,
  galleryFor,
  pick,
  pickerAxes,
  saving,
  settle,
  shopVariants,
  valueLabel,
  variantFromSku,
} from "@/lib/product/variants";

const variant = (sku: string, patch: Partial<PublicVariant> = {}): PublicVariant => ({
  id: sku,
  sku,
  price: "5000.00",
  salePrice: null,
  effectivePrice: "5000.00",
  onSale: false,
  lengthInches: 18,
  color: "Natural Black",
  texture: "Straight",
  weightGrams: 100,
  sizeHeightCm: null,
  sizeWidthCm: null,
  parentVariantId: null,
  purchasable: true,
  attributes: {},
  inStock: true,
  ...patch,
});

// 18 and 20 inch in black; only 20 inch in brown; the 18 inch black is sold out.
const variants = [
  variant("18-NB", { inStock: false }),
  variant("20-NB", { lengthInches: 20 }),
  variant("20-DB", { lengthInches: 20, color: "Dark Brown" }),
];

describe("choosing an option", () => {
  it("starts with the first option in stock, or the first when all are sold out", () => {
    expect(defaultVariant(variants)?.sku).toBe("20-NB");
    expect(defaultVariant([variant("A", { inStock: false })])?.sku).toBe("A");
    expect(defaultVariant([])).toBeUndefined();
  });

  it("opens the option in the address (any case), else the default", () => {
    expect(variantFromSku(variants, "18-nb")?.sku).toBe("18-NB");
    expect(variantFromSku(variants, "nope")?.sku).toBe("20-NB");
    expect(variantFromSku(variants, undefined)?.sku).toBe("20-NB");
  });

  it("offers a row only for properties with more than one value, in order", () => {
    expect(axisValues(variants, "lengthInches")).toEqual([18, 20]);
    expect(axisValues(variants, "color")).toEqual(["Dark Brown", "Natural Black"]);
    expect(pickerAxes(variants)).toEqual(["lengthInches", "color"]);
    expect(valueLabel("lengthInches", 20.5)).toBe("20.5 inch");
  });

  it("keeps the other choices when the combination exists, else moves to the nearest", () => {
    const black20 = variants[1];
    expect(pick(variants, black20, "lengthInches", 18).sku).toBe("18-NB");
    expect(pick(variants, black20, "color", "Dark Brown").sku).toBe("20-DB");
    // From 18 black, brown exists only at 20 inch: the length follows.
    expect(pick(variants, variants[0], "color", "Dark Brown").sku).toBe("20-DB");
  });

  it("prefers an option in stock when several are equally close", () => {
    const list = [
      variant("A", { color: "Blonde", lengthInches: 22, inStock: false }),
      variant("B", { color: "Blonde", lengthInches: 24 }),
      variant("C", { lengthInches: 18 }),
    ];
    expect(pick(list, list[2], "color", "Blonde").sku).toBe("B");
  });

  it("marks each button: available, sold out, or only with other choices", () => {
    const black20 = variants[1];
    expect(choiceStatus(variants, black20, "lengthInches", 20)).toBe("available");
    expect(choiceStatus(variants, black20, "lengthInches", 18)).toBe("soldout");
    expect(choiceStatus(variants, variants[0], "color", "Dark Brown")).toBe("elsewhere");
  });
});

describe("price", () => {
  it("shows the saving exactly (no float rounding)", () => {
    expect(saving(variant("S", { onSale: true, price: "6999.00", salePrice: "5999.00" }))).toBe(
      "1000.00",
    );
    expect(saving(variant("S", { onSale: true, price: "0.30", salePrice: "0.10" }))).toBe("0.20");
    expect(saving(variant("S"))).toBeNull();
  });
});

describe("gallery order", () => {
  const image = (id: string, patch: Partial<ProductImage> = {}): ProductImage => ({
    id,
    urls: { thumbnail: id, medium: id, large: id, original: id },
    altText: null,
    variantId: null,
    isPrimary: false,
    sortOrder: 0,
    ...patch,
  });
  const images = [
    image("general-2", { sortOrder: 2 }),
    image("brown", { variantId: "20-DB", sortOrder: 1 }),
    image("primary", { isPrimary: true, sortOrder: 5 }),
    image("black", { variantId: "20-NB", sortOrder: 3 }),
  ];

  it("shows the option's own photos first, then the general ones, then the others", () => {
    expect(galleryFor(images, "20-NB").map((i) => i.id)).toEqual([
      "black",
      "primary",
      "general-2",
      "brown",
    ]);
    expect(galleryFor(images, undefined).map((i) => i.id)).toEqual([
      "primary",
      "general-2",
      "brown",
      "black",
    ]);
  });
});

describe("structured data", () => {
  const product: PublicProduct = {
    id: "p",
    name: "Silky Tape-ins",
    slug: "silky-tape-ins",
    headline: null,
    shortDescription: "Short",
    description: "Long description",
    attributes: {},
    categories: [{ id: "c", name: "Tape-in Extensions", slug: "tape-in-extensions" }],
    images: [],
    variants,
    options: { lengths: [18, 20], colors: [], textures: [], weights: [], sizes: [] },
    priceRange: { min: "5000.00", max: "5000.00" },
    inStock: true,
    rating: 4.5,
    reviewCount: 2,
  };

  it("describes the product, its prices in rupees and its rating", () => {
    const data = productJsonLd(product, "https://haircraft.in");
    expect(data).toMatchObject({
      "@type": "Product",
      name: "Silky Tape-ins",
      url: "https://haircraft.in/product/silky-tape-ins",
      brand: { name: "HairCraft" },
      offers: {
        priceCurrency: "INR",
        lowPrice: "5000.00",
        offerCount: 3,
        availability: "https://schema.org/InStock",
      },
      aggregateRating: { ratingValue: 4.5, reviewCount: 2 },
    });
  });

  it("leaves the rating out without reviews, and says sold out when nothing is in stock", () => {
    const data = productJsonLd(
      { ...product, reviewCount: 0, rating: 0, variants: [variant("X", { inStock: false })] },
      "https://haircraft.in",
    );
    expect(data).not.toHaveProperty("aggregateRating");
    expect(data.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("the Details list", () => {
  it("drops empty rows and shows a detail given twice only once", () => {
    expect(
      detailRows([
        ["Length", "10 inch"],
        ["Colour", "Black"],
        ["Texture", null],
        ["Length", "25 cm"],
        ["colour", "Black"],
      ]),
    ).toEqual([
      ["Length", "10 inch / 25 cm"],
      ["Colour", "Black"],
    ]);
  });
});

describe("sub-variants and size", () => {
  // TOP-NB (Natural Black) has sub-variants 13 × 15 cm (sold out) and 15 × 16 cm;
  // TOP-BR (Brown) has none.
  const main = variant("TOP-NB", { purchasable: false, inStock: false, lengthInches: null });
  const small = variant("TOP-NB-S", {
    parentVariantId: "TOP-NB",
    lengthInches: null,
    sizeHeightCm: 13,
    sizeWidthCm: 15,
    inStock: false,
  });
  const large = variant("TOP-NB-L", {
    parentVariantId: "TOP-NB",
    lengthInches: null,
    sizeHeightCm: 15,
    sizeWidthCm: 16,
    price: "5999.00",
    effectivePrice: "5999.00",
  });
  const brown = variant("TOP-BR", { color: "Brown", lengthInches: null, inStock: false });
  const all = [main, small, large, brown];

  it("never starts on a main variant that has sub-variants", () => {
    expect(defaultVariant(all)?.sku).toBe("TOP-NB-L");
    expect(variantFromSku(all, "top-nb")?.sku).toBe("TOP-NB-L");
    expect(variantFromSku(all, "TOP-NB-S")?.sku).toBe("TOP-NB-S");
    expect(settle(all, brown)).toBe(brown);
  });

  it("offers the sub-variants, not their main variant, as the choices (no second row)", () => {
    const options = shopVariants(all);
    expect(options.map((v) => v.sku)).toEqual(["TOP-NB-S", "TOP-NB-L", "TOP-BR"]);
    // Colour and Size rows from the sub-variants and the variants without any.
    expect(pickerAxes(options)).toEqual(["color", "size"]);
    expect(axisValues(options, "size")).toEqual(["13x15", "15x16"]);
    // Choosing Brown from 15 × 16 cm picks Brown; choosing 13 × 15 cm keeps Natural Black.
    expect(pick(options, large, "color", "Brown").sku).toBe("TOP-BR");
    expect(pick(options, large, "size", "13x15").sku).toBe("TOP-NB-S");
  });

  it("never offers a variant without a price", () => {
    const unpriced = variant("TOP-XX", {
      color: "Blonde",
      price: null,
      effectivePrice: null,
      purchasable: false,
    });
    expect(shopVariants([...all, unpriced]).map((v) => v.sku)).not.toContain("TOP-XX");
    expect(defaultVariant([unpriced, brown])?.sku).toBe("TOP-BR");
    expect(saving(unpriced)).toBeNull();
  });

  it("shows a main variant's photos first for its sub-variants", () => {
    const photo = (id: string, variantId: string | null): ProductImage =>
      ({
        id,
        variantId,
        isPrimary: false,
        sortOrder: 0,
        altText: null,
        urls: { thumbnail: "", medium: "", large: "", original: "" },
      }) as ProductImage;
    const images = [photo("general", null), photo("main", "TOP-NB"), photo("brown", "TOP-BR")];
    expect(galleryFor(images, "TOP-NB-S", "TOP-NB").map((i) => i.id)).toEqual([
      "main",
      "general",
      "brown",
    ]);
  });

  it("treats size as an option, smallest first", () => {
    expect(axisValues([large, small], "size")).toEqual(["13x15", "15x16"]);
    expect(valueLabel("size", "13x15")).toBe("13 × 15 cm");
    expect(pickerAxes([small, large])).toEqual(["size"]);
  });

  it("gives search engines only what can be bought", () => {
    const ld = productJsonLd(
      {
        id: "p",
        name: "Silk Topper",
        slug: "silk-topper",
        headline: null,
        shortDescription: null,
        description: null,
        attributes: {},
        categories: [],
        images: [],
        variants: all,
        options: { lengths: [], colors: [], textures: [], weights: [], sizes: ["13x15", "15x16"] },
        priceRange: { min: "5000.00", max: "5999.00" },
        inStock: true,
        rating: 0,
        reviewCount: 0,
      },
      "https://shop.example",
    );
    expect(ld.offers.offers.map((o: { sku: string }) => o.sku)).toEqual([
      "TOP-NB-S",
      "TOP-NB-L",
      "TOP-BR",
    ]);
  });
});
