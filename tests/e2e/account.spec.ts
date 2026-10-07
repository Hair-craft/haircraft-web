import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API, API_DOWN, OPEN } from "../../playwright.config";

const PASSWORD = "Silky2026!";

let counter = 0;
const freshEmail = () => `acct.${Date.now()}.${++counter}@example.com`;

/** A new customer, registered through the API; returns the email and an access token. */
async function newCustomer(request: APIRequestContext, firstName = "Meera") {
  const email = freshEmail();
  const response = await request.post(`${API}/auth/register`, {
    data: { email, password: PASSWORD, firstName },
  });
  expect(response.status(), "the customer is registered").toBe(201);
  return { email, token: (await response.json()).data.accessToken as string };
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto(OPEN + "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/sign-in");
}

const ADDRESS = {
  fullName: "Meera Iyer",
  phone: "+919812345678",
  line1: "Flat 12B, Sea View Apartments",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400050",
};

async function fillAddress(
  page: Page,
  values: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    pin: string;
  },
) {
  await page.getByLabel("Full name").fill(values.fullName);
  await page.getByLabel("Mobile number").fill(values.phone);
  await page.getByLabel("Flat, house, building, street").fill(values.line1);
  await page.getByLabel("Town or city").fill(values.city);
  await page.getByLabel("State").selectOption(values.state);
  await page.getByLabel("PIN code").fill(values.pin);
}

const main = (page: Page) => page.locator("main");
const cards = (page: Page) =>
  main(page).getByRole("list", { name: "Saved addresses" }).getByRole("listitem");

test.describe("the account area", () => {
  test("guests are sent to sign in and come back", async ({ page, request }) => {
    const { email } = await newCustomer(request);
    await page.goto(OPEN + "/account/addresses");
    await expect(page).toHaveURL(
      `${OPEN}/sign-in?next=${encodeURIComponent("/account/addresses")}`,
    );
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(OPEN + "/account/addresses");
  });

  test("the overview and menu", async ({ page, request }) => {
    const { email } = await newCustomer(request, "Asha");
    await signIn(page, email);
    await page.goto(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Asha");
    const menu = page.getByRole("navigation", { name: "My account" });
    await expect(menu.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(main(page).getByText("No saved addresses yet.")).toBeVisible();
    await expect(main(page).getByText("No orders yet.")).toBeVisible();
    await menu.getByRole("link", { name: "Addresses" }).click();
    await expect(page).toHaveURL(OPEN + "/account/addresses");
    await expect(menu.getByRole("link", { name: "Addresses" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("profile", () => {
  test("edit the name and mobile; the header greets the new name", async ({ page, request }) => {
    const { email } = await newCustomer(request);
    await signIn(page, email);
    await page.goto(OPEN + "/account/profile");
    await expect(main(page).getByText(email)).toBeVisible();
    await expect(main(page).getByText("To change your email, please")).toBeVisible();

    await page.getByLabel("First name").fill("Meenakshi");
    await page.getByLabel("Last name").fill("Rao");
    await page.getByLabel("Mobile number").fill("98765 43210");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Your details are saved.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Account menu for Meenakshi" })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Last name")).toHaveValue("Rao");
    await expect(page.getByLabel("Mobile number")).toHaveValue("98765 43210");

    // Clearing the optional fields.
    await page.getByLabel("Last name").fill("");
    await page.getByLabel("Mobile number").fill("");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Your details are saved.")).toBeVisible();
    await page.goto(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Meenakshi");
  });

  test("bad values are explained and nothing is saved", async ({ page, request }) => {
    const { email } = await newCustomer(request);
    await signIn(page, email);
    await page.goto(OPEN + "/account/profile");
    await page.getByLabel("First name").fill(" ");
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Please check the details below.")).toBeVisible();
    await expect(page.getByText("Enter your first name.")).toBeVisible();
    await expect(page.getByLabel("Mobile number")).toHaveAttribute("aria-invalid", "true");
    await page.reload();
    await expect(page.getByLabel("First name")).toHaveValue("Meera");
  });
});

test.describe("address book", () => {
  test("add, edit, make default and delete", async ({ page, request }) => {
    const { email } = await newCustomer(request);
    await signIn(page, email);
    await page.goto(OPEN + "/account/addresses");
    await expect(main(page).getByText("No saved addresses yet")).toBeVisible();

    // The first address becomes the default.
    await main(page).getByRole("link", { name: "Add address" }).click();
    await expect(page.getByText("Your first address becomes your default.")).toBeVisible();
    await fillAddress(page, {
      fullName: "Meera Iyer",
      phone: "98123 45678",
      line1: "Flat 12B, Sea View Apartments",
      city: "Mumbai",
      state: "Maharashtra",
      pin: "400 050",
    });
    await page.getByText("Home", { exact: true }).click();
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(page).toHaveURL(OPEN + "/account/addresses");
    await expect(page.getByText("Address added.")).toBeVisible();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Default");
    await expect(cards(page).first()).toContainText("Mumbai, Maharashtra 400050");
    await expect(cards(page).first()).toContainText("Mobile: 98123 45678");

    // A second one, made the default as it's added; with a typed label.
    await main(page).getByRole("link", { name: "Add address" }).click();
    await fillAddress(page, {
      fullName: "Meera Iyer",
      phone: "9876543210",
      line1: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pin: "560001",
    });
    await page.getByText("Other", { exact: true }).click();
    await page.getByLabel("Your label").fill("Studio");
    await page.getByLabel("Make this my default address").check();
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(cards(page)).toHaveCount(2);
    await expect(cards(page).first()).toContainText("Studio");
    await expect(cards(page).first()).toContainText("Default");

    // Edit: the form is filled in.
    await main(page).getByRole("link", { name: "Edit Home" }).click();
    await expect(page.getByLabel("Town or city")).toHaveValue("Mumbai");
    await expect(page.getByLabel("State")).toHaveValue("Maharashtra");
    await page.getByLabel("Landmark (optional)").fill("the sea face");
    await page.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByText("Address saved.")).toBeVisible();
    await expect(main(page).getByText("Near the sea face")).toBeVisible();

    // Make default.
    await main(page).getByRole("button", { name: "Make Home my default address" }).click();
    await expect(page.getByText("Default address changed.")).toBeVisible();
    await expect(cards(page).first()).toContainText("Home");
    await expect(cards(page).first()).toContainText("Default");

    // Delete asks first; Keep it keeps it.
    await main(page).getByRole("button", { name: "Delete Home" }).click();
    const confirm = page.getByRole("dialog", { name: "Delete this address?" });
    await expect(confirm).toContainText("Another saved address becomes your default.");
    await confirm.getByRole("button", { name: "Keep it" }).click();
    await expect(cards(page)).toHaveCount(2);
    await main(page).getByRole("button", { name: "Delete Home" }).click();
    await confirm.getByRole("button", { name: "Delete address" }).click();
    await expect(page.getByText("Address deleted.")).toBeVisible();
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Studio");
    await expect(cards(page).first()).toContainText("Default");
  });

  test("the form explains bad values; the API's checks agree", async ({ page, request }) => {
    const { email } = await newCustomer(request);
    await signIn(page, email);
    await page.goto(OPEN + "/account/addresses/new");
    await fillAddress(page, {
      fullName: "Meera Iyer",
      phone: "12345",
      line1: "",
      city: "Mumbai",
      state: "Maharashtra",
      pin: "0400",
    });
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(page.getByText("Please check the details below.")).toBeVisible();
    await expect(
      page.getByText("Enter a 10-digit Indian mobile number, e.g. 98765 43210."),
    ).toBeVisible();
    await expect(page.getByText("Enter a 6-digit PIN code, e.g. 400001.")).toBeVisible();
    await expect(page.getByText("Enter the flat, house or building and street.")).toBeVisible();
    // What was typed stays.
    await expect(page.getByLabel("Full name")).toHaveValue("Meera Iyer");
    await expect(page.getByLabel("State")).toHaveValue("Maharashtra");
  });

  test("at most 20 addresses; an unknown address is explained", async ({ page, request }) => {
    const { email, token } = await newCustomer(request);
    for (let i = 0; i < 20; i++) {
      const response = await request.post(`${API}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { ...ADDRESS, line1: `House ${i + 1}` },
      });
      expect(response.status()).toBe(201);
    }
    await signIn(page, email);
    await page.goto(OPEN + "/account/addresses");
    await expect(cards(page)).toHaveCount(20);
    await expect(
      main(page).getByText("You've saved 20 addresses, the most we keep."),
    ).toBeVisible();
    await expect(main(page).getByRole("link", { name: "Add address" })).toHaveCount(0);
    await page.goto(OPEN + "/account/addresses/new");
    await expect(page).toHaveURL(OPEN + "/account/addresses");

    await page.goto(OPEN + "/account/addresses/11111111-1111-4111-8111-111111111111");
    await expect(page).toHaveURL(OPEN + "/account/addresses?problem=gone");
    await expect(page.getByText("That address no longer exists.")).toBeVisible();
    await page.goto(OPEN + "/account/addresses?problem=Call%20us");
    await expect(page.getByText("Call us")).toHaveCount(0);
  });
});

test.describe("password and security", () => {
  test("change password: this browser stays signed in, others are signed out", async ({
    page,
    browser,
    request,
  }) => {
    const { email } = await newCustomer(request);
    const other = await browser.newContext();
    const elsewhere = await other.newPage();
    await signIn(elsewhere, email);
    await signIn(page, email);
    await page.goto(OPEN + "/account/security");

    const current = page.getByRole("textbox", { name: "Current password", exact: true });
    const fresh = page.getByRole("textbox", { name: "New password", exact: true });
    const confirm = page.getByRole("textbox", { name: "Confirm new password", exact: true });

    // A wrong current password.
    await current.fill("Wrong2026!");
    await fresh.fill("Wavy2027!");
    await confirm.fill("Wavy2027!");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(main(page).getByText("Your current password is incorrect.").first()).toBeVisible();

    // Not confirmed.
    await current.fill(PASSWORD);
    await fresh.fill("Wavy2027!");
    await confirm.fill("Wavy2028!");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("The passwords don't match.")).toBeVisible();

    await current.fill(PASSWORD);
    await fresh.fill("Wavy2027!");
    await confirm.fill("Wavy2027!");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(
      page.getByText("Password changed. You've been signed out on your other devices."),
    ).toBeVisible();

    // Still signed in here.
    await page.goto(OPEN + "/account");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, Meera");
    // Signed out there.
    await elsewhere.goto(OPEN + "/account");
    await expect(elsewhere).toHaveURL(/\/sign-in/);
    // The new password works; the old one doesn't.
    const old = await request.post(`${API}/auth/login`, { data: { email, password: PASSWORD } });
    expect(old.status()).toBe(401);
    await signIn(elsewhere, email, "Wavy2027!");
    await expect(elsewhere).toHaveURL(OPEN + "/account");
    await other.close();
  });

  test("sign out on all devices lives here", async ({ page, request }) => {
    const { email } = await newCustomer(request);
    await signIn(page, email);
    await page.goto(OPEN + "/account/security");
    await page.getByRole("button", { name: "Sign out on all devices" }).click();
    await expect(page.getByText("You're signed out on all your devices.")).toBeVisible();
    await page.goto(OPEN + "/account");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test("without JavaScript, the profile and address forms work", async ({ browser, request }) => {
  const { email } = await newCustomer(request);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(OPEN + "/account/profile");
  await page.getByLabel("First name").fill("Kavya");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Your details are saved.")).toBeVisible();

  await page.goto(OPEN + "/account/addresses/new");
  await fillAddress(page, {
    fullName: "Kavya M",
    phone: "9876543210",
    line1: "4 Lake View",
    city: "Kochi",
    state: "Kerala",
    pin: "682001",
  });
  // The typed label shows when Other is chosen, without a script.
  await expect(page.getByLabel("Your label")).toBeHidden();
  await page.getByText("Other", { exact: true }).click();
  await expect(page.getByLabel("Your label")).toBeVisible();
  await page.getByLabel("Your label").fill("Parents");
  await page.getByRole("button", { name: "Add address" }).click();
  await expect(page).toHaveURL(OPEN + "/account/addresses");
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText("Parents");
  await context.close();
});

test("with the API down the account pages are calm", async ({ page, context }) => {
  await context.addCookies([
    { name: "hc_at", value: "not-a-real-token", url: API_DOWN, httpOnly: true },
  ]);
  for (const path of ["/account", "/account/profile", "/account/addresses"]) {
    const response = await page.goto(API_DOWN + path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
  }
});
