/** A backslash, then "u003c": the JSON escape for "<" (built from its code so no tool rewrites it). */
const ESCAPED_LESS_THAN = String.fromCharCode(92) + "u003c";

/** Structured data as a `<script type="application/ld+json">` body (no `</script>` break-outs). */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, ESCAPED_LESS_THAN);
}
