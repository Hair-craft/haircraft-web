import { expect, test } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";
import {
  freshMobile,
  lastSmsCode,
  PASSWORD,
  registerViaApi,
  verifyPhoneOnForm,
} from "./support/shop";

/**
 * Every account has an email and a verified mobile number; sign in with
 * either; a forgotten password is reset with a code (owner, 2026-11-04). The
 * test API has SMS codes on with the console driver: codes are read from its
 * dev endpoint, never shown on the shop.
 */

const freshEmail = (prefix = "phone") =>
  `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.com`;

const spaced = (local: string) => `${local.slice(0, 5)} ${local.slice(5)}`;

test.describe("create account", () => {
  test("Create account waits for the verified phone; then signs in with that phone", async ({
    page,
    request,
  }) => {
    const email = freshEmail();
    await page.goto(OPEN + "/register?next=/account");
    await page.getByLabel("First name").fill("Kavya");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    const create = page.getByRole("button", { name: "Create account" });
    await expect(create).toBeDisabled();
    await expect(page.getByText("Verify your mobile number to create your account.")).toBeVisible();

    const local = await verifyPhoneOnForm(page, request);
    // Verified: the number is locked, and can be changed.
    await expect(page.getByLabel("Mobile number")).toHaveAttribute("readonly", "");
    await expect(page.getByRole("button", { name: "Change number" })).toBeVisible();
    await expect(create).toBeEnabled();
    await create.click();
    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.locator("main")).toContainText(spaced(local));

    // Sign out, then back in with the phone number and the password.
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/");
    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email or phone number").fill(spaced(local));
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => url.pathname !== "/sign-in");
    await expect(page.getByRole("button", { name: "Account menu for Kavya" })).toBeVisible();
  });

  test("a bad number and a wrong code are explained", async ({ page }) => {
    await page.goto(OPEN + "/register");
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("button", { name: "Verify", exact: true }).click();
    await expect(page.getByText(/10-digit Indian mobile number/)).toBeVisible();

    await page.getByLabel("Mobile number").fill(freshMobile());
    await page.getByRole("button", { name: "Verify", exact: true }).click();
    await page.getByLabel("6-digit code").fill("000000");
    await page.getByRole("button", { name: "Confirm code" }).click();
    await expect(page.getByText(/code isn.t right/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
  });

  test("a number another account verified can't be used again", async ({ page, request }) => {
    const local = freshMobile();
    const taken = await registerViaApi(request, {
      data: { email: freshEmail(), password: PASSWORD, firstName: "Taken", phone: `+91${local}` },
    });
    expect(taken.status()).toBe(201);
    await page.goto(OPEN + "/register");
    await page.getByLabel("Mobile number").fill(local);
    await page.getByRole("button", { name: "Verify", exact: true }).click();
    await expect(page.getByText(/already used by another account/)).toBeVisible();
  });
});

test.describe("forgot password", () => {
  test("a code to the phone, a new password, and signed in", async ({ page, request }) => {
    // One code per number every 30 seconds, whatever it's for: the sign-up just sent one.
    test.setTimeout(90_000);
    const local = freshMobile();
    const email = freshEmail("reset");
    const registered = await registerViaApi(request, {
      data: { email, password: PASSWORD, firstName: "Ritu", phone: `+91${local}` },
    });
    expect(registered.status()).toBe(201);
    await page.waitForTimeout(31_000);

    await page.goto(OPEN + "/sign-in");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Forgot your password?");
    await page.getByLabel("Mobile number on your account").fill(local);
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await page.getByLabel("6-digit code").fill(await lastSmsCode(request, `+91${local}`));
    await page.getByRole("textbox", { name: "New password", exact: true }).fill("Monsoon2027");
    await page.getByRole("button", { name: "Reset password and sign in" }).click();
    await page.waitForURL((url) => url.pathname !== "/forgot-password");
    await expect(page.getByRole("button", { name: "Account menu for Ritu" })).toBeVisible();

    // The old password is gone; the new one works.
    const old = await request.post(`${API}/auth/login`, {
      data: { login: email, password: PASSWORD },
    });
    expect(old.status()).toBe(401);
    const fresh = await request.post(`${API}/auth/login`, {
      data: { login: email, password: "Monsoon2027" },
    });
    expect(fresh.status()).toBe(200);
  });

  test("a number without an account gets the same answer", async ({ page }) => {
    await page.goto(OPEN + "/forgot-password");
    await page.getByLabel("Mobile number on your account").fill(freshMobile());
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText(/has an account, we.ve texted it/)).toBeVisible();
  });
});

test("the add-your-phone step lets an account that has one go straight on", async ({
  page,
  request,
}) => {
  const email = freshEmail("step");
  const registered = await registerViaApi(request, {
    data: { email, password: PASSWORD, firstName: "Isha" },
  });
  expect(registered.status()).toBe(201);
  await page.goto(OPEN + "/sign-in");
  await page.getByLabel("Email or phone number").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/sign-in");
  await page.goto(OPEN + "/add-phone?next=/account/orders");
  await expect(page).toHaveURL(OPEN + "/account/orders");
});
