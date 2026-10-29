/**
 * The API asks the storefront to refresh its caches after admin changes
 * (`POST /bff/revalidate`), so a deleted or hidden product disappears at
 * once. Pure (no Next imports), so the rules are unit-tested.
 */
import { timingSafeEqual } from "node:crypto";

/** The cache tags the API may refresh: product lists, pages and filters; the category menu. */
export const REVALIDATE_TAGS = ["products", "categories"] as const;
export type RevalidateTag = (typeof REVALIDATE_TAGS)[number];

/** The secret must be at least this long, or refreshing stays switched off. */
export const MIN_SECRET_LENGTH = 32;

/**
 * Whether `Authorization: Bearer <secret>` carries the shared secret.
 * Off (always false) without a long enough REVALIDATE_SECRET.
 */
export function authorised(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < MIN_SECRET_LENGTH || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** The known tags asked for (`{ "tags": [...] }`); all of them when none are named. */
export function requestedTags(body: unknown): RevalidateTag[] {
  const tags =
    typeof body === "object" && body !== null && Array.isArray((body as { tags?: unknown }).tags)
      ? (body as { tags: unknown[] }).tags
      : [];
  const known = REVALIDATE_TAGS.filter((tag) => tags.includes(tag));
  return known.length > 0 ? known : [...REVALIDATE_TAGS];
}
