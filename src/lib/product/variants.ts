/**
 * Choosing a product option (variant) on the product page, one property at
 * a time: Length, Colour, Texture, Size. A main variant with sub-variants is
 * never offered: its sub-variants are the choices. Pure, so the rules are
 * unit-tested.
 */
import type { ProductImage, PublicVariant } from "@/lib/api/types";

export type Axis = "lengthInches" | "color" | "texture" | "size";
export type Value = number | string;

export const AXES: { key: Axis; label: string }[] = [
  { key: "lengthInches", label: "Length" },
  { key: "color", label: "Colour" },
  { key: "texture", label: "Texture" },
  { key: "size", label: "Size" },
];

/** The size as the address and filters write it (size.ts). */
export { sizeKey, sizeLabel } from "./size";
import { sizeKey, sizeLabel } from "./size";
import { lengthKey, lengthKeyCm, lengthLabel } from "./length";

/** A variant's value on an axis (its size as `13x15`, its length as `18` or `45~cm`). */
export function valueOf(variant: PublicVariant, axis: Axis): Value | null {
  if (axis === "size") return sizeKey(variant);
  if (axis === "lengthInches") return lengthKey(variant);
  return variant[axis];
}

export const valueLabel = (axis: Axis, value: Value) =>
  axis === "lengthInches"
    ? lengthLabel(value)
    : axis === "size"
      ? sizeLabel(String(value))
      : String(value);

/** Can be bought as itself: priced, and not a main variant with sub-variants. */
const buyable = (v: PublicVariant) => v.purchasable !== false && v.price !== null;

/** The options a shopper chooses from: everything except main variants that have sub-variants. */
export function shopVariants<V extends PublicVariant>(variants: V[]): V[] {
  return variants.filter(buyable);
}

/** The sub-variants of a main variant, in the catalogue's order. */
function subVariantsOf<V extends PublicVariant>(variants: V[], mainId: string): V[] {
  return variants.filter((v) => v.parentVariantId === mainId);
}

/** What is bought when `variant` is chosen: itself, or for a main variant with sub-variants its first one in stock. */
export function settle<V extends PublicVariant>(variants: V[], variant: V): V {
  if (buyable(variant)) return variant;
  const subs = subVariantsOf(variants, variant.id);
  return subs.find((v) => v.inStock) ?? subs[0] ?? variant;
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

/** The values an axis offers, in a sensible order (lengths and sizes smallest first); empty when no option has one. */
export function axisValues(variants: PublicVariant[], axis: Axis): Value[] {
  const values = [
    ...new Set(variants.map((v) => valueOf(v, axis)).filter((v) => v !== null)),
  ] as Value[];
  if (axis === "lengthInches")
    return (values as string[]).sort((a, b) => lengthKeyCm(String(a)) - lengthKeyCm(String(b)));
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

/** The options a photo shows (none: the whole product). */
export function photoVariantIds(image: Pick<ProductImage, "variantId" | "variantIds">): string[] {
  return image.variantIds ?? (image.variantId ? [image.variantId] : []);
}

/** The photo shows one of these options. */
function showsAny(image: ProductImage, ids: (string | null | undefined)[]): boolean {
  return photoVariantIds(image).some((id) => ids.includes(id));
}

/** A photo of the whole product, not of particular options. */
function isGeneral(image: ProductImage): boolean {
  return photoVariantIds(image).length === 0;
}

/**
 * Photos in the order to show for an option: its own photos first, then the
 * product's general photos, then other options' photos (each group keeping
 * the catalogue's order, the primary photo first).
 */
export function galleryFor(
  images: ProductImage[],
  variantId: string | undefined,
  /** A sub-variant's main variant: its photos count as the option's own. */
  mainId?: string | null,
): ProductImage[] {
  const ordered = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  );
  const rank = (image: ProductImage) =>
    isGeneral(image) ? 1 : variantId && showsAny(image, [variantId, mainId]) ? 0 : 2;
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
  if (!variant.onSale || variant.salePrice === null || variant.price === null) return null;
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

/**
 * The photos for the chosen option only (owner, 2026-11-06): its own photos
 * (and its main variant's, for a sub-variant), then the product's general
 * ones; other lengths', colours' and textures' photos are hidden until they
 * are chosen. When the option has no photos of its own, the photos of an
 * option with the same colour and texture are used (the same look in another
 * length). If that leaves nothing, every photo is shown, so the gallery is
 * never empty.
 */
export function optionGallery(
  images: ProductImage[],
  variant: PublicVariant | undefined | null,
  variants: PublicVariant[],
): ProductImage[] {
  const ordered = galleryFor(images, variant?.id, variant?.parentVariantId);
  if (!variant) return ordered;
  const own = (image: ProductImage) => showsAny(image, [variant.id, variant.parentVariantId]);
  let shown = ordered.filter((image) => own(image) || isGeneral(image));
  if (!ordered.some(own)) {
    const sameLook = new Set(
      variants
        .filter(
          (v) => v.id !== variant.id && v.color === variant.color && v.texture === variant.texture,
        )
        .map((v) => v.id),
    );
    const lookAlike = ordered.filter((image) =>
      photoVariantIds(image).some((id) => sameLook.has(id)),
    );
    shown = [...lookAlike, ...ordered.filter(isGeneral)];
  }
  return shown.length > 0 ? shown : ordered;
}

/**
 * The videos for the chosen option (owner, 2026-11-06), by the same rule as
 * photos: its own (and its main variant's), then the product's general
 * ones; another option's videos only when this one has none of its own and
 * that option has the same colour and texture. No fallback to every video:
 * a gallery without videos is fine.
 */
export function optionVideos<T extends { variantId: string | null; sortOrder: number }>(
  videos: T[],
  variant: PublicVariant | undefined | null,
  variants: PublicVariant[],
): T[] {
  const ordered = [...videos].sort((a, b) => a.sortOrder - b.sortOrder);
  if (!variant) return ordered.filter((video) => video.variantId === null);
  const own = (video: T) =>
    video.variantId === variant.id ||
    (variant.parentVariantId !== null && video.variantId === variant.parentVariantId);
  const general = ordered.filter((video) => video.variantId === null);
  const mine = ordered.filter(own);
  if (mine.length > 0) return [...mine, ...general];
  const sameLook = new Set(
    variants
      .filter(
        (v) => v.id !== variant.id && v.color === variant.color && v.texture === variant.texture,
      )
      .map((v) => v.id),
  );
  return [
    ...ordered.filter((video) => video.variantId !== null && sameLook.has(video.variantId)),
    ...general,
  ];
}
