/**
 * Cart rules that need no server or browser, so they are unit-tested: the
 * guest cart cookie, quantity limits, the free-shipping line and price-change
 * notes. The API stays the authority on prices and stock (D3); these only
 * shape what is sent and shown.
 */
import type { ImageUrls, Money } from "@/lib/api/types";

/** The API's limits (backend `cart.entity.ts`). */
export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 50;

export type LineAvailability = "available" | "insufficient_stock" | "unavailable";

/** One cart line, as the API returns it (`GET /cart`, `POST /cart/preview`). */
export interface CartLine {
  /** The line id (signed in) or the variant id (a guest's line). */
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  /** e.g. "18 in · Natural Black · Body Wave". */
  variantLabel: string;
  image: ImageUrls | null;
  /** The price paid per unit now (the sale price when on sale). */
  unitPrice: Money;
  listPrice: Money;
  onSale: boolean;
  quantity: number;
  lineTotal: Money;
  availability: LineAvailability;
  /** The API's words for a problem ("Only a limited quantity of this item is available."). */
  message: string | null;
}

export interface Cart {
  lines: CartLine[];
  itemCount: number;
  subtotal: Money;
  currency: string;
  readyForCheckout: boolean;
}

export const EMPTY_CART: Cart = {
  lines: [],
  itemCount: 0,
  subtotal: "0.00",
  currency: "INR",
  readyForCheckout: false,
};

/** A guest's line, as kept in the cookie: the variant and how many. */
export interface GuestLine {
  variantId: string;
  quantity: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A quantity the API accepts: a whole number from 1 to 10. */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.round(quantity)));
}

/** The guest cookie's value: compact JSON (`[["<variantId>",2],…]`), base64url so it is cookie-safe. */
export function encodeGuestCart(lines: GuestLine[]): string {
  const data = lines.slice(0, MAX_CART_LINES).map((l) => [l.variantId, l.quantity]);
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

/** Reads the guest cookie, ignoring anything malformed (a bad cookie is just an empty bag). */
export function decodeGuestCart(value: string | undefined): GuestLine[] {
  if (!value) return [];
  try {
    const data: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!Array.isArray(data)) return [];
    const lines: GuestLine[] = [];
    for (const entry of data) {
      if (!Array.isArray(entry) || typeof entry[0] !== "string" || !UUID.test(entry[0])) continue;
      if (typeof entry[1] !== "number" || !Number.isFinite(entry[1])) continue;
      lines.push({ variantId: entry[0].toLowerCase(), quantity: clampQuantity(entry[1]) });
    }
    return mergeGuestLines(lines);
  } catch {
    return [];
  }
}

/** The same variant twice becomes one line (quantities added, at most 10); at most 50 lines. */
export function mergeGuestLines(lines: GuestLine[]): GuestLine[] {
  const merged = new Map<string, number>();
  for (const line of lines)
    merged.set(line.variantId, clampQuantity((merged.get(line.variantId) ?? 0) + line.quantity));
  return [...merged]
    .slice(0, MAX_CART_LINES)
    .map(([variantId, quantity]) => ({ variantId, quantity }));
}

export type GuestChange =
  | { kind: "add"; variantId: string; quantity: number }
  | { kind: "set"; variantId: string; quantity: number }
  | { kind: "remove"; variantId: string };

/**
 * A guest's bag after a change, or the reason it can't change: the bag is
 * full (50 different items), or the item is already at 10.
 */
export function changeGuestCart(
  lines: GuestLine[],
  change: GuestChange,
): { lines: GuestLine[] } | { problem: "cart_full" | "line_full" } {
  const id = change.variantId.toLowerCase();
  const existing = lines.find((l) => l.variantId === id);
  if (change.kind === "remove") return { lines: lines.filter((l) => l.variantId !== id) };
  if (change.kind === "set") {
    if (!existing) return { lines };
    return {
      lines: lines.map((l) =>
        l.variantId === id ? { ...l, quantity: clampQuantity(change.quantity) } : l,
      ),
    };
  }
  if (existing) {
    if (existing.quantity >= MAX_LINE_QUANTITY) return { problem: "line_full" };
    return {
      lines: lines.map((l) =>
        l.variantId === id ? { ...l, quantity: clampQuantity(l.quantity + change.quantity) } : l,
      ),
    };
  }
  if (lines.length >= MAX_CART_LINES) return { problem: "cart_full" };
  return { lines: [...lines, { variantId: id, quantity: clampQuantity(change.quantity) }] };
}

/** "6999.50" → 699950 paise (exact; amounts are decimal strings, never floats). */
export function toPaise(amount: string): number {
  const [rupees, fraction = ""] = amount.split(".");
  return Number(rupees) * 100 + Number((fraction + "00").slice(0, 2));
}

export function fromPaise(paise: number): string {
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
}

/**
 * The free-shipping line from the shop's marketing setting (checkout shows the
 * real shipping): how much more to add, or that it's reached. `null` when no
 * amount is configured or the bag is empty.
 */
export function freeShipping(
  subtotal: string,
  threshold: string | null,
): { reached: true } | { reached: false; remaining: string; percent: number } | null {
  if (threshold === null || toPaise(subtotal) === 0) return null;
  const goal = toPaise(threshold);
  if (goal === 0 || toPaise(subtotal) >= goal) return { reached: true };
  const remaining = goal - toPaise(subtotal);
  return {
    reached: false,
    remaining: fromPaise(remaining),
    percent: Math.floor((toPaise(subtotal) / goal) * 100),
  };
}

/** Prices the shopper saw when adding each item (kept on their device), by variant id. */
export type SeenPrices = Record<string, Money>;

/** "Price changed from ₹6,999 to ₹5,999", or null when it hasn't (or we don't know). */
export function priceChange(
  line: Pick<CartLine, "variantId" | "unitPrice">,
  seen: SeenPrices,
): { from: Money; to: Money } | null {
  const before = seen[line.variantId];
  if (!before || toPaise(before) === toPaise(line.unitPrice)) return null;
  return { from: before, to: line.unitPrice };
}

/** Lines that need the shopper's attention before checkout. */
export function problemLines(cart: Cart): CartLine[] {
  return cart.lines.filter((line) => line.availability !== "available");
}
