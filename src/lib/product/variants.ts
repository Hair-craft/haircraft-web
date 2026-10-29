/**
 * Choosing a product option (variant) on the product page, one property at
 * a time: Length, Colour, Texture, Size. A main variant with sub-variants is
 * chosen first, then one of its sub-variants (which is what is bought).
 * Pure, so the rules are unit-tested.
 */
import type { ProductImage, PublicVariant } from "@/lib/api/types";

export type Axis = "lengthInches" | "color" | "texture" | "size";
type Value = number | string;

export const AXES: { key: Axis; label: string }[] = [
  { key: "lengthInches", label: "Length" },
  { key: "color", label: "Colour" },
  { key: "texture", label: "Texture" },
  { key: "size", label: "Size" },
];

type Sized = Pick<PublicVariant, "sizeHeightCm" | "sizeWidthCm">;

/** The size as the address and filters write it (`13x15`), or null without one. */
export function sizeKey(variant: Sized): string | null {
  return variant.sizeHeightCm === null || variant.sizeWidthCm === null
    ? null
    : `${variant.sizeHeightCm}x${variant.sizeWidthCm}`;
}

/** `13x15` → "13 × 15 cm". */
export const sizeLabel = (key: string) => `${key.replace("x", " × ")} cm`;

/** A variant's value on an axis (its size as `13x15`). */
export function valueOf(variant: PublicVariant, axis: Axis): Value | null {
  return axis === "size" ? sizeKey(variant) : variant[axis];
}

export const valueLabel = (axis: Axis, value: Value) =>
  axis === "lengthInches"
    ? `${value} inch`
    : axis === "size"
      ? sizeLabel(String(value))
      : String(value);

/** Can be bought as itself (not a main variant with sub-variants). */
const buyable = (v: PublicVariant) => v.purchasable !== false;

/** The main variants (those not under another one). */
export function mainVariants<V extends PublicVariant>(variants: V[]): V[] {
  const ids = new Set(variants.map((v) => v.id));
  return variants.filter((v) => v.parentVariantId === null || !ids.has(v.parentVariantId));
}

/** The sub-variants of a main variant, in the catalogue's order. */
export function subVariantsOf<V extends PublicVariant>(variants: V[], mainId: string): V[] {
  return variants.filter((v) => v.parentVariantId === mainId);
}

/** The main variant a variant belongs to (itself when it is a main one). */
export function mainOf<V extends PublicVariant>(variants: V[], variant: V): V {
  return variants.find((v) => v.id === variant.parentVariantId) ?? variant;
}

/** What is bought when `variant` is chosen: itself, or for a main variant with sub-variants its first one in stock. */
export function settle<V extends PublicVariant>(variants: V[], variant: V): V {
  if (buyable(variant)) return variant;
  const subs = subVariantsOf(variants, variant.id);
  return subs.find((v) => v.inStock) ?? subs[0] ?? variant;
}

/**
 * The main variants as the first step shows them: one with sub-variants is
 * in stock when any of them is.
 */
export function mainChoices<V extends PublicVariant>(variants: V[]): V[] {
  return mainVariants(variants).map((main) => {
    const subs = subVariantsOf(variants, main.id);
    return subs.length > 0 ? { ...main, inStock: subs.some((v) => v.inStock) } : main;
  });
}

/** The option shown first: the first in stock that can be bought, else the first that can be. */
export function defaultVariant<V extends PublicVariant>(variants: V[]): V | undefined {
  const options = variants.filter(buyable);
  return options.find((v) => v.inStock) ?? options[0] ?? variants[0];
}

/** The option for `?variant=<SKU>` (any case), or the default when the SKU is unknown or missing. */
export function variantFromSku<V extends PublicVariant>(
  variants: V[],
  sku: string | undefined,
): V | undefined {
  const wanted = sku?.trim().toLowerCase();
  const found = wanted ? variants.find((v) => v.sku.toLowerCase() === wanted) : undefined;
  return found ? settle(variants, found) : defaultVariant(variants);
}

/**
 * A sub-variant's button text: what it adds to or changes from its main
 * variant ("18 inch", "13 × 15 cm"), else its SKU.
 */
export function subVariantLabel(sub: PublicVariant, main: PublicVariant): string {
  const parts: string[] = [];
  for (const { key } of AXES) {
    const value = valueOf(sub, key);
    if (value !== null && value !== valueOf(main, key)) parts.push(valueLabel(key, value));
  }
  if (sub.weightGrams !== null && sub.weightGrams !== main.weightGrams)
    parts.push(`${sub.weightGrams} g`);
  for (const [name, value] of Object.entries(sub.attributes)) {
    if (main.attributes[name] !== value) parts.push(value);
  }
  return parts.length > 0 ? parts.join(" · ") : sub.sku;
}

/** The values an axis offers, in a sensible order (lengths and sizes smallest first); empty when no option has one. */
export function axisValues(variants: PublicVariant[], axis: Axis): Value[] {
  const values = [
    ...new Set(variants.map((v) => valueOf(v, axis)).filter((v) => v !== null)),
  ] as Value[];
  if (axis === "lengthInches") return (values as number[]).sort((a, b) => a - b);
  if (axis === "size") {
    const dims = (key: string) => key.split("x").map(Number);
    return (values as string[]).sort((a, b) => {
      const [ah, aw] = dims(a);
      const [bh, bw] = dims(b);
      return ah - bh || aw - bw;
    });
  }
  return (values as string[]).sort((a, b) => a.localeCompare(b));
}

/** The axes worth a row of buttons: those with more than one value. */
export function pickerAxes(variants: PublicVariant[]): Axis[] {
  return AXES.map((a) => a.key).filter((axis) => axisValues(variants, axis).length > 1);
}

const others = (axis: Axis) => AXES.map((a) => a.key).filter((a) => a !== axis);

/**
 * Picking `value` on `axis`: keep the other choices when that combination
 * exists; otherwise the option sharing the most other choices, preferring
 * one in stock, then the earliest in the catalogue's order.
 */
export function pick<V extends PublicVariant>(
  variants: V[],
  current: V,
  axis: Axis,
  value: Value,
): V {
  const candidates = variants.filter((v) => valueOf(v, axis) === value);
  const score = (v: V) =>
    others(axis).filter((a) => valueOf(v, a) === valueOf(current, a)).length * 2 +
    (v.inStock ? 1 : 0);
  return candidates.reduce(
    (best, v) => (score(v) > score(best) ? v : best),
    candidates[0] ?? current,
  );
}

/**
 * How a value's button looks, given the current choice:
 * - `available`: the combination exists and is in stock
 * - `soldout`: it exists but is sold out (selectable, struck through)
 * - `elsewhere`: only with other choices (picking it changes them too)
 */
export type ChoiceStatus = "available" | "soldout" | "elsewhere";

export function choiceStatus(
  variants: PublicVariant[],
  current: PublicVariant,
  axis: Axis,
  value: Value,
): ChoiceStatus {
  const exact = variants.find(
    (v) =>
      valueOf(v, axis) === value &&
      others(axis).every((a) => valueOf(v, a) === valueOf(current, a)),
  );
  if (!exact) return "elsewhere";
  return exact.inStock ? "available" : "soldout";
}

/**
 * Photos in the order to show for an option: its own photos first, then the
 * product's general photos, then other options' photos (each group keeping
 * the catalogue's order, the primary photo first).
 */
export function galleryFor(images: ProductImage[], variantId: string | undefined): ProductImage[] {
  const ordered = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  );
  const rank = (image: ProductImage) =>
    image.variantId === null ? 1 : image.variantId === variantId ? 0 : 2;
  return ordered
    .map((image, i) => ({ image, i }))
    .sort((a, b) => rank(a.image) - rank(b.image) || a.i - b.i)
    .map(({ image }) => image);
}

/** "6999.5" → 699950 paise (exact: amounts are decimal strings, never floats). */
function toPaise(amount: string): number {
  const [rupees, fraction = ""] = amount.split(".");
  return Number(rupees) * 100 + Number((fraction + "00").slice(0, 2));
}

/** How much a sale saves, as an amount ("600.00"), or null when not on sale. */
export function saving(variant: PublicVariant): string | null {
  if (!variant.onSale || variant.salePrice === null) return null;
  const paise = toPaise(variant.price) - toPaise(variant.salePrice);
  if (paise <= 0) return null;
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
}

/**
 * The rows of the Details list: empty ones dropped, and a name given twice
 * (an option's own "Length: 25 cm" beside its 10 inch length) shown once, as
 * "10 inch / 25 cm".
 */
export function detailRows(rows: [string, string | null][]): [string, string][] {
  const merged = new Map<string, [string, string]>();
  for (const [name, value] of rows) {
    if (!value) continue;
    const key = name.trim().toLowerCase();
    const seen = merged.get(key);
    if (!seen) merged.set(key, [name, value]);
    else if (!seen[1].split(" / ").includes(value)) seen[1] = `${seen[1]} / ${value}`;
  }
  return [...merged.values()];
}
