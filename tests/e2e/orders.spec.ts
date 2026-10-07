import { expect, test, type Page } from "@playwright/test";
import { defaultVariant } from "@/lib/product/variants";
import { API, API_DOWN, OPEN } from "../../playwright.config";
import {
  adminOrder,
  auth,
  cancelUnpaidOrders,
  CLIP_INS,
  payByApi,
  placeOrderByApi,
  product,
  setProductStatus,
  setStock,
  shopper,
  signIn,
} from "./support/shop";

const PONYTAIL = "wrap-around-ponytail";
const main = (page: Page) => page.locator("main");
const orderCards = (page: Page) =>
  main(page).getByRole("list", { name: "Orders" }).getByRole("listitem");

test.beforeAll(async ({ request }) => {
  await cancelUnpaidOrders(request);
  for (const slug of [CLIP_INS, PONYTAIL])
    await setStock(request, defaultVariant((await product(request, slug)).variants)!.id, 80);
});
test.afterAll(async ({ request }) => cancelUnpaidOrders(request));

test.describe("the orders list", () => {
  test("newest first, with status filters and an empty state", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders");
    const first = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    const second = await placeOrderByApi(request, token, addressId, { pay: "ONLINE" });
    const third = await placeOrderByApi(request, token, addressId, { slug: PONYTAIL });
    await signIn(page, email);

    await page
      .getByRole("navigation", { name: "My account" })
      .getByRole("link", { name: "My orders" })
      .click();
    await expect(page).toHaveURL(OPEN + "/account/orders");
    await expect(orderCards(page)).toHaveCount(3);
    await expect(orderCards(page).nth(0)).toContainText(third.orderNumber);
    await expect(orderCards(page).nth(0)).toContainText("Wrap-around Ponytail");
    await expect(orderCards(page).nth(0)).toContainText("Pay on delivery");
    await expect(orderCards(page).nth(1)).toContainText(second.orderNumber);
    await expect(orderCards(page).nth(1)).toContainText("Awaiting payment");
    await expect(orderCards(page).nth(2)).toContainText(first.orderNumber);

    await main(page).getByRole("link", { name: "Awaiting payment", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/account/orders?status=pending_payment");
    await expect(orderCards(page)).toHaveCount(1);
    await main(page).getByRole("link", { name: "Delivered", exact: true }).click();
    await expect(main(page).getByText("No orders here")).toBeVisible();

    // The overview shows the latest.
    await page.goto(OPEN + "/account");
    await expect(main(page)).toContainText(`Latest: ${third.orderNumber}`);
  });

  test("pages of 20", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders.many");
    for (let i = 0; i < 21; i++)
      await placeOrderByApi(request, token, addressId, { skipAdd: i === 0 });
    await signIn(page, email);
    await page.goto(OPEN + "/account/orders");
    await expect(orderCards(page)).toHaveCount(20);
    await page
      .getByRole("navigation", { name: "Pages" })
      .getByRole("link", { name: "Next ›" })
      .click();
    await expect(page).toHaveURL(OPEN + "/account/orders?page=2");
    await expect(orderCards(page)).toHaveCount(1);
  });

  test("a new customer sees an empty list", async ({ page, request }) => {
    const { email } = await shopper(request, "orders.none");
    await signIn(page, email);
    await page.goto(OPEN + "/account/orders");
    await expect(main(page).getByText("No orders yet")).toBeVisible();
    await expect(main(page).getByRole("link", { name: "Start shopping" })).toBeVisible();
  });
});

test.describe("an order's page", () => {
  test("progress, items, address; cancelling an unpaid order", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders");
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    await signIn(page, email);
    await page.goto(OPEN + "/account/orders");
    await orderCards(page).first().click();
    await expect(page).toHaveURL(`${OPEN}/account/orders/${order.orderNumber}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(order.orderNumber);

    const progress = page.getByRole("list", { name: "Order progress" });
    await expect(progress).toContainText("Placed (done)");
    await expect(progress).toContainText("Confirmed (done)");
    await expect(progress).toContainText("Shipped (not yet)");
    await expect(main(page)).toContainText("Classic Straight Clip-in Set");
    await expect(main(page)).toContainText("Mumbai, Maharashtra 400050");
    await expect(main(page)).toContainText("Cash on delivery");

    await page.getByText("Cancel this order").click();
    await expect(
      page.getByText("Nothing has been charged, so there's nothing to refund."),
    ).toBeVisible();
    await page.getByRole("radio", { name: "Other" }).check();
    await page.getByRole("button", { name: "Cancel order" }).click();
    await expect(
      page.getByText("Please tell us a little more (at least 3 characters)."),
    ).toBeVisible();
    await page.getByLabel("Anything to add? (needed for Other)").fill("Moving house");
    await page.getByRole("button", { name: "Cancel order" }).click();

    await expect(page.getByText("Your order is cancelled.")).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Cancelled" })).toBeVisible();
    await expect(main(page)).toContainText("Reason: Other: Moving house");
    await expect(page.getByText("Cancel this order")).toHaveCount(0);
  });

  test("a paid order, cancelled, says its refund has started", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders");
    const order = await placeOrderByApi(request, token, addressId, {
      pay: "ONLINE",
      skipAdd: true,
    });
    await payByApi(request, token, order.orderNumber);
    await signIn(page, email);
    await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    await expect(main(page)).toContainText("Online · Paid");
    await page.getByText("Cancel this order").click();
    await expect(page.getByText(/Your payment will be refunded/)).toBeVisible();
    await page.getByRole("button", { name: "Cancel order" }).click();
    await expect(main(page)).toContainText(/Your refund of ₹[\d,]+ has started\./);
    await page.goto(OPEN + "/account/orders");
    await expect(orderCards(page).first()).toContainText("Refund pending");
  });

  test("once shipped: tracking, and no cancelling", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders");
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    await adminOrder(request, order.id, { status: "PROCESSING" });
    await adminOrder(request, order.id, {
      shipping: {
        carrier: "Delhivery",
        trackingNumber: "1234567890123",
        trackingUrl: "https://www.delhivery.com/track/package/1234567890123",
      },
      status: "SHIPPED",
    });
    await signIn(page, email);
    await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    const progress = page.getByRole("list", { name: "Order progress" });
    await expect(progress).toContainText("Packed (done)");
    await expect(progress).toContainText("Shipped (done)");
    await expect(progress).toContainText("Delivered (not yet)");
    await expect(main(page)).toContainText("Sent with Delhivery, tracking number 1234567890123");
    await expect(main(page).getByRole("link", { name: /Track parcel/ })).toHaveAttribute(
      "href",
      "https://www.delhivery.com/track/package/1234567890123",
    );
    await expect(page.getByText("Cancel this order")).toHaveCount(0);
  });

  test("an unpaid order can be paid from its page", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders");
    const order = await placeOrderByApi(request, token, addressId, {
      pay: "ONLINE",
      skipAdd: true,
    });
    await signIn(page, email);
    await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    // It doesn't open by itself here.
    await expect(page.locator('iframe[title="Razorpay test payment"]')).toHaveCount(0);
    await page.getByRole("button", { name: /^Pay ₹[\d,]+ now$/ }).click();
    await page
      .frameLocator('iframe[title="Razorpay test payment"]')
      .getByRole("button", { name: "Pay", exact: true })
      .click();
    await expect(main(page)).toContainText("Online · Paid");
    await expect(page.getByRole("heading", { level: 1 }).locator("..")).toContainText("Confirmed");
  });

  test("Buy again puts the still-available items back in the bag", async ({ page, request }) => {
    const { email, token, addressId } = await shopper(request, "orders");
    // Two products in one order.
    const pony = defaultVariant((await product(request, PONYTAIL)).variants)!;
    await request.post(`${API}/cart/items`, {
      headers: auth(token),
      data: { variantId: pony.id, quantity: 1 },
    });
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    const ponytail = await product(request, PONYTAIL);
    try {
      await setProductStatus(request, ponytail.id, "INACTIVE");
      await signIn(page, email);
      await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
      await page.getByRole("button", { name: "Buy again" }).click();
      await expect(page).toHaveURL(OPEN + "/cart");
      await expect(
        page.getByText("Some items from your bag couldn't be added: they're no longer available."),
      ).toBeVisible();
      await expect(
        main(page).getByRole("list", { name: "Items in your bag" }).getByRole("listitem"),
      ).toHaveCount(1);
      await expect(main(page)).toContainText("Classic Straight Clip-in Set");
    } finally {
      await setProductStatus(request, ponytail.id, "ACTIVE");
    }
  });

  test("someone else's order is not found; guests sign in first", async ({
    page,
    browser,
    request,
  }) => {
    const { token, addressId } = await shopper(request, "orders");
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    await expect(guestPage).toHaveURL(/\/sign-in\?next=/);
    await guest.close();

    const { email: other } = await shopper(request, "orders.other");
    await signIn(page, other);
    const response = await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    expect(response?.status()).toBe(404);
  });

  test("the thank-you page links to the order", async ({ page, request }) => {
    const { email } = await shopper(request, "orders");
    await signIn(page, email);
    await page.goto(OPEN + "/checkout?pay=cod");
    await page.getByRole("button", { name: /^Place order/ }).click();
    await expect(page).toHaveURL(/\/checkout\/placed\//);
    await page.getByRole("link", { name: "View your order" }).click();
    await expect(page).toHaveURL(/\/account\/orders\/HC-\d+$/);
  });
});

test("without JavaScript, an order can be cancelled", async ({ browser, request }) => {
  const { email, token, addressId } = await shopper(request, "orders");
  const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
  await page.getByText("Cancel this order").click();
  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(main(page).getByRole("heading", { name: "Cancelled" })).toBeVisible();
  await expect(main(page)).toContainText("Reason: Ordered by mistake");
  await context.close();
});

test("with the API down My orders is calm", async ({ page, context }) => {
  await context.addCookies([
    { name: "hc_at", value: "not-a-real-token", url: API_DOWN, httpOnly: true },
  ]);
  const response = await page.goto(API_DOWN + "/account/orders");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
});
