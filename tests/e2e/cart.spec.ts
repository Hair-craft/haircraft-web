import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import type { PublicProduct, PublicVariant } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { defaultVariant } from "@/lib/product/variants";
import { API, API_DOWN, OPEN } from "../../playwright.config";

const PASSWORD = "Silky2026!";
const ADMIN = { email: "admin@example.com", password: "HcDev@2026!" };
/** A product with several options in stock in the sample catalogue. */
const SLUG = "classic-straight-clip-in-set";

let counter = 0;
const freshEmail = () => `bag.${Date.now()}.${++counter}@example.com`;

async function product(request: APIRequestContext, slug = SLUG): Promise<PublicProduct> {
  return (await (await request.get(`${API}/products/${slug}`)).json()).data;
}

async function adminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API}/admin/auth/login`, { data: ADMIN });
  expect(response.status(), "the seeded admin can sign in").toBe(200);
  return (await response.json()).data.accessToken;
}

/** Sets a variant's stock to exactly `quantity` (a stock-take), as staff would. */
async function setStock(request: APIRequestContext, variantId: string, quantity: number) {
  const token = await adminToken(request);
  const response = await request.post(`${API}/admin/inventory/${variantId}/adjustments`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { type: "ADJUSTMENT", quantity, reason: "Storefront end-to-end test" },
  });
  expect(response.ok(), `stock of ${variantId} set to ${quantity}`).toBe(true);
}

async function setProductStatus(request: APIRequestContext, productId: string, status: string) {
  const token = await adminToken(request);
  const response = await request.patch(`${API}/admin/products/${productId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status },
  });
  expect(response.ok(), `product set to ${status}`).toBe(true);
}

const drawer = (page: Page) => page.getByRole("dialog", { name: /^Your bag/ });
const bagButton = (page: Page) =>
  page.getByRole("navigation", { name: "Account and cart" }).getByRole("link", { name: /^Bag, / });

async function addFromProductPage(page: Page, quantity = 1, slug = SLUG) {
  await page.goto(`${OPEN}/product/${slug}`);
  for (let i = 1; i < quantity; i++) await page.getByRole("button", { name: "One more" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
}

const cookie = async (context: BrowserContext, name: string) =>
  (await context.cookies(OPEN)).find((c) => c.name === name);

test.describe("bag (guest)", () => {
  test("add to bag opens the drawer; quantities and remove update the totals and count", async ({
    page,
    request,
  }) => {
    const variant = defaultVariant((await product(request)).variants)!;
    await addFromProductPage(page, 2);
    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page)).toHaveAccessibleName("Your bag (2)");
    const line = drawer(page).getByRole("listitem");
    await expect(line).toHaveCount(1);
    await expect(line).toContainText(formatPrice((Number(variant.effectivePrice) * 2).toFixed(2)));
    await expect(bagButton(page)).toHaveAccessibleName("Bag, 2 items");

    await drawer(page)
      .getByRole("button", { name: /^One more / })
      .click();
    await expect(drawer(page)).toHaveAccessibleName("Your bag (3)");
    await drawer(page)
      .getByRole("button", { name: /^One fewer / })
      .click();
    await expect(drawer(page)).toHaveAccessibleName("Your bag (2)");
    await expect(drawer(page).getByText("Subtotal")).toBeVisible();
    // Checkout (S10) is a link to the checkout page.
    await expect(drawer(page).getByRole("link", { name: "Checkout" })).toHaveAttribute(
      "href",
      "/checkout",
    );

    await drawer(page)
      .getByRole("button", { name: /from your bag$/ })
      .click();
    await expect(drawer(page).getByText("Your bag is empty")).toBeVisible();
    await expect(bagButton(page)).toHaveAccessibleName("Bag, 0 items");
  });

  test("at most 10 of one item", async ({ page, request }) => {
    await setStock(request, defaultVariant((await product(request)).variants)!.id, 50);
    await page.goto(`${OPEN}/product/${SLUG}`);
    const more = page.getByRole("button", { name: "One more" });
    for (let i = 0; i < 12; i++) if (await more.isEnabled()) await more.click();
    await expect(page.getByRole("textbox", { name: "Quantity" })).toHaveValue("10");
    await expect(more).toBeDisabled();
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(drawer(page)).toHaveAccessibleName("Your bag (10)");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Add to bag" }).click();
    await expect(page.getByText("You can have at most 10 of one item in your bag.")).toBeVisible();
  });

  test("never more than is in stock; a line that runs short is flagged until fixed", async ({
    page,
    request,
  }) => {
    const variant = defaultVariant((await product(request)).variants)!;
    try {
      await setStock(request, variant.id, 2);
      await addFromProductPage(page, 3);
      await expect(
        page.getByText("Only a limited quantity of this item is available."),
      ).toBeVisible();
      await expect(bagButton(page)).toHaveAccessibleName("Bag, 0 items");

      await page.getByRole("button", { name: "One fewer" }).click();
      await page.getByRole("button", { name: "Add to bag" }).click();
      await expect(drawer(page)).toHaveAccessibleName("Your bag (2)");

      await setStock(request, variant.id, 1);
      await page.goto(OPEN + "/cart");
      await expect(
        page.locator("main").getByText("1 item needs your attention before checkout."),
      ).toBeVisible();
      await expect(
        page.locator("main").getByText("Only a limited quantity of this item is available."),
      ).toBeVisible();
      await page
        .locator("main")
        .getByRole("button", { name: /^One fewer / })
        .click();
      await expect(
        page.locator("main").getByText("1 item needs your attention before checkout."),
      ).toHaveCount(0);
    } finally {
      await setStock(request, variant.id, 50);
    }
  });

  test("sold-out options can't be added", async ({ page, request }) => {
    let soldOut: { slug: string; sku: string } | null = null;
    for (const slug of ["deep-wave-tape-ins", "brazilian-body-wave-seamless-clip-in", SLUG]) {
      const p = await product(request, slug);
      const v = p.variants.find((x: PublicVariant) => !x.inStock);
      if (v) {
        soldOut = { slug, sku: v.sku };
        break;
      }
    }
    expect(soldOut, "the sample catalogue has a sold-out option").not.toBeNull();
    await page.goto(`${OPEN}/product/${soldOut!.slug}?variant=${soldOut!.sku}`);
    await expect(page.getByRole("button", { name: "Sold out" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Add to bag" })).toHaveCount(0);
  });

  test("an item that's no longer sold is marked in the bag", async ({ page, request }) => {
    const p = await product(request, "wrap-around-ponytail");
    await addFromProductPage(page, 1, "wrap-around-ponytail");
    await expect(drawer(page)).toHaveAccessibleName("Your bag (1)");
    try {
      await setProductStatus(request, p.id, "INACTIVE");
      await page.goto(OPEN + "/cart");
      await expect(
        page.locator("main").getByText("This item is no longer available."),
      ).toBeVisible();
      await expect(
        page.locator("main").getByText("1 item needs your attention before checkout."),
      ).toBeVisible();
    } finally {
      await setProductStatus(request, p.id, "ACTIVE");
    }
  });

  test("a changed price is pointed out", async ({ page }) => {
    await addFromProductPage(page);
    await expect(drawer(page)).toBeVisible();
    // As if the price had been ₹1 more when the shopper added it.
    await page.evaluate(() => {
      const seen = JSON.parse(localStorage.getItem("hc-seen-prices") ?? "{}") as Record<
        string,
        string
      >;
      for (const key of Object.keys(seen)) seen[key] = (Number(seen[key]) + 1).toFixed(2);
      localStorage.setItem("hc-seen-prices", JSON.stringify(seen));
    });
    await page.goto(OPEN + "/cart");
    await expect(
      page.locator("main").getByText(/^Price changed from ₹[\d,]+ to ₹[\d,]+$/),
    ).toBeVisible();
  });

  test("keyboard: the bag button opens the drawer, Escape closes it", async ({ page }) => {
    await page.goto(OPEN + "/");
    await bagButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page).getByText("Your bag is empty")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer(page)).toBeHidden();
  });
});

test.describe("bag and accounts", () => {
  test("a guest's bag joins the account on sign-in, and follows the customer", async ({
    page,
    context,
    browser,
    request,
  }) => {
    const email = freshEmail();
    await request.post(`${API}/auth/register`, {
      data: { email, password: PASSWORD, firstName: "Sana" },
    });
    await addFromProductPage(page, 2);
    await expect(drawer(page)).toHaveAccessibleName("Your bag (2)");
    expect(await cookie(context, "hc_cart")).toBeDefined();

    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(OPEN + "/account");
    await expect(bagButton(page)).toHaveAccessibleName("Bag, 2 items");
    expect(await cookie(context, "hc_cart")).toBeUndefined();

    // The account's bag, from another browser.
    const other = await browser.newContext();
    const elsewhere = await other.newPage();
    await elsewhere.goto(OPEN + "/sign-in");
    await elsewhere.getByLabel("Email").fill(email);
    await elsewhere.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
    await elsewhere.getByRole("button", { name: "Sign in" }).click();
    await elsewhere.waitForURL(OPEN + "/account");
    await elsewhere.goto(OPEN + "/cart");
    await expect(elsewhere.locator("main").getByRole("listitem")).toHaveCount(1);
    await other.close();

    // Signing out leaves an empty guest bag (the account keeps its own).
    await page.goto(OPEN + "/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(bagButton(page)).toHaveAccessibleName("Bag, 0 items");
  });
});

test("without JavaScript, Add to bag and the cart page still work", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${OPEN}/product/${SLUG}`);
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page).toHaveURL(OPEN + "/cart");
  const main = page.locator("main");
  await expect(main.getByRole("listitem")).toHaveCount(1);
  await main.getByRole("button", { name: /^One more / }).click();
  await expect(page).toHaveURL(OPEN + "/cart");
  await expect(main.getByText(/^Quantity 2$/)).toBeVisible();
  await main.getByRole("button", { name: /from your bag$/ }).click();
  await expect(main.getByText("Your bag is empty")).toBeVisible();
  await context.close();
});

test("with the API down the bag page is calm", async ({ page, context }) => {
  // A guest bag with one item (an empty bag needs no API at all).
  const bag = Buffer.from(JSON.stringify([["11111111-1111-4111-8111-111111111111", 1]])).toString(
    "base64url",
  );
  await context.addCookies([{ name: "hc_cart", value: bag, url: API_DOWN, httpOnly: true }]);
  const response = await page.goto(API_DOWN + "/cart");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
});

test("the cart page shows only the shop's own problem messages", async ({ page }) => {
  await page.goto(OPEN + "/cart?problem=limited");
  await expect(page.getByText("Only a limited quantity of this item is available.")).toBeVisible();
  await page.goto(OPEN + "/cart?problem=Call%20us%20on%20123");
  await expect(page.getByText("Call us on 123")).toHaveCount(0);
  await page.goto(OPEN + "/cart?problem=constructor");
  await expect(page.getByRole("heading", { name: "Your bag" })).toBeVisible();
});
