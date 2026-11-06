import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";
import { lastEmailCode, verifyPhoneOnForm } from "./support/shop";

test.describe("sign-in pages on a phone", () => {
  test("a first sign-in by code fits the screen and works by touch", async ({ page, request }) => {
    const email = `phone.${Date.now()}@example.com`;
    await page.goto(OPEN + "/sign-in");
    const screen = page.viewportSize()!.width;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen,
    );
    await page.getByLabel("Email or mobile number").fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).tap();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await page.getByLabel("6-digit code").fill(await lastEmailCode(request, email));
    await page.getByRole("button", { name: "Continue", exact: true }).tap();
    await verifyPhoneOnForm(page, request);
    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to HairCraft");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen,
    );
  });
});
