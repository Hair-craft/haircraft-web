import { expect, test } from "@playwright/test";
import { defaultVariant } from "@/lib/product/variants";
import { OPEN } from "../../playwright.config";
import { cancelUnpaidOrders, CLIP_INS, product, setStock, shopper, signIn } from "./support/shop";

test.beforeAll(async ({ request }) => {
  await setStock(request, defaultVariant((await product(request, CLIP_INS)).variants)!.id, 50);
});
test.afterAll(async ({ request }) => cancelUnpaidOrders(request));

test.describe("paying on a phone", () => {
  test("the payment window fits, and paying works by touch", async ({ page, request }) => {
    const { email } = await shopper(request, "pay.phone");
    await signIn(page, email);
    await page.goto(OPEN + "/checkout");
    await page.getByRole("button", { name: /^Place order/ }).tap();
    const frame = page.locator('iframe[title="Razorpay test payment"]');
    await expect(frame).toBeVisible();
    const box = await frame.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page
      .frameLocator('iframe[title="Razorpay test payment"]')
      .getByRole("button", { name: "Pay", exact: true })
      .tap();
    await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  });
});
