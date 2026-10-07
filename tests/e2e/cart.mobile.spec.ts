import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";

test.describe("bag on a phone", () => {
  test("the drawer fills the screen, and the bag page fits it", async ({ page }) => {
    await page.goto(`${OPEN}/product/classic-straight-clip-in-set`);
    await page.getByRole("button", { name: "Add to bag" }).tap();
    const drawer = page.getByRole("dialog", { name: /^Your bag/ });
    await expect(drawer).toBeVisible();
    const screen = page.viewportSize()!;
    const box = await drawer.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(screen.width * 0.85);
    await drawer.getByRole("link", { name: "View bag" }).tap();
    await expect(page).toHaveURL(OPEN + "/cart");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen.width,
    );
  });
});
