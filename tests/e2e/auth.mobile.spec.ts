import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";

test.describe("sign-in pages on a phone", () => {
  test("register and sign in fit the screen and work by touch", async ({ page }) => {
    const email = `phone.${Date.now()}@example.com`;
    await page.goto(OPEN + "/register");
    const screen = page.viewportSize()!.width;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen,
    );
    await page.getByLabel("First name").fill("Divya");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Silky2026!");
    await page.getByRole("button", { name: "Create account" }).tap();
    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Divya");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen,
    );
  });
});
