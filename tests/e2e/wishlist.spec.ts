import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { PublicProduct } from "@/lib/api/types";
import { API, API_DOWN, OPEN } from "../../playwright.config";

const PASSWORD = "Silky2026!";
const ADMIN = { email: "admin@example.com", password: "HcDev@2026!" };
/** One option in stock (the other is sold out): Move to bag puts it straight in. */
const ONE_OPTION = { slug: "deep-wave-tape-ins", name: "Deep Wave Tape-ins" };
/** Several options in stock: Move to bag opens the product page to choose. */
const MANY_OPTIONS = { slug: "classic-straight-clip-in-set", name: "Classic Straight Clip-in Set" };
const PONYTAIL = { slug: "wrap-around-ponytail", name: "Wrap-around Ponytail" };

let counter = 0;
const freshEmail = () => `wish.${Date.now()}.${++counter}@example.com`;

async function newCustomer(request: APIRequestContext): Promise<string> {
  const email = freshEmail();
  const response = await request.post(`${API}/auth/register`, {
    data: { email, password: PASSWORD, firstName: "Meera" },
  });
  expect(response.status(), "the customer is registered").toBe(201);
  return email;
}

async function signIn(page: Page, email: string, next?: string) {
  await page.goto(OPEN + "/sign-in" + (next ? `?next=${encodeURIComponent(next)}` : ""));
  await signInHere(page, email);
}

async function signInHere(page: Page, email: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/sign-in");
}

async function product(request: APIRequestContext, slug: string): Promise<PublicProduct> {
  return (await (await request.get(`${API}/products/${slug}`)).json()).data;
}

async function setProductStatus(request: APIRequestContext, productId: string, status: string) {
  const login = await request.post(`${API}/admin/auth/login`, { data: ADMIN });
  const token = (await login.json()).data.accessToken;
  const response = await request.patch(`${API}/admin/products/${productId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status },
  });
  expect(response.ok(), `product set to ${status}`).toBe(true);
}

const heart = (page: Page, name: string, scope = page.locator("main")) =>
  scope.getByRole("button", {
    name: new RegExp(`^(Save|Remove) ${name} (to|from) your wishlist$`),
  });
const wishlistLink = (page: Page) =>
  page.getByRole("navigation", { name: "Account and cart" }).getByRole("link", {
    name: /^Wishlist/,
  });

async function saveOnProductPage(page: Page, item: { slug: string; name: string }) {
  await page.goto(`${OPEN}/product/${item.slug}`);
  const button = heart(page, item.name);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(`Saved ${item.name} to your wishlist.`)).toBeVisible();
}

test.describe("wishlist (guest)", () => {
  test("the heart asks a guest to sign in, and saves the product afterwards", async ({
    page,
    request,
  }) => {
    const email = await newCustomer(request);
    await page.goto(`${OPEN}/product/${ONE_OPTION.slug}`);
    await heart(page, ONE_OPTION.name).click();
    const panel = page.getByRole("dialog", { name: "Save your favourites" });
    await expect(panel).toBeVisible();
    await panel.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(
      `${OPEN}/sign-in?next=${encodeURIComponent(`/product/${ONE_OPTION.slug}`)}`,
    );
    await signInHere(page, email);

    await expect(page).toHaveURL(`${OPEN}/product/${ONE_OPTION.slug}`);
    await expect(heart(page, ONE_OPTION.name)).toHaveAttribute("aria-pressed", "true");
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist, 1 item");
  });

  test("the wishlist page needs signing in", async ({ page }) => {
    await page.goto(OPEN + "/wishlist");
    await expect(page).toHaveURL(`${OPEN}/sign-in?next=${encodeURIComponent("/wishlist")}`);
  });

  test("every card has its own heart, outside the card's link", async ({ page }) => {
    await page.goto(OPEN + "/shop");
    const card = page.locator("main").getByRole("link", { name: new RegExp(PONYTAIL.name) });
    await expect(card).toHaveCount(1);
    await expect(card.getByRole("button")).toHaveCount(0);
    await expect(heart(page, PONYTAIL.name)).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("wishlist (signed in)", () => {
  test("save and remove with the heart; the page and header count follow", async ({
    page,
    request,
  }) => {
    await signIn(page, await newCustomer(request));
    await saveOnProductPage(page, ONE_OPTION);
    await saveOnProductPage(page, PONYTAIL);
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist, 2 items");

    // Filled on the listing too.
    await page.goto(OPEN + "/shop");
    await expect(heart(page, PONYTAIL.name)).toHaveAttribute("aria-pressed", "true");
    await heart(page, PONYTAIL.name).click();
    await expect(heart(page, PONYTAIL.name)).toHaveAttribute("aria-pressed", "false");
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist, 1 item");

    await wishlistLink(page).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My wishlist (1)");
    const main = page.locator("main");
    await expect(main.getByRole("listitem")).toHaveCount(1);
    await main
      .getByRole("button", { name: `Remove ${ONE_OPTION.name} from your wishlist` })
      .click();
    await expect(main.getByText("Nothing saved yet")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("My wishlist");
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist");
  });

  test("Move to bag: one option goes straight in and leaves the wishlist", async ({
    page,
    request,
  }) => {
    await signIn(page, await newCustomer(request));
    await saveOnProductPage(page, ONE_OPTION);
    await page.goto(OPEN + "/wishlist");
    await page.locator("main").getByRole("button", { name: "Move to bag" }).click();
    const drawer = page.getByRole("dialog", { name: /^Your bag/ });
    await expect(drawer).toHaveAccessibleName("Your bag (1)");
    await expect(drawer.getByRole("listitem")).toContainText(ONE_OPTION.name);
    await page.keyboard.press("Escape");
    await expect(page.locator("main").getByText("Nothing saved yet")).toBeVisible();
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist");
  });

  test("Move to bag: with several options the shopper chooses, then it leaves the wishlist", async ({
    page,
    request,
  }) => {
    await signIn(page, await newCustomer(request));
    await saveOnProductPage(page, MANY_OPTIONS);
    await page.goto(OPEN + "/wishlist");
    await page.locator("main").getByRole("button", { name: "Move to bag" }).click();
    await expect(page).toHaveURL(`${OPEN}/product/${MANY_OPTIONS.slug}`);
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByRole("dialog", { name: /^Your bag/ })).toHaveAccessibleName(
      "Your bag (1)",
    );
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist");
    await page.keyboard.press("Escape");
    await expect(heart(page, MANY_OPTIONS.name)).toHaveAttribute("aria-pressed", "false");
  });

  test("a product that's no longer sold stays, faded, and can be removed", async ({
    page,
    request,
  }) => {
    const ponytail = await product(request, PONYTAIL.slug);
    await signIn(page, await newCustomer(request));
    await saveOnProductPage(page, PONYTAIL);
    try {
      await setProductStatus(request, ponytail.id, "INACTIVE");
      await page.goto(OPEN + "/wishlist");
      const main = page.locator("main");
      await expect(main.getByText("No longer available")).toBeVisible();
      await expect(main.getByRole("button", { name: "Move to bag" })).toHaveCount(0);
      await main
        .getByRole("button", { name: `Remove ${PONYTAIL.name} from your wishlist` })
        .click();
      await expect(main.getByText("Nothing saved yet")).toBeVisible();
    } finally {
      await setProductStatus(request, ponytail.id, "ACTIVE");
    }
  });

  test("signing out clears the count; the account menu links to the wishlist", async ({
    page,
    request,
  }) => {
    await signIn(page, await newCustomer(request));
    await saveOnProductPage(page, ONE_OPTION);
    await page.getByRole("button", { name: /^Account menu for / }).click();
    await page.getByRole("menuitem", { name: "My wishlist" }).click();
    await expect(page).toHaveURL(OPEN + "/wishlist");
    await page.goto(OPEN + "/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(wishlistLink(page)).toHaveAccessibleName("Wishlist");
  });
});

test("keyboard: the heart is the next stop after its card, and Space presses it", async ({
  page,
  request,
}) => {
  await signIn(page, await newCustomer(request));
  await page.goto(OPEN + "/shop");
  const card = page.locator("main").getByRole("link", { name: new RegExp(PONYTAIL.name) });
  await card.focus();
  await page.keyboard.press("Tab");
  await expect(heart(page, PONYTAIL.name)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(heart(page, PONYTAIL.name)).toHaveAttribute("aria-pressed", "true");
  await expect(heart(page, PONYTAIL.name)).toBeFocused();
});

test("with the API down the wishlist page is calm", async ({ page, context }) => {
  // As if signed in (the token is never checked: the API can't be reached).
  await context.addCookies([
    { name: "hc_at", value: "not-a-real-token", url: API_DOWN, httpOnly: true },
  ]);
  const response = await page.goto(API_DOWN + "/wishlist");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
});

test.describe("wishlist without JavaScript", () => {
  test("the heart is a plain form: guests go to sign in; customers come back saved", async ({
    browser,
    request,
  }) => {
    const email = await newCustomer(request);
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${OPEN}/product/${ONE_OPTION.slug}`);
    await heart(page, ONE_OPTION.name).click();
    await expect(page).toHaveURL(
      `${OPEN}/sign-in?next=${encodeURIComponent(`/product/${ONE_OPTION.slug}`)}`,
    );
    await signInHere(page, email);
    // Saved on the way in.
    await page.goto(OPEN + "/wishlist");
    await expect(page.locator("main").getByRole("listitem")).toHaveCount(1);

    await page.goto(`${OPEN}/product/${PONYTAIL.slug}`);
    await heart(page, PONYTAIL.name).click();
    await expect(page).toHaveURL(`${OPEN}/product/${PONYTAIL.slug}`);
    await page.goto(OPEN + "/wishlist");
    await expect(page.locator("main").getByRole("listitem")).toHaveCount(2);
    await context.close();
  });
});
