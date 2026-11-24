import { describe, expect, it } from "vitest";
import { invoiceApiPath, invoiceHref } from "@/lib/orders/invoice";

const token = "a".repeat(48);

describe("invoice downloads (owner, 2026-11-24)", () => {
  it("links the shopper's own order, or a guest's private link", () => {
    expect(invoiceHref("hc-100001")).toBe("/bff/invoice/HC-100001");
    expect(invoiceHref("HC-100001", token)).toBe(`/bff/invoice/HC-100001?t=${token}`);
    expect(invoiceHref("HC-100001", "nope")).toBeNull();
    expect(invoiceHref("../admin")).toBeNull();
  });

  it("asks the API for the right PDF", () => {
    expect(invoiceApiPath("hc-100001", null)).toBe("/orders/HC-100001/invoice.pdf");
    expect(invoiceApiPath("HC-100001", token)).toBe(
      `/checkout/magic/receipts/${token}/invoice.pdf`,
    );
  });
});
