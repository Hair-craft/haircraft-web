import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";

/**
 * Phone-code sign-in and registration (owner, 2026-11-04). The test API uses
 * the console SMS driver: each "sent" code is read from its dev endpoint.
 * Every test uses its own number, so the per-number limits never meet.
 */

let counter = 0;
/** A fresh Indian mobile number for each test (10 digits, starting 9). */
const freshNumber = () =>
  `9${String(Date.now() % 1e8).padStart(8, "0")}${++counter % 10}`.slice(0, 10);

async function lastCode(request: APIRequestContext, local: string): Promise<string> {
  const response = await request.get(`${API}/dev/sms/last-code`, {
    params: { phone: `+91${local}` },
  });
  expect(response.status(), "the console driver kept the code").toBe(200);
  return (await response.json()).data.code;
}

async function askForCode(page: Page, local: string) {
  await page.getByLabel("Mobile number").fill(local);
  await page.getByRole("button", { name: /^(Send code|Continue)$/ }).click();
  await expect(page.getByLabel("6-digit code")).toBeVisible();
}

test.describe("phone number sign-in", () => {
  test("a new number registers with just a first name, then signs in again", async ({
    page,
    request,
  }) => {
    // It waits out the 30-second resend limit once.
    test.setTimeout(120_000);
    const local = freshNumber();
    await page.goto(OPEN + "/register?next=/account/orders");
    await expect(
      page.getByRole("link", { name: "Register with email and password" }),
    ).toBeVisible();
    await askForCode(page, local);
    await expect(page.getByText(`We sent a code to +91`)).toBeVisible();

    // A wrong code first: the tries left are shown, and the form stays.
    const code = await lastCode(request, local);
    await page.getByLabel("6-digit code").fill(code === "000000" ? "111111" : "000000");
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page.getByText("That code isn't right. 4 tries left.")).toBeVisible();

    await page.getByLabel("6-digit code").fill(code);
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page.getByText("Number verified.")).toBeVisible();
    await page.getByLabel("First name").fill("Kavya");
    await page.getByRole("button", { name: /Create my account/ }).click();
    await expect(page).toHaveURL(OPEN + "/account/orders");

    // The profile shows the number as verified, and no password to change.
    await page.goto(OPEN + "/account/profile");
    await expect(page.getByText("Verified", { exact: true })).toBeVisible();
    await expect(page.getByText("No email added")).toBeVisible();
    await page.goto(OPEN + "/account/security");
    await expect(page.getByText(/doesn.t use a password/)).toBeVisible();

    // Signed out, the same number signs straight in (after the 30-second resend wait).
    await page.context().clearCookies();
    await page.waitForTimeout(31_000);
    await page.goto(OPEN + "/sign-in?next=/account");
    await askForCode(page, local);
    await page.getByLabel("6-digit code").fill(await lastCode(request, local));
    await page.getByRole("button", { name: "Verify and continue" }).click();
    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back, Kavya");
  });

  test("a bad number is caught before anything is sent", async ({ page }) => {
    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText("Enter a 10-digit Indian mobile number")).toBeVisible();
    await expect(page.getByLabel("Mobile number")).toHaveAttribute("aria-invalid", "true");
  });

  test("asking again too soon says how long to wait", async ({ page }) => {
    const local = freshNumber();
    await page.goto(OPEN + "/sign-in");
    await askForCode(page, local);
    await page.getByRole("button", { name: "Change number" }).click();
    await page.getByRole("button", { name: "Send code" }).click();
    await expect(
      page.getByText(/Too many codes requested\. Please try again in \d+ seconds?\./),
    ).toBeVisible();
  });

  test("email and password is one tap away, and back", async ({ page }) => {
    await page.goto(OPEN + "/sign-in");
    await page.getByRole("link", { name: "Use email and password" }).click();
    await expect(page).toHaveURL(OPEN + "/sign-in?method=email");
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Use your phone number instead" }).click();
    await expect(page.getByLabel("Mobile number")).toBeVisible();
  });
});
