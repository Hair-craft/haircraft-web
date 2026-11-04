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
      .getByRole("region", { name: "Customer favourites" })
      .getByRole("tabpanel")
      .getByRole("list");
    const scroll = await row.evaluate((el) => ({ width: el.scrollWidth, visible: el.clientWidth }));
    expect(scroll.width).toBeGreaterThan(scroll.visible);
    await row.evaluate((el) => el.scrollBy({ left: el.clientWidth }));
    await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expectFitsScreen(page);
  });

  test("shop by concern and every section fit a phone, after scrolling to the end", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    await expect(page.locator("canvas")).toHaveCount(0);
    // Concern cards two across on a phone.
    const concerns = page
      .getByRole("region", { name: "What would you like to change?" })
      .getByRole("listitem");
    await expect(concerns.first()).toBeVisible();
    // Side by side in one row. On a phone the row swaps to its pinned, scroll-driven form
    // once the page has loaded (owner, 2026-11-04), so wait for it to settle.
    await expect
      .poll(async () => {
        const [first, second] = await Promise.all([
          concerns.nth(0).boundingBox(),
          concerns.nth(1).boundingBox(),
        ]);
        return first && second ? Math.round(first.y) === Math.round(second.y) : null;
      })
      .toBe(true);
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
});
