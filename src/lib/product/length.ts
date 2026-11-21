/**
 * Variant lengths in inches, cm or m (owner, 2026-11-21). The API sends the
 * number (`lengthInches`, a historic name) and its `lengthUnit`; addresses
 * and filters write a length as a key: `18` (inches, as before), `45~cm`,
 * `1.2~m`.
 */
export type LengthUnit = "inch" | "cm" | "m";

const CM_PER: Record<LengthUnit, number> = { inch: 2.54, cm: 1, m: 100 };

/** The key for a variant's length, or null without one. */
export function lengthKey(variant: {
  lengthInches: number | null;
  lengthUnit?: string | null;
}): string | null {
  if (variant.lengthInches === null || variant.lengthInches === undefined) return null;
  const unit = variant.lengthUnit ?? "inch";
  const number = String(Number(variant.lengthInches));
  return unit === "inch" ? number : `${number}~${unit}`;
}

export function parseLengthKey(key: string): { value: number; unit: LengthUnit } | null {
  const match = /^(\d{1,3}(?:\.\d)?)(?:~(inch|cm|m))?$/.exec(String(key).trim());
  return match ? { value: Number(match[1]), unit: (match[2] as LengthUnit) ?? "inch" } : null;
}

/** For sorting lengths of different units together. */
export function lengthKeyCm(key: string): number {
  const parsed = parseLengthKey(key);
  return parsed ? parsed.value * CM_PER[parsed.unit] : Number.MAX_SAFE_INTEGER;
}

/** "18 inch", "45 cm", "1.2 m". */
export function lengthLabel(key: string | number): string {
  const parsed = parseLengthKey(String(key));
  if (!parsed) return String(key);
  return `${parsed.value} ${parsed.unit}`;
}

/** The short form on the product page's buttons: 18″, 45 cm, 1.2 m. */
export function lengthShort(key: string | number): string {
  const parsed = parseLengthKey(String(key));
  if (!parsed) return String(key);
  return parsed.unit === "inch" ? `${parsed.value}″` : `${parsed.value} ${parsed.unit}`;
}
