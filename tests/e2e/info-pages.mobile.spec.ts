import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";

test.describe("information pages on a phone", () => {
  for (const path of ["/shipping", "/returns", "/faq", "/contact", "/privacy", "/terms", "/about"])
    test(`${path} fits without sideways scrolling`, async ({ page }) => {
      await page.goto(OPEN + path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const widths = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        screen: window.innerWidth,
      }));
      expect(widths.page).toBeLessThanOrEqual(widths.screen);
      // The page links wrap above the title.
      const links = page.getByRole("navigation", { name: "Help and policies" }).getByRole("link");
      await expect(links).toHaveCount(7);
      for (const box of await Promise.all((await links.all()).map((l) => l.boundingBox())))
        expect(box!.x + box!.width).toBeLessThanOrEqual(widths.screen);
    });

  test("a FAQ answer opens with a tap", async ({ page }) => {
    await page.goto(OPEN + "/faq");
    const item = page.locator("details", { hasText: "Is it real human hair?" });
    await item.locator("summary").tap();
    await expect(item).toHaveAttribute("open", "");
  });
});
