import { describe, expect, it } from "vitest";
import {
  changeGuestCart,
  clampQuantity,
  decodeGuestCart,
  encodeGuestCart,
  freeShipping,
  fromPaise,
  MAX_CART_LINES,
  mergeGuestLines,
  priceChange,
  problemLines,
  toPaise,
  type Cart,
  type CartLine,
} from "@/lib/cart/rules";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("the guest bag cookie", () => {
  it("round-trips variant ids and quantities", () => {
    const lines = [
      { variantId: A, quantity: 2 },
      { variantId: B, quantity: 1 },
    ];
    expect(decodeGuestCart(encodeGuestCart(lines))).toEqual(lines);
  });

  it("treats anything malformed as an empty bag, and skips bad lines", () => {
    expect(decodeGuestCart(undefined)).toEqual([]);
    expect(decodeGuestCart("not-a-cookie")).toEqual([]);
    expect(decodeGuestCart(Buffer.from('{"a":1}').toString("base64url"))).toEqual([]);
    const messy = Buffer.from(
      JSON.stringify([[A, 2], ["not-a-uuid", 1], [B, "3"], [B.toUpperCase(), 99], 7]),
    ).toString("base64url");
    // B in capitals is the same item; 99 is capped at 10.
    expect(decodeGuestCart(messy)).toEqual([
      { variantId: A, quantity: 2 },
      { variantId: B, quantity: 10 },
    ]);
  });

  it("keeps at most 50 lines and joins repeats", () => {
    const many = Array.from({ length: 60 }, (_, n) => ({ variantId: id(n), quantity: 1 }));
    expect(mergeGuestLines(many)).toHaveLength(MAX_CART_LINES);
    expect(
      mergeGuestLines([
        { variantId: A, quantity: 7 },
        { variantId: A, quantity: 6 },
      ]),
    ).toEqual([{ variantId: A, quantity: 10 }]);
  });
});

describe("changing a guest bag", () => {
  const bag = [{ variantId: A, quantity: 2 }];

  it("adds to an existing line or a new one", () => {
    expect(changeGuestCart(bag, { kind: "add", variantId: A, quantity: 3 })).toEqual({
      lines: [{ variantId: A, quantity: 5 }],
    });
    expect(changeGuestCart(bag, { kind: "add", variantId: B, quantity: 1 })).toEqual({
      lines: [...bag, { variantId: B, quantity: 1 }],
    });
  });

  it("sets and removes lines", () => {
    expect(changeGuestCart(bag, { kind: "set", variantId: A, quantity: 4 })).toEqual({
      lines: [{ variantId: A, quantity: 4 }],
    });
    expect(changeGuestCart(bag, { kind: "remove", variantId: A })).toEqual({ lines: [] });
  });

  it("refuses an 11th of one item and a 51st line", () => {
    expect(
      changeGuestCart([{ variantId: A, quantity: 10 }], { kind: "add", variantId: A, quantity: 1 }),
    ).toEqual({ problem: "line_full" });
    const full = Array.from({ length: 50 }, (_, n) => ({ variantId: id(n), quantity: 1 }));
    expect(changeGuestCart(full, { kind: "add", variantId: A, quantity: 1 })).toEqual({
      problem: "cart_full",
    });
  });

  it("keeps quantities between 1 and 10", () => {
    expect([0, 1, 4.6, 11, -3, Number.NaN].map(clampQuantity)).toEqual([1, 1, 5, 10, 1, 1]);
  });
});

describe("money, exactly", () => {
  it("converts to and from paise without float errors", () => {
    expect(toPaise("6999.50")).toBe(699950);
    expect(toPaise("0.1")).toBe(10);
    expect(fromPaise(toPaise("0.1") + toPaise("0.2"))).toBe("0.30");
  });
});

describe("free shipping", () => {
  it("says how much more, or that it's reached", () => {
    expect(freeShipping("1649.00", "1999")).toEqual({
      reached: false,
      remaining: "350.00",
      percent: 82,
    });
    expect(freeShipping("1999.00", "1999")).toEqual({ reached: true });
    expect(freeShipping("500.00", "0")).toEqual({ reached: true });
  });

  it("says nothing for an empty bag or when no amount is set", () => {
    expect(freeShipping("0.00", "1999")).toBeNull();
    expect(freeShipping("500.00", null)).toBeNull();
  });
});

const line = (patch: Partial<CartLine> = {}): CartLine => ({
  id: A,
  variantId: A,
  productId: "p",
  productName: "Silky Tape-ins",
  productSlug: "silky-tape-ins",
  sku: "ST-18",
  variantLabel: "18 in · Natural Black",
  image: null,
  unitPrice: "5999.00",
  listPrice: "6999.00",
  onSale: true,
  quantity: 1,
  lineTotal: "5999.00",
  availability: "available",
  message: null,
  ...patch,
});

describe("price changes and problems", () => {
  it("notes a price that differs from the one seen when adding", () => {
    expect(priceChange(line(), { [A]: "6999.00" })).toEqual({ from: "6999.00", to: "5999.00" });
    expect(priceChange(line(), { [A]: "5999" })).toBeNull();
    expect(priceChange(line(), {})).toBeNull();
  });

  it("lists the lines that need attention", () => {
    const cart: Cart = {
      lines: [
        line(),
        line({ id: B, variantId: B, availability: "insufficient_stock" }),
        line({ id: "c", variantId: "c", availability: "unavailable" }),
      ],
      itemCount: 3,
      subtotal: "5999.00",
      currency: "INR",
      readyForCheckout: false,
    };
    expect(problemLines(cart).map((l) => l.id)).toEqual([B, "c"]);
  });
});
