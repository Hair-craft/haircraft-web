import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";

/** The page fits the phone: no sideways scrolling and no zooming out (the browser widens its window when content overflows). */
async function expectFitsScreen(page: import("@playwright/test").Page) {
  const screen = page.viewportSize()?.width ?? 0;
  const { inner, scroll } = await page.evaluate(() => ({
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(inner).toBe(screen);
  expect(scroll).toBeLessThanOrEqual(screen);
}

test.describe("home page on a phone", () => {
  test("product rows scroll sideways; the page itself never does", async ({ page }) => {
    await page.goto(OPEN + "/");
    const row = page
      .getByRole("region", { name: "Most loved hair extensions" })
      .getByRole("tabpanel")
      .getByRole("list");
    const scroll = await row.evaluate((el) => ({ width: el.scrollWidth, visible: el.clientWidth }));
    expect(scroll.width).toBeGreaterThan(scroll.visible);
    await row.evaluate((el) => el.scrollBy({ left: el.clientWidth }));
    await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expectFitsScreen(page);
  });

  test("no 3D and no sticking cards on a phone; still fits after scrolling to the end", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    await page.waitForTimeout(3000);
    await expect(page.getByTestId("hero-accent")).toHaveAttribute("data-active", "false");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Why women choose HairCraft" })
        .locator("[data-why-card]")
        .first(),
    ).toHaveCSS("position", "static");
    // Scroll through every section (so each one reveals), then check the width again.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await expect(page.getByRole("region", { name: "Frequently asked questions" })).toBeVisible();
    await expectFitsScreen(page);
  });

  test("range explorer: a tap shows the category", async ({ page }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Explore our range" });
    await section.getByRole("button", { name: "Ponytails" }).tap();
    await expect(section.getByRole("link", { name: "Shop Ponytails" })).toBeVisible();
  });
});
