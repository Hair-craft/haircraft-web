import { expect, type APIRequestContext, type Page } from "@playwright/test";
import type { PublicProduct } from "@/lib/api/types";
import { defaultVariant } from "@/lib/product/variants";
import { API, OPEN } from "../../../playwright.config";

/** Helpers for tests that shop as a signed-in customer against the test API. */

export const PASSWORD = "Silky2026!";
const ADMIN = { email: "admin@example.com", password: "HcDev@2026!" };
export const CLIP_INS = "classic-straight-clip-in-set";

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

let counter = 0;
export const freshEmail = (prefix: string) => `${prefix}.${Date.now()}.${++counter}@example.com`;

export async function product(request: APIRequestContext, slug: string): Promise<PublicProduct> {
  return (await (await request.get(`${API}/products/${slug}`)).json()).data;
}

export async function adminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API}/admin/auth/login`, { data: ADMIN });
  expect(response.status(), "the seeded admin can sign in").toBe(200);
  return (await response.json()).data.accessToken;
}

export async function setStock(request: APIRequestContext, variantId: string, quantity: number) {
  const response = await request.post(`${API}/admin/inventory/${variantId}/adjustments`, {
    headers: auth(await adminToken(request)),
    data: { type: "ADJUSTMENT", quantity, reason: "Storefront end-to-end test" },
  });
  expect(response.ok(), `stock of ${variantId} set to ${quantity}`).toBe(true);
}

/**
 * Unpaid online orders hold their stock (the test API's expiry job is off),
 * so tests that place them cancel them before and after (test database only).
 */
export async function cancelUnpaidOrders(request: APIRequestContext) {
  const admin = auth(await adminToken(request));
  for (;;) {
    const list = await request.get(`${API}/admin/orders`, {
      headers: admin,
      params: { status: "PENDING_PAYMENT", limit: 100 },
    });
    const orders: { id: string }[] = (await list.json()).data;
    if (orders.length === 0) return;
    for (const order of orders) {
      const cancelled = await request.patch(`${API}/admin/orders/${order.id}/status`, {
        headers: admin,
        data: { status: "CANCELLED", reason: "End-to-end test clean-up" },
      });
      expect(cancelled.ok(), "an unpaid test order is cancelled").toBe(true);
    }
  }
}

/** A new customer with one address and the clip-ins in the bag. */
export async function shopper(request: APIRequestContext, prefix: string) {
  const email = freshEmail(prefix);
  const registered = await request.post(`${API}/auth/register`, {
    data: { email, password: PASSWORD, firstName: "Meera" },
  });
  expect(registered.status()).toBe(201);
  const token = (await registered.json()).data.accessToken as string;
  const saved = await request.post(`${API}/addresses`, {
    headers: auth(token),
    data: {
      fullName: "Meera Iyer",
      phone: "+919812345678",
      line1: "Flat 12B, Sea View Apartments",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400050",
    },
  });
  expect(saved.status()).toBe(201);
  const addressId = (await saved.json()).data.id as string;
  const variant = defaultVariant((await product(request, CLIP_INS)).variants)!;
  const added = await request.post(`${API}/cart/items`, {
    headers: auth(token),
    data: { variantId: variant.id, quantity: 1 },
  });
  expect(added.ok(), "added to the bag").toBe(true);
  return { email, token, variant, addressId };
}

/** Adds to the bag and places an order through the API (quicker than checkout); returns the order. */
export async function placeOrderByApi(
  request: APIRequestContext,
  token: string,
  addressId: string,
  options: { pay?: "ONLINE" | "COD"; slug?: string; quantity?: number; skipAdd?: boolean } = {},
): Promise<{ id: string; orderNumber: string; grandTotal: string }> {
  if (!options.skipAdd) {
    const variant = defaultVariant((await product(request, options.slug ?? CLIP_INS)).variants)!;
    const added = await request.post(`${API}/cart/items`, {
      headers: auth(token),
      data: { variantId: variant.id, quantity: options.quantity ?? 1 },
    });
    expect(added.ok(), "added to the bag").toBe(true);
  }
  const placed = await request.post(`${API}/orders`, {
    headers: {
      ...auth(token),
      "Idempotency-Key": `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    data: { addressId, paymentMethod: options.pay ?? "COD" },
  });
  expect(placed.status(), "order placed").toBe(201);
  return (await placed.json()).data;
}

/** Pays an online order through the test API's stand-in Razorpay (B13), as the window would. */
export async function payByApi(request: APIRequestContext, token: string, orderNumber: string) {
  const started = await request.post(`${API}/orders/${orderNumber}/payments/razorpay`, {
    headers: auth(token),
    data: {},
  });
  expect(started.ok(), "payment started").toBe(true);
  const { razorpayOrderId } = (await started.json()).data;
  const paid = await request.post(`${API}/dev/razorpay/pay`, {
    data: { razorpayOrderId, outcome: "success" },
  });
  const verified = await request.post(`${API}/orders/${orderNumber}/payments/razorpay/verify`, {
    headers: auth(token),
    data: (await paid.json()).data.result,
  });
  expect(verified.ok(), "payment verified").toBe(true);
}

/** A staff change to an order (status, shipping), as the admin panel would make it. */
export async function adminOrder(
  request: APIRequestContext,
  orderId: string,
  change: {
    status?: string;
    shipping?: { carrier: string; trackingNumber: string; trackingUrl?: string };
  },
) {
  const headers = auth(await adminToken(request));
  if (change.shipping) {
    const r = await request.patch(`${API}/admin/orders/${orderId}/shipping`, {
      headers,
      data: change.shipping,
    });
    expect(r.ok(), "shipping set").toBe(true);
  }
  if (change.status) {
    const r = await request.patch(`${API}/admin/orders/${orderId}/status`, {
      headers,
      data: { status: change.status },
    });
    expect(r.ok(), `status set to ${change.status}`).toBe(true);
  }
}

export async function setProductStatus(
  request: APIRequestContext,
  productId: string,
  status: string,
) {
  const r = await request.patch(`${API}/admin/products/${productId}/status`, {
    headers: auth(await adminToken(request)),
    data: { status },
  });
  expect(r.ok(), `product set to ${status}`).toBe(true);
}

export async function signIn(page: Page, email: string) {
  await page.goto(OPEN + "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/sign-in");
}
