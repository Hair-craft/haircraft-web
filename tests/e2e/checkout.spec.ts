import { expect, test, type APIRequestContext, type Page, type Request } from "@playwright/test";
import type { PublicProduct } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { defaultVariant } from "@/lib/product/variants";
import { API, API_DOWN, OPEN } from "../../playwright.config";

const PASSWORD = "Silky2026!";
const ADMIN = { email: "admin@example.com", password: "HcDev@2026!" };
/** Under ₹10,000, so cash on delivery is offered (and over ₹1,999: free shipping). */
const CLIP_INS = "classic-straight-clip-in-set";
/** Over ₹10,000: no cash on delivery. */
const WIG = "hd-lace-front-wig-body-wave";

let counter = 0;
const freshEmail = () => `checkout.${Date.now()}.${++counter}@example.com`;
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const HOME = {
  label: "Home",
  fullName: "Meera Iyer",
  phone: "+919812345678",
  line1: "Flat 12B, Sea View Apartments",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400050",
};
const STUDIO = {
  label: "Studio",
  fullName: "Meera Iyer",
  phone: "+919876543210",
  line1: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
};

async function product(request: APIRequestContext, slug: string): Promise<PublicProduct> {
  return (await (await request.get(`${API}/products/${slug}`)).json()).data;
}

async function adminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API}/admin/auth/login`, { data: ADMIN });
  expect(response.status(), "the seeded admin can sign in").toBe(200);
  return (await response.json()).data.accessToken;
}

async function setStock(request: APIRequestContext, variantId: string, quantity: number) {
  const response = await request.post(`${API}/admin/inventory/${variantId}/adjustments`, {
    headers: auth(await adminToken(request)),
    data: { type: "ADJUSTMENT", quantity, reason: "Storefront end-to-end test" },
  });
  expect(response.ok(), `stock of ${variantId} set to ${quantity}`).toBe(true);
}

/** A customer with a bag (and, unless told otherwise, the two addresses above). */
async function shopper(
  request: APIRequestContext,
  options: { addresses?: object[]; slug?: string; quantity?: number } = {},
) {
  const email = freshEmail();
  const registered = await request.post(`${API}/auth/register`, {
    data: { email, password: PASSWORD, firstName: "Meera" },
  });
  expect(registered.status()).toBe(201);
  const token = (await registered.json()).data.accessToken as string;
  for (const address of options.addresses ?? [HOME, STUDIO]) {
    const saved = await request.post(`${API}/addresses`, { headers: auth(token), data: address });
    expect(saved.status()).toBe(201);
  }
  const variant = defaultVariant((await product(request, options.slug ?? CLIP_INS)).variants)!;
  const added = await request.post(`${API}/cart/items`, {
    headers: auth(token),
    data: { variantId: variant.id, quantity: options.quantity ?? 1 },
  });
  expect(added.ok(), "added to the bag").toBe(true);
  return { email, token, variant };
}

async function signIn(page: Page, email: string) {
  await page.goto(OPEN + "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/sign-in");
}

/**
 * Unpaid online orders hold their stock (the test API's expiry job is off),
 * so they are cancelled before and after these tests (the test database only).
 */
async function cancelUnpaidOrders(request: APIRequestContext) {
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

test.afterAll(async ({ request }) => cancelUnpaidOrders(request));

async function setProductStatus(request: APIRequestContext, productId: string, status: string) {
  const response = await request.patch(`${API}/admin/products/${productId}/status`, {
    headers: auth(await adminToken(request)),
    data: { status },
  });
  expect(response.ok(), `product set to ${status}`).toBe(true);
}

const summary = (page: Page) => page.getByRole("complementary", { name: "Order summary" });
const placeButton = (page: Page) => page.getByRole("button", { name: /^Place order/ });

test.beforeAll(async ({ request }) => {
  await cancelUnpaidOrders(request);
  // Orders really reduce stock in the test database: start each run with plenty.
  await setStock(request, defaultVariant((await product(request, CLIP_INS)).variants)!.id, 50);
  await setStock(request, defaultVariant((await product(request, WIG)).variants)!.id, 50);
});

test.describe("opening checkout", () => {
  test("a guest signs in first and comes back with the bag", async ({ page, request }) => {
    const email = freshEmail();
    await request.post(`${API}/auth/register`, {
      data: { email, password: PASSWORD, firstName: "Asha" },
    });
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    await page.getByRole("button", { name: "Add to bag" }).click();
    const drawer = page.getByRole("dialog", { name: /^Your bag/ });
    await drawer.getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(`${OPEN}/sign-in?next=${encodeURIComponent("/checkout")}`);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(OPEN + "/checkout");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Checkout");
    await expect(summary(page).getByRole("listitem")).toHaveCount(1);
    // No address yet: the form is right there.
    await expect(page.getByText("Your first address becomes your default.")).toBeVisible();
    await expect(placeButton(page)).toBeDisabled();
    await expect(page.getByText("Add a delivery address to continue.")).toBeVisible();
  });

  test("an empty bag goes back to the bag page", async ({ page, request }) => {
    const email = freshEmail();
    await request.post(`${API}/auth/register`, {
      data: { email, password: PASSWORD, firstName: "Asha" },
    });
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    await expect(page).toHaveURL(OPEN + "/cart");
  });

  test("the quiet header: secure checkout and a way back to the bag", async ({ page, request }) => {
    const { email } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    await expect(page.getByText("Secure checkout")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Account and cart" })).toHaveCount(0);
    await page.getByRole("link", { name: "Back to bag" }).click();
    await expect(page).toHaveURL(OPEN + "/cart");
  });
});

test.describe("choosing", () => {
  test("the default address is chosen; another can be chosen or added", async ({
    page,
    request,
  }) => {
    const { email } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    const homeChoice = page.getByRole("radio", { name: /^Home/ });
    await expect(homeChoice).toBeChecked();
    await expect(summary(page)).toContainText("Delivering to Meera Iyer, Mumbai 400050.");

    await page.getByRole("radio", { name: /^Studio/ }).check();
    await expect(page).toHaveURL(/address=/);
    await expect(summary(page)).toContainText("Delivering to Meera Iyer, Bengaluru 560001.");

    await page.getByRole("link", { name: "+ Add a new address" }).click();
    await expect(page).toHaveURL(/\/checkout\/address/);
    await page.getByLabel("Full name").fill("Meera Iyer");
    await page.getByLabel("Mobile number").fill("98123 45678");
    await page.getByLabel("Flat, house, building, street").fill("4 Lake View");
    await page.getByLabel("Town or city").fill("Kochi");
    await page.getByLabel("State").selectOption("Kerala");
    await page.getByLabel("PIN code").fill("682001");
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(page).toHaveURL(/\/checkout\?address=/);
    await expect(summary(page)).toContainText("Delivering to Meera Iyer, Kochi 682001.");
  });

  test("a coupon: applied, refused with its reason, removed", async ({ page, request }) => {
    const code = `TEN${Date.now().toString(36).toUpperCase()}`;
    const big = `${code}X`;
    const admin = auth(await adminToken(request));
    for (const coupon of [
      { code, type: "PERCENTAGE", value: "10" },
      { code: big, type: "FIXED_AMOUNT", value: "500", minOrderAmount: "50000" },
    ]) {
      const created = await request.post(`${API}/admin/coupons`, { headers: admin, data: coupon });
      expect(created.status(), `coupon ${coupon.code}`).toBe(201);
    }
    const { email, variant } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");

    await summary(page).getByText("Have a coupon?").click();
    await summary(page).getByLabel("Coupon code").fill(code.toLowerCase());
    await summary(page).getByRole("button", { name: "Apply" }).click();
    await expect(summary(page)).toContainText(`${code} applied`);
    const discount = (Number(variant.effectivePrice) * 0.1).toFixed(2);
    await expect(summary(page)).toContainText(`Discount (${code})`);
    await expect(summary(page)).toContainText(`−${formatPrice(discount)}`);
    const total = (Number(variant.effectivePrice) - Number(discount)).toFixed(2);
    await expect(placeButton(page)).toHaveText(`Place order · ${formatPrice(total)}`);

    await summary(page).getByRole("link", { name: "Remove" }).click();
    await expect(summary(page)).not.toContainText("applied");

    await summary(page).getByText("Have a coupon?").click();
    await summary(page).getByLabel("Coupon code").fill(big);
    await summary(page).getByRole("button", { name: "Apply" }).click();
    await expect(summary(page).getByRole("alert")).toBeVisible();
    await expect(summary(page).getByLabel("Coupon code")).toHaveAttribute("aria-invalid", "true");
    // A coupon that doesn't apply changes nothing: the order can still be placed.
    await expect(placeButton(page)).toBeEnabled();

    await summary(page).getByLabel("Coupon code").fill("NO-SUCH-CODE");
    await summary(page).getByRole("button", { name: "Apply" }).click();
    await expect(summary(page).getByRole("alert")).toBeVisible();
  });

  test("totals: free shipping over ₹1,999 and the GST included", async ({ page, request }) => {
    const { email, variant } = await shopper(request, { quantity: 2 });
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    const twice = (Number(variant.effectivePrice) * 2).toFixed(2);
    await expect(summary(page)).toContainText(`Subtotal${formatPrice(twice)}`);
    await expect(summary(page)).toContainText("ShippingFree");
    await expect(summary(page)).toContainText(/Includes ₹[\d,]+(\.\d\d)? GST/);
  });
});

test.describe("placing an order", () => {
  test("cash on delivery: confirmed, with instructions; the bag is emptied", async ({
    page,
    request,
  }) => {
    const { email, token, variant } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    await page.getByRole("radio", { name: /^Cash on delivery/ }).check();
    await expect(page).toHaveURL(/pay=cod/);
    await expect(page.getByText("You'll pay the courier when your order arrives.")).toBeVisible();
    await page.getByLabel("Anything the courier should know (optional)").fill("Please call first.");
    await placeButton(page).click();

    await expect(page).toHaveURL(/\/checkout\/placed\/HC-\d+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thank you, Meera");
    await expect(
      page.getByRole("heading", { name: "Confirmed: pay when it arrives" }),
    ).toBeVisible();
    await expect(page.getByText("Instructions: Please call first.")).toBeVisible();
    await expect(page.getByText(formatPrice(variant.effectivePrice)).first()).toBeVisible();

    const orderNumber = page.url().split("/").pop()!;
    const order = (
      await (await request.get(`${API}/orders/${orderNumber}`, { headers: auth(token) })).json()
    ).data;
    expect(order).toMatchObject({
      status: "CONFIRMED",
      paymentMethod: "COD",
      notes: "Please call first.",
    });
    const bag = (await (await request.get(`${API}/cart`, { headers: auth(token) })).json()).data;
    expect(bag.itemCount).toBe(0);

    await page.goto(OPEN + "/");
    await expect(
      page
        .getByRole("navigation", { name: "Account and cart" })
        .getByRole("link", { name: /^Bag, / }),
    ).toHaveAccessibleName("Bag, 0 items");
  });

  test("online: placed and awaiting payment", async ({ page, request }) => {
    const { email } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    await expect(page.getByRole("radio", { name: /^Pay online/ })).toBeChecked();
    await placeButton(page).click();
    await expect(page.getByRole("heading", { name: "Awaiting payment" })).toBeVisible();
  });

  test("the same attempt sent twice makes one order", async ({ page, request }) => {
    const { email, token } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    let sent: Request | null = null;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().startsWith(OPEN + "/checkout")) sent = r;
    });
    await placeButton(page).click();
    await expect(page).toHaveURL(/\/checkout\/placed\//);
    const first = sent as Request | null;
    expect(first, "the place-order request").not.toBeNull();
    // Send exactly the same request again (as a double click or a resent form would).
    const again = await page.request.post(first!.url(), {
      headers: first!.headers(),
      data: first!.postDataBuffer() ?? undefined,
      maxRedirects: 0,
    });
    expect(again.status()).toBeLessThan(500);
    const orders = (await (await request.get(`${API}/orders`, { headers: auth(token) })).json())
      .data;
    expect(orders).toHaveLength(1);
  });

  test("a price changed meanwhile is shown before ordering", async ({ page, request }) => {
    const { email } = await shopper(request);
    const clip = await product(request, CLIP_INS);
    const variant = defaultVariant(clip.variants)!;
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    const admin = auth(await adminToken(request));
    const raised = (Number(variant.price) + 100).toFixed(2);
    try {
      const changed = await request.patch(
        `${API}/admin/products/${clip.id}/variants/${variant.id}`,
        {
          headers: admin,
          data: { price: raised },
        },
      );
      expect(changed.ok()).toBe(true);
      await placeButton(page).click();
      await expect(page).toHaveURL(/notice=price-changed/);
      await expect(page.getByText("Prices changed while you were checking out.")).toBeVisible();
      await expect(placeButton(page)).toContainText(formatPrice(raised));
    } finally {
      await request.patch(`${API}/admin/products/${clip.id}/variants/${variant.id}`, {
        headers: admin,
        data: { price: variant.price },
      });
    }
  });

  test("an item that has run out blocks ordering, with a way back to the bag", async ({
    page,
    request,
  }) => {
    const { email } = await shopper(request);
    const clip = await product(request, CLIP_INS);
    try {
      await setProductStatus(request, clip.id, "INACTIVE");
      await signIn(page, email);
      await page.goto(OPEN + "/checkout");
      await expect(summary(page).getByText("1 item needs your attention.")).toBeVisible();
      await expect(placeButton(page)).toBeDisabled();
      await summary(page).getByRole("link", { name: "Review your bag" }).click();
      await expect(page).toHaveURL(OPEN + "/cart");
    } finally {
      await setProductStatus(request, clip.id, "ACTIVE");
    }
  });

  test("no cash on delivery over ₹10,000", async ({ page, request }) => {
    const { email } = await shopper(request, { slug: WIG });
    await signIn(page, email);
    await page.goto(OPEN + "/checkout?pay=cod");
    await expect(placeButton(page)).toBeDisabled();
    await expect(page.getByText("Choose another way to pay to continue.")).toBeVisible();
    await page.getByRole("radio", { name: /^Pay online/ }).check();
    await expect(placeButton(page)).toBeEnabled();
  });

  test("an order page is only for its own customer", async ({ page, browser, request }) => {
    const { email } = await shopper(request);
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    await placeButton(page).click();
    await expect(page).toHaveURL(/\/checkout\/placed\//);
    const url = page.url();

    const other = await browser.newContext();
    const stranger = await other.newPage();
    const { email: otherEmail } = await shopper(request);
    await signIn(stranger, otherEmail);
    const response = await stranger.goto(url);
    expect(response?.status()).toBe(404);
    await other.close();
  });
});

test("without JavaScript, the whole checkout works", async ({ browser, request }) => {
  const { email } = await shopper(request);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(OPEN + "/checkout");
  await page.getByRole("radio", { name: /^Studio/ }).check();
  await page.getByRole("button", { name: "Deliver here" }).click();
  await expect(summary(page)).toContainText("Bengaluru 560001");
  await page.getByRole("radio", { name: /^Cash on delivery/ }).check();
  await page.getByRole("button", { name: "Use this" }).click();
  await expect(page).toHaveURL(/pay=cod/);
  await placeButton(page).click();
  await expect(page.getByRole("heading", { name: "Confirmed: pay when it arrives" })).toBeVisible();
  await context.close();
});

test("with the API down checkout is calm", async ({ page, context }) => {
  await context.addCookies([
    { name: "hc_at", value: "not-a-real-token", url: API_DOWN, httpOnly: true },
  ]);
  const response = await page.goto(API_DOWN + "/checkout");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
});
