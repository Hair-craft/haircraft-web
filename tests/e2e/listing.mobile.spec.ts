import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";

/** The page fits the phone: no sideways scrolling and no zooming out. */
async function expectFitsScreen(page: import("@playwright/test").Page) {
  const screen = page.viewportSize()?.width ?? 0;
  const { inner, scroll } = await page.evaluate(() => ({
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(inner).toBe(screen);
  expect(scroll).toBeLessThanOrEqual(screen);
}

test.describe("shop listing on a phone", () => {
  test("filters open in a side panel and apply together with Show results", async ({ page }) => {
    await page.goto(OPEN + "/shop");
    await expectFitsScreen(page);
    // The desktop filter column is hidden on phones.
    await expect(page.getByRole("complementary", { name: "Filters" })).toBeHidden();

    await page.getByRole("button", { name: "Filters", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "Filters" });
    await expect(panel).toBeVisible();
    await panel.getByRole("checkbox", { name: "Natural Black" }).check();
    await panel.getByRole("checkbox", { name: "18 inch" }).check();
    // Nothing applies until Show results.
    await expect(page).toHaveURL(OPEN + "/shop");

    await panel.getByRole("button", { name: "Show results" }).click();
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(OPEN + "/shop?length=18&color=natural-black");
    await expect(page.getByRole("button", { name: "Filters (2)" })).toBeVisible();
    await expectFitsScreen(page);
  });

  test("Clear all in the panel, and closing without applying keeps the view", async ({ page }) => {
    await page.goto(OPEN + "/shop?length=18");
    await page.getByRole("button", { name: "Filters (1)" }).click();
    const panel = page.getByRole("dialog", { name: "Filters" });
    await panel.getByRole("checkbox", { name: "Natural Black" }).check();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page).toHaveURL(OPEN + "/shop?length=18");

    // Reopened, it shows the applied filters again, not the abandoned tick.
    await page.getByRole("button", { name: "Filters (1)" }).click();
    await expect(panel.getByRole("checkbox", { name: "Natural Black" })).not.toBeChecked();
    await expect(panel.getByRole("checkbox", { name: "18 inch" })).toBeChecked();
    await panel.getByRole("button", { name: "Clear all" }).click();
    await panel.getByRole("button", { name: "Show results" }).click();
    await expect(page).toHaveURL(OPEN + "/shop");
  });

  test("sort and pages work and fit the screen", async ({ page }) => {
    await page.goto(OPEN + "/shop");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(OPEN + "/shop?sort=price-asc");
    await page
      .getByRole("navigation", { name: "Pages" })
      .getByRole("link", { name: "Next ›" })
      .click();
    await expect(page).toHaveURL(OPEN + "/shop?sort=price-asc&page=2");
    await expectFitsScreen(page);
  });
});
