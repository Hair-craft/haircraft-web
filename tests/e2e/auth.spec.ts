import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { API, OPEN } from "../../playwright.config";
import { enterWithCode, lastEmailCode, registerViaApi, verifyPhoneOnForm } from "./support/shop";

const PASSWORD = "Silky2026!";
/** The seeded admin (test database only): the backend's documented development password. */
const ADMIN = { email: "admin@example.com", password: "HcDev@2026!" };

let counter = 0;
/** A fresh address for each account (the test database's accounts are never real people). */
const freshEmail = () => `shopper.${Date.now()}.${++counter}@example.com`;

/** Creates an account straight through the API (quicker than the form when the form isn't being tested). */
async function apiAccount(request: APIRequestContext, firstName = "Priya") {
  const email = freshEmail();
  const response = await registerViaApi(request, {
    data: { email, password: PASSWORD, firstName },
  });
  expect(response.status(), "registering a test account").toBe(201);
  const body = await response.json();
  return { email, id: body.data.user.id as string };
}

/**
 * Signs in with a code (owner, 2026-11-06: no password on the sign-in page)
 * and waits for the outcome: the next page when it should work, or staying on
 * the sign-in page when it is refused.
 */
async function signIn(page: Page, email: string, expect_: "works" | "refused" = "works") {
  await page.goto(OPEN + "/sign-in");
  await enterWithCode(page, email);
  if (expect_ === "works") await page.waitForURL((url) => url.pathname !== "/sign-in");
  else await expect(page).toHaveURL(/\/sign-in/);
}

const cookie = async (context: BrowserContext, name: string) =>
  (await context.cookies(OPEN)).find((c) => c.name === name);

test.describe("first sign-in (no separate create account)", () => {
  test("a new email signs straight in with a code, adds the mobile number, and lands on the account", async ({
    page,
    context,
    request,
  }) => {
    const email = freshEmail();
    // Old links to the create-account page land on sign-in.
    await page.goto(OPEN + "/register?next=/account");
    await expect(page).toHaveURL(`${OPEN}/sign-in?next=${encodeURIComponent("/account")}`);
    await page.getByLabel("Email or mobile number").fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await page.getByLabel("6-digit code").fill(await lastEmailCode(request, email));
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const local = await verifyPhoneOnForm(page, request);

    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome to HairCraft");
    await expect(page.locator("main")).toContainText(email);
    await expect(page.locator("main")).toContainText(`${local.slice(0, 5)} ${local.slice(5)}`);

    // The tokens are in httpOnly cookies: page scripts can't read them.
    for (const name of ["hc_at", "hc_rt", "hc_who"])
      expect((await cookie(context, name))?.httpOnly, `${name} is httpOnly`).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toMatch(/hc_at|hc_rt|hc_who/);
  });
});

test.describe("sign in", () => {
  test("a wrong code, then the right one, returning to where the shopper was going", async ({
    page,
    request,
  }) => {
    const { email } = await apiAccount(request, "Meera");
    await page.goto(OPEN + "/account/orders?page=2");
    await expect(page).toHaveURL(
      `${OPEN}/sign-in?next=${encodeURIComponent("/account/orders?page=2")}`,
    );
    await page.getByLabel("Email or mobile number").fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByLabel("6-digit code").fill("000000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByText(/code isn.t right/).first()).toBeVisible();
    await expect(page.getByLabel("6-digit code")).toBeVisible();
    await page.getByLabel("6-digit code").fill(await lastEmailCode(request, email));
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/account/orders?page=2");
  });

  test("the sign-in page has no password box (codes only)", async ({ page }) => {
    await page.goto(OPEN + "/sign-in");
    await expect(page.getByLabel("Email or mobile number")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /password/i })).toHaveCount(0);
  });

  test("a suspended account is told so; its session ends at once", async ({ page, request }) => {
    const { email, id } = await apiAccount(request, "Kiran");
    await signIn(page, email);
    await expect(page).toHaveURL(OPEN + "/account");

    const admin = await request.post(`${API}/admin/auth/login`, { data: ADMIN });
    expect(admin.status(), "the seeded admin can sign in").toBe(200);
    const token = (await admin.json()).data.accessToken;
    const suspended = await request.post(`${API}/admin/customers/${id}/suspend`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { reason: "End-to-end test of the suspended message" },
    });
    expect(suspended.status()).toBe(200);

    await page.reload();
    await expect(page).toHaveURL(/\/sign-in\?.*notice=ended/);
    await expect(page.getByText("Your session has ended. Please sign in again.")).toBeVisible();
    await signIn(page, email, "refused");
    await expect(
      page.getByText("This account has been suspended. Please contact us."),
    ).toBeVisible();
  });

  test("signed-in shoppers skip the sign-in pages", async ({ page, request }) => {
    const { email } = await apiAccount(request);
    await signIn(page, email);
    await page.goto(OPEN + "/sign-in");
    await expect(page).toHaveURL(OPEN + "/account");
    await page.goto(OPEN + "/register?next=/shop");
    await expect(page).toHaveURL(OPEN + "/shop");
  });

  test("next can't send the shopper to another site", async ({ page, request }) => {
    const { email } = await apiAccount(request);
    await page.goto(`${OPEN}/sign-in?next=${encodeURIComponent("//evil.example/steal")}`);
    await enterWithCode(page, email);
    await expect(page).toHaveURL(OPEN + "/account");
  });
});

test.describe("the session", () => {
  test("an expired access token is renewed quietly, once, even with requests arriving together", async ({
    page,
    context,
    request,
  }) => {
    const { email } = await apiAccount(request, "Nisha");
    await signIn(page, email);
    await expect(page).toHaveURL(OPEN + "/account");
    const firstRefresh = (await cookie(context, "hc_rt"))!.value;

    // The access cookie runs out (as it does after 15 minutes).
    await context.clearCookies({ name: "hc_at" });
    // Several requests at once: they share one renewal on the server.
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => context.request.get(OPEN + "/account", { maxRedirects: 0 })),
    );
    for (const response of responses) expect(response.status()).toBe(200);
    await page.goto(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome back, Nisha");
    const renewed = (await cookie(context, "hc_rt"))!.value;
    expect(renewed).not.toBe(firstRefresh);

    // The old refresh token no longer works (it was exchanged).
    const reuse = await request.post(`${API}/auth/refresh`, {
      data: { refreshToken: firstRefresh },
    });
    expect(reuse.ok()).toBe(false);
  });

  test("a refresh token the shop no longer accepts leaves the shopper a guest", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: "hc_rt", value: "not-a-real-refresh-token-0123456789", url: OPEN, httpOnly: true },
    ]);
    await page.goto(OPEN + "/account");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount/);
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });
});

test.describe("sign out", () => {
  test("from the header menu: the session ends on the API and a note says so", async ({
    page,
    context,
    request,
  }) => {
    const { email } = await apiAccount(request, "Anu");
    await signIn(page, email);
    const refreshToken = (await cookie(context, "hc_rt"))!.value;

    // Keyboard: open the menu, the first item gets the focus, Escape closes it.
    const menuButton = page.getByRole("button", { name: "Account menu for Anu" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "My account" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    await menuButton.click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(OPEN + "/");
    await expect(page.getByText("You're signed out.")).toBeVisible();
    expect(await cookie(context, "hc_rt")).toBeUndefined();
    const reuse = await request.post(`${API}/auth/refresh`, { data: { refreshToken } });
    expect(reuse.ok()).toBe(false);
    await page.goto(OPEN + "/account");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("on all devices: another browser's session ends at once", async ({ browser, request }) => {
    const { email } = await apiAccount(request, "Ritu");
    const phone = await browser.newContext();
    const laptop = await browser.newContext();
    const onPhone = await phone.newPage();
    const onLaptop = await laptop.newPage();
    await signIn(onPhone, email);
    await signIn(onLaptop, email);
    await expect(onLaptop).toHaveURL(OPEN + "/account");

    await onPhone.goto(OPEN + "/account/security");
    await onPhone.getByRole("button", { name: "Sign out on all devices" }).click();
    await expect(onPhone.getByText("You're signed out on all your devices.")).toBeVisible();

    await onLaptop.reload();
    await expect(onLaptop).toHaveURL(/\/sign-in\?.*notice=ended/);
    await expect(onLaptop.getByText("Your session has ended. Please sign in again.")).toBeVisible();
    await phone.close();
    await laptop.close();
  });
});
