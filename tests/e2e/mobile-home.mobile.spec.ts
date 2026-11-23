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
  test("product rings turn with the dots and a swipe; the page itself never scrolls sideways", async ({
    page,
  }) => {
    // Best sellers, Best rated and New arrivals stand round a 3D ring (owner, 2026-11-23).
    await page.goto(OPEN + "/");
    const ring = page
      .getByRole("region", { name: "Customer favourites" })
      .getByRole("tabpanel")
      .locator("[aria-roledescription=carousel]");
    await ring.scrollIntoViewIfNeeded();
    await expect(ring).toHaveAttribute("data-front", "0");
    await ring.getByRole("button", { name: /^Show product 2 of/ }).click();
    await expect(ring).toHaveAttribute("data-front", "1");
    // A sideways swipe turns it on (and opens no product).
    const box = await ring.locator(".hc-ring-stage").boundingBox();
    if (!box) throw new Error("no ring");
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.7, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, y + 4, { steps: 12 });
    await page.mouse.up();
    await expect(ring).not.toHaveAttribute("data-front", "1");
    await expect(page).toHaveURL(OPEN + "/");
    await expectFitsScreen(page);
  });

  test("shop by concern and every section fit a phone, after scrolling to the end", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    await expect(page.locator("canvas")).toHaveCount(0);
    // Shop by concern: the spotlight slider fits the phone (owner, 2026-11-23).
    const spotlight = page
      .getByRole("region", { name: "What would you like to change?" })
      .locator(".hc-spot");
    await expect(spotlight).toBeVisible();
    await expect(spotlight.getByRole("link", { name: /^See More/ })).toBeVisible();
    const box = await spotlight.boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= (page.viewportSize()?.width ?? 0)).toBe(true);
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
