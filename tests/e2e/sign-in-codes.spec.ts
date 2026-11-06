import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";
import {
  freshEmail,
  freshMobile,
  lastEmailCode,
  PASSWORD,
  registerViaApi,
  verifyPhoneOnForm,
} from "./support/shop";

/**
 * Sign in like Gemeria's (owner, 2026-11-06): Continue with Google, or one
 * box for an email or a mobile number and a code sent there; a new address
 * finishes the account on the spot. The test API sends no email or SMS: its
 * console drivers keep the codes for these tests.
 */
test.describe("sign in with a code", () => {
  test("the page offers the one box and codes only, no password", async ({ page }) => {
    await page.goto(OPEN + "/sign-in");
    await expect(page.getByLabel("Email or mobile number")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toHaveCount(0);
    await expect(page.getByText("Use a password instead")).toHaveCount(0);
  });

  test("an existing customer signs in with the code emailed to them", async ({ page, request }) => {
    const email = freshEmail("code");
    const registered = await registerViaApi(request, {
      data: { email, password: PASSWORD, firstName: "Lata" },
    });
    expect(registered.status()).toBe(201);

    await page.goto(OPEN + "/sign-in?next=/account/orders");
    await page.getByLabel("Email or mobile number").fill(email.toUpperCase());
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText(/emailed a 6-digit code to/)).toBeVisible();
    await page.getByLabel("6-digit code").fill("000000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText(/code isn.t right/).first()).toBeVisible();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await page.getByLabel("6-digit code").fill(await lastEmailCode(request, email));
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/account/orders");
    await expect(page.getByRole("button", { name: "Account menu for Lata" })).toBeVisible();
  });

  test("a new email logs straight in, then adds the mobile number every account needs", async ({
    page,
    request,
  }) => {
    const email = freshEmail("new");
    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email or mobile number").fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await page.getByLabel("6-digit code").fill(await lastEmailCode(request, email));
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    // No details form: signed in, then the phone step (SMS codes are on in the test API).
    await verifyPhoneOnForm(page, request, freshMobile());
    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to HairCraft");
    await expect(page.getByRole("link", { name: /create an account/i })).toHaveCount(0);
  });

  test("a bad entry is explained", async ({ page }) => {
    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email or mobile number").fill("12345");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText(/email address or a 10-digit Indian mobile number/)).toBeVisible();
  });
});
