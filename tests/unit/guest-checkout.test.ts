import { describe, expect, it } from "vitest";
import { needsSession } from "@/proxy";

const q = (search = "") => new URLSearchParams(search);

describe("shopping without an account (owner, 2026-11-20)", () => {
  it("lets a guest reach checkout and their order's private confirmation link", () => {
    expect(needsSession("/checkout", q())).toBe(false);
    expect(needsSession("/checkout/placed/HC-100042", q(`t=${"a1".repeat(24)}`))).toBe(false);
  });

  it("still asks to sign in for accounts, the wishlist and confirmation pages without the link", () => {
    expect(needsSession("/account/orders", q())).toBe(true);
    expect(needsSession("/wishlist", q())).toBe(true);
    expect(needsSession("/checkout/placed/HC-100042", q())).toBe(true);
    expect(needsSession("/checkout/placed/HC-100042", q("t=short"))).toBe(true);
    expect(needsSession("/checkout/address", q())).toBe(true);
  });
});
