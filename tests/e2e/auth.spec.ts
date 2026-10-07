import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { API, OPEN, TEST_MAX_FAILED_LOGINS } from "../../playwright.config";

const PASSWORD = "Silky2026!";
/** The seeded admin (test database only): the backend's documented development password. */
const ADMIN = { email: "admin@example.com", password: "HcDev@2026!" };

let counter = 0;
/** A fresh address for each account (the test database's accounts are never real people). */
const freshEmail = () => `shopper.${Date.now()}.${++counter}@example.com`;

/** Creates an account straight through the API (quicker than the form when the form isn't being tested). */
async function apiAccount(request: APIRequestContext, firstName = "Priya") {
  const email = freshEmail();
  const response = await request.post(`${API}/auth/register`, {
    data: { email, password: PASSWORD, firstName },
  });
  expect(response.status(), "registering a test account").toBe(201);
  const body = await response.json();
  return { email, id: body.data.user.id as string };
}

/**
 * Signs in through the form and waits for the outcome: the next page when it
 * should work (the right password), the form's error message when it shouldn't.
 */
async function signIn(
  page: Page,
  email: string,
  password = PASSWORD,
  expect_: "works" | "refused" = password === PASSWORD ? "works" : "refused",
) {
  await page.goto(OPEN + "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (expect_ === "works") await page.waitForURL((url) => url.pathname !== "/sign-in");
  else await expect(page.locator("[data-form-error]")).toBeVisible();
}

const cookie = async (context: BrowserContext, name: string) =>
  (await context.cookies(OPEN)).find((c) => c.name === name);

test.describe("register", () => {
  test("creates the account, signs in and shows the account page", async ({ page, context }) => {
    const email = freshEmail();
    await page.goto(OPEN + "/register");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your account");
    await page.getByLabel("First name").fill("Priya");
    await page.getByLabel("Last name").fill("Sharma");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mobile number").fill("98765 43210");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    // The rules tick off while typing.
    await expect(page.getByText("✓ At least 8 characters")).toBeVisible();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Priya");
    await expect(page.locator("main")).toContainText(email);
    await expect(page.locator("main")).toContainText("98765 43210");
    await expect(page.getByRole("button", { name: "Account menu for Priya" })).toBeVisible();

    // The tokens are in httpOnly cookies: page scripts can't read them.
    for (const name of ["hc_at", "hc_rt", "hc_who"])
      expect((await cookie(context, name))?.httpOnly, `${name} is httpOnly`).toBe(true);
    expect(await page.evaluate(() => document.cookie)).not.toMatch(/hc_at|hc_rt|hc_who/);
  });

  test("explains every problem next to its field, and moves the focus there", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/register");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please check the details below.")).toBeVisible();
    await expect(page.getByText("Enter your first name.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByLabel("First name")).toBeFocused();

    await page.getByLabel("First name").fill("Asha");
    await page.getByLabel("Email").fill(freshEmail());
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/10-digit Indian mobile number/)).toBeVisible();
    await expect(page.getByText("Use at least one letter and one number.")).toBeVisible();
    // What was typed is kept (never the password field's rules state).
    await expect(page.getByLabel("First name")).toHaveValue("Asha");

    const { email } = await apiAccount(request);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mobile number").fill("");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("An account with this email already exists.").first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in instead" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});

test.describe("sign in", () => {
  test("wrong details, then the right ones, returning to where the shopper was going", async ({
    page,
    request,
  }) => {
    const { email } = await apiAccount(request, "Meera");
    await page.goto(OPEN + "/account/orders?page=2");
    await expect(page).toHaveURL(
      `${OPEN}/sign-in?next=${encodeURIComponent("/account/orders?page=2")}`,
    );

    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue(email);

    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(OPEN + "/account/orders?page=2");
  });

  test("Show reveals the password; links to register and forgot password", async ({ page }) => {
    await page.goto(OPEN + "/sign-in");
    const password = page.getByRole("textbox", { name: "Password", exact: true });
    await password.fill("secret1");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Forgot your password?");
    await expect(page.locator("main")).toContainText("contact us");
  });

  test("too many wrong passwords lock the account for a while", async ({ page, request }) => {
    const { email } = await apiAccount(request);
    for (let i = 0; i < TEST_MAX_FAILED_LOGINS; i++) await signIn(page, email, "Wrong-password-1");
    // Now even the right password is refused for a while.
    await signIn(page, email, PASSWORD, "refused");
    await expect(
      page.getByText(/^Too many attempts\. Please try again in \d+ minutes?\.$/),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
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
    await signIn(page, email, PASSWORD, "refused");
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
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
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
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Nisha");
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

test("without JavaScript, register and sign in still work", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const email = freshEmail();
  await page.goto(OPEN + "/register");
  await page.getByLabel("First name").fill("Lata");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(OPEN + "/account");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Lata");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(OPEN + "/");

  await signIn(page, email, "Wrong-password-1");
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await signIn(page, email);
  await expect(page).toHaveURL(OPEN + "/account");
  await context.close();
});
