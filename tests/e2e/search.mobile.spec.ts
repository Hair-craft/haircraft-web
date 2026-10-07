import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";

test.describe("search on a phone", () => {
  test("the search bar fills the screen, suggests, and opens a result", async ({ page }) => {
    await page.goto(OPEN + "/");
    await page
      .getByRole("navigation", { name: "Account and cart" })
      .getByRole("link", { name: "Search" })
      .click();
    const box = page.getByRole("combobox", { name: "Search the shop" });
    await expect(box).toBeFocused();
    const screen = page.viewportSize()!;
    const panel = await page.locator(".hc-search-panel").boundingBox();
    expect(panel).toMatchObject({ x: 0, y: 0, width: screen.width, height: screen.height });

    await box.fill("tape");
    const option = page.getByRole("listbox", { name: "Suggestions" }).getByRole("option").first();
    await expect(option).toBeVisible();
    await page.getByRole("button", { name: "Close search" }).tap();
    await expect(box).toHaveCount(0);

    const width = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.inner).toBe(screen.width);
    expect(width.scroll).toBeLessThanOrEqual(screen.width);
  });

  test("results fit the screen", async ({ page }) => {
    await page.goto(OPEN + "/search?q=clip%20in");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Results for “clip in”");
    const screen = page.viewportSize()!.width;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen,
    );
  });
});
