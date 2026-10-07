import { expect, test } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";

test.describe("account on a phone", () => {
  test("the menu is a row of tabs, and the pages fit the screen", async ({ page, request }) => {
    const email = `acct.phone.${Date.now()}@example.com`;
    await request.post(`${API}/auth/register`, {
      data: { email, password: "Silky2026!", firstName: "Divya" },
    });
    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Silky2026!");
    await page.getByRole("button", { name: "Sign in" }).tap();
    await page.waitForURL((url) => url.pathname !== "/sign-in");

    const screen = page.viewportSize()!;
    for (const path of [
      "/account",
      "/account/profile",
      "/account/addresses/new",
      "/account/security",
    ]) {
      await page.goto(OPEN + path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} fits the screen`,
      ).toBeLessThanOrEqual(screen.width);
    }

    const menu = page.getByRole("navigation", { name: "My account" });
    await menu.getByRole("link", { name: "Profile" }).tap();
    await expect(page).toHaveURL(OPEN + "/account/profile");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Profile");
  });
});
