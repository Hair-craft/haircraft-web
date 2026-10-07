/**
 * Choosing a product option (variant) on the product page, one property at
 * a time: Length, Colour, Texture. Pure, so the rules are unit-tested.
 */
import type { ProductImage, PublicVariant } from "@/lib/api/types";

export type Axis = "lengthInches" | "color" | "texture";
type Value = number | string;

export const AXES: { key: Axis; label: string }[] = [
  { key: "lengthInches", label: "Length" },
  { key: "color", label: "Colour" },
  { key: "texture", label: "Texture" },
];

export const valueLabel = (axis: Axis, value: Value) =>
  axis === "lengthInches" ? `${value} inch` : String(value);

/** The option shown first: the first in stock, else the first. */
export function defaultVariant<V extends PublicVariant>(variants: V[]): V | undefined {
  return variants.find((v) => v.inStock) ?? variants[0];
}

/** The option for `?variant=<SKU>` (any case), or the default when the SKU is unknown or missing. */
export function variantFromSku<V extends PublicVariant>(
  variants: V[],
  sku: string | undefined,
): V | undefined {
  const wanted = sku?.trim().toLowerCase();
  return (
    (wanted && variants.find((v) => v.sku.toLowerCase() === wanted)) || defaultVariant(variants)
  );
}

/** The values an axis offers, in a sensible order (lengths shortest first); empty when no option has one. */
export function axisValues(variants: PublicVariant[], axis: Axis): Value[] {
  const values = [...new Set(variants.map((v) => v[axis]).filter((v) => v !== null))] as Value[];
  return axis === "lengthInches"
    ? (values as number[]).sort((a, b) => a - b)
    : (values as string[]).sort((a, b) => a.localeCompare(b));
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
  const candidates = variants.filter((v) => v[axis] === value);
  const score = (v: V) =>
    others(axis).filter((a) => v[a] === current[a]).length * 2 + (v.inStock ? 1 : 0);
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
    (v) => v[axis] === value && others(axis).every((a) => v[a] === current[a]),
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
