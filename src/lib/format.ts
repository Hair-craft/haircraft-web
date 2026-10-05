/**
 * Display formatting. Amounts arrive as decimal strings ("18397.00") and are
 * formatted without float arithmetic, so ₹0.10 + ₹0.20 style errors cannot
 * appear on screen.
 */

/** Indian digit grouping: 1839700 → "18,39,700". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/**
 * "18397.00" → "₹18,397"; "5999.50" → "₹5,999.50".
 * Paise are shown only when they are not zero (or when `alwaysPaise`).
 */
export function formatPrice(amount: string, options: { alwaysPaise?: boolean } = {}): string {
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) return amount;
  const [, minus, rupees, paiseRaw = ""] = match;
  const paise = paiseRaw.padEnd(2, "0");
  const whole = groupIndian(rupees.replace(/^0+(?=\d)/, ""));
  const showPaise = options.alwaysPaise || paise !== "00";
  return `${minus ? "−" : ""}₹${whole}${showPaise ? `.${paise}` : ""}`;
}

/** "₹3,999" or "₹3,999 – ₹4,999" for a range. */
export function formatPriceRange(min: string, max: string): string {
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}
