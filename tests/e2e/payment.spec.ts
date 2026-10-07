import { expect, test, type Page } from "@playwright/test";
import { defaultVariant } from "@/lib/product/variants";
import { API, OPEN } from "../../playwright.config";
import {
  auth,
  cancelUnpaidOrders,
  CLIP_INS,
  product,
  setStock,
  shopper,
  signIn,
} from "./support/shop";

/*
 * Online payment against the test API's stand-in Razorpay (B13): the
 * storefront runs its real payment code; the stand-in window has Pay, Fail
 * and Close instead of real payment methods.
 */

const paymentWindow = (page: Page) => page.frameLocator('iframe[title="Razorpay test payment"]');
const panel = (page: Page) =>
  page.getByRole("region", {
    name: /Awaiting payment|Payment received|Not paid|Waiting for your bank/,
  });

async function placeOnline(page: Page) {
  await page.goto(OPEN + "/checkout");
  await expect(page.getByRole("radio", { name: /^Pay online/ })).toBeChecked();
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page).toHaveURL(/\/checkout\/placed\/HC-\d+/);
}

const orderNumberOf = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;

test.beforeAll(async ({ request }) => {
  await cancelUnpaidOrders(request);
  await setStock(request, defaultVariant((await product(request, CLIP_INS)).variants)!.id, 50);
});
test.afterAll(async ({ request }) => cancelUnpaidOrders(request));

test("Place order opens the payment window; paying confirms the order", async ({
  page,
  request,
}) => {
  const { email, token } = await shopper(request, "pay");
  await signIn(page, email);
  await placeOnline(page);
  await paymentWindow(page).getByRole("button", { name: "Pay", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  await expect(page.getByText(/paid online\. Your order is confirmed\./)).toBeVisible();
  // ?pay=1 is gone, so a reload doesn't reopen the window.
  await expect(page).toHaveURL(/\/checkout\/placed\/HC-\d+$/);
  const order = (
    await (
      await request.get(`${API}/orders/${orderNumberOf(page)}`, { headers: auth(token) })
    ).json()
  ).data;
  expect(order).toMatchObject({ status: "CONFIRMED", paymentStatus: "PAID" });
  await expect(page.getByRole("button", { name: /^Pay ₹/ })).toHaveCount(0);
});

test("closing the window keeps the order payable; Pay now tries again", async ({
  page,
  request,
}) => {
  const { email } = await shopper(request, "pay");
  await signIn(page, email);
  await placeOnline(page);
  await paymentWindow(page).getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Payment not completed. You can try again.")).toBeVisible();
  await expect(panel(page)).toContainText(/Pay within \d+ minutes or the order is cancelled\./);

  await page.getByRole("button", { name: /^Pay ₹[\d,]+ now$/ }).click();
  await paymentWindow(page).getByRole("button", { name: "Pay", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
});

test("a declined payment is explained, and a retry succeeds", async ({ page, request }) => {
  const { email } = await shopper(request, "pay");
  await signIn(page, email);
  await placeOnline(page);
  await paymentWindow(page).getByRole("button", { name: "Fail" }).click();
  await expect(panel(page).getByRole("alert")).toContainText("the bank declined it");
  // Like Razorpay's window, it stays open after a failure; closing it keeps the reason.
  await paymentWindow(page).getByRole("button", { name: "Close" }).click();
  await expect(panel(page).getByRole("alert")).toContainText("the bank declined it");
  await page.getByRole("button", { name: /^Pay ₹[\d,]+ now$/ }).click();
  await paymentWindow(page).getByRole("button", { name: "Pay", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
});

test("pay later: the order's page offers payment until it's paid", async ({ page, request }) => {
  const { email } = await shopper(request, "pay");
  await signIn(page, email);
  await placeOnline(page);
  const url = page.url().replace(/\?.*$/, "");
  await paymentWindow(page).getByRole("button", { name: "Close" }).click();
  await page.goto(OPEN + "/shop");

  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Awaiting payment" })).toBeVisible();
  // Coming back doesn't reopen the window by itself.
  await expect(page.locator('iframe[title="Razorpay test payment"]')).toHaveCount(0);
  await page.getByRole("button", { name: /^Pay ₹[\d,]+ now$/ }).click();
  await paymentWindow(page).getByRole("button", { name: "Pay", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
});

test("a cancelled unpaid order says so, with Shop again", async ({ page, request }) => {
  const { email, token } = await shopper(request, "pay");
  await signIn(page, email);
  await placeOnline(page);
  await paymentWindow(page).getByRole("button", { name: "Close" }).click();
  const cancelled = await request.post(`${API}/orders/${orderNumberOf(page)}/cancel`, {
    headers: auth(token),
    data: { reason: "Changed my mind" },
  });
  expect(cancelled.ok()).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Not paid" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shop again" })).toBeVisible();
});

test("without JavaScript, the order is placed and the page says payment needs it", async ({
  browser,
  request,
}) => {
  const { email } = await shopper(request, "pay");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page, email);
  await placeOnline(page);
  await expect(page.getByRole("heading", { name: "Awaiting payment" })).toBeVisible();
  // Playwright's text search skips <noscript>; the message is there and shown.
  await expect(page.locator("noscript p")).toContainText("Paying online needs JavaScript.");
  await expect(page.locator("noscript p")).toBeVisible();
  await context.close();
});
