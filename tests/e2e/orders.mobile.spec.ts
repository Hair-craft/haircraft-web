import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";
import { placeOrderByApi, shopper, signIn } from "./support/shop";

test.describe("my orders on a phone", () => {
  test("the list and an order fit; the progress runs down the screen", async ({
    page,
    request,
  }) => {
    const { email, token, addressId } = await shopper(request, "orders.phone");
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    await page.goto(OPEN + "/sign-in");
    await signIn(page, email);
    const width = page.viewportSize()!.width;
    for (const path of ["/account/orders", `/account/orders/${order.orderNumber}`]) {
      await page.goto(OPEN + path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} fits the screen`,
      ).toBeLessThanOrEqual(width);
    }
    const steps = page.getByRole("list", { name: "Order progress" }).getByRole("listitem");
    const first = await steps.nth(0).boundingBox();
    const second = await steps.nth(1).boundingBox();
    expect(second!.y, "steps stacked vertically").toBeGreaterThan(first!.y);
  });
});
