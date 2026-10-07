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

test.describe("mobile layout", () => {
  test("the menu opens as a drawer with the categories and closes with Escape", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    // The desktop category bar is hidden on phones.
    await expect(page.getByRole("navigation", { name: "Categories" })).toBeHidden();

    const open = page.getByRole("button", { name: "Open menu" });
    await open.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Shop all" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Seamless Clip-ins" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Lace Front Wigs" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(open).toBeFocused();

    // The close button works too, and nothing scrolls sideways on a phone.
    await open.click();
    await drawer.getByRole("button", { name: "Close" }).click();
    await expect(drawer).toBeHidden();
    await expectFitsScreen(page);
  });

  test("choosing a category closes the drawer", async ({ page }) => {
    await page.goto(OPEN + "/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("link", { name: "Wigs", exact: true })
      .click();
    await expect(page).toHaveURL(OPEN + "/shop/wigs");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  });
});
