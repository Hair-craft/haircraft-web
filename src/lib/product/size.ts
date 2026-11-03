/**
 * A variant's size (owner, 2026-11-03): height, width or both, in a unit the
 * admin types (cm when empty). The address and filters write it as the API
 * does: `13x15`, `13x` (height only), `x15` (width only), `13x15~inch`.
 * Pure, so the rules are unit-tested.
 */
export interface SizeParts {
  sizeHeightCm: number | null;
  sizeWidthCm: number | null;
  sizeUnit?: string | null;
}

/** The unit as it goes into a key: lower-case letters and digits, cm left out. */
export function unitKey(unit: string | null | undefined): string | null {
  const key = (unit ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return key === "" || key === "cm" ? null : key;
}

export function sizeKey(size: SizeParts): string | null {
  if (size.sizeHeightCm === null && size.sizeWidthCm === null) return null;
  const unit = unitKey(size.sizeUnit);
  return `${size.sizeHeightCm ?? ""}x${size.sizeWidthCm ?? ""}${unit ? `~${unit}` : ""}`;
}

/** "13 × 15 cm", "13 inch (height)", "15 mm (width)". */
function text(height: string, width: string, unit: string): string {
  if (height && width) return `${height} × ${width} ${unit}`;
  if (height) return `${height} ${unit} (height)`;
  return `${width} ${unit} (width)`;
}

/** A key read back as words: `13x15~inch` → "13 × 15 inch", `13x` → "13 cm (height)". */
export function sizeLabel(key: string): string {
  const [dimensions, unit] = key.split("~");
  const [height = "", width = ""] = dimensions.split("x");
  return text(height, width, unit || "cm");
}

/** A variant's size in words, with the unit as typed; null without a size. */
export function sizeText(size: SizeParts): string | null {
  if (size.sizeHeightCm === null && size.sizeWidthCm === null) return null;
  return text(
    size.sizeHeightCm === null ? "" : String(size.sizeHeightCm),
    size.sizeWidthCm === null ? "" : String(size.sizeWidthCm),
    size.sizeUnit?.trim() || "cm",
  );
}
