import { test, type Page } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";
import { expectAccessible } from "./support/a11y";
import { CLIP_INS } from "./support/shop";

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
}

test.describe("accessibility on a phone", () => {
  test("main pages and the phone-only panels", async ({ page }) => {
    test.setTimeout(180_000);
    const category = (await (await fetch(`${API}/categories`)).json()).data[0].slug as string;
    for (const path of [
      "/",
      "/shop",
      `/shop/${category}`,
      `/product/${CLIP_INS}`,
      "/cart",
      "/faq",
      "/returns",
    ]) {
      await page.goto(OPEN + path);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await settle(page);
      await expectAccessible(page, `phone ${path}`);
    }

    await page.goto(OPEN + "/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await settle(page);
    await expectAccessible(page, "phone menu open");

    await page.goto(OPEN + "/shop");
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await settle(page);
    await expectAccessible(page, "phone filters open");
  });
});
