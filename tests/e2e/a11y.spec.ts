import { test, type Page } from "@playwright/test";
import { API, API_DOWN, CLOSED, OPEN } from "../../playwright.config";
import { expectAccessible } from "./support/a11y";
import { CLIP_INS, cancelUnpaidOrders, placeOrderByApi, shopper, signIn } from "./support/shop";

/**
 * The accessibility audit (S15.6): axe-core on every page type and its open
 * states, on a computer (this file) and a phone (a11y.mobile.spec.ts).
 */
async function firstCategory(): Promise<string> {
  return (await (await fetch(`${API}/categories`)).json()).data[0].slug;
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // Let fade-ins and opening animations finish, so colours are measured as seen.
  await page.waitForTimeout(800);
}

test.describe("accessibility: guests", () => {
  test("home, shop, category, product, search and the information pages", async ({ page }) => {
    test.setTimeout(180_000);
    const pages = [
      "/",
      "/shop",
      `/shop/${await firstCategory()}`,
      `/product/${CLIP_INS}`,
      "/search?q=wig",
      "/search?q=zzzzqqq",
      "/cart",
      "/sign-in",
      "/register",
      "/forgot-password",
      "/shipping",
      "/returns",
      "/faq",
      "/contact",
      "/about",
      "/privacy",
      "/terms",
      "/guides",
      "/guides/how-to-choose-hair-extensions",
      "/guides/hair-toppers-for-thinning-hair",
      "/this-page-does-not-exist",
    ];
    for (const path of pages) {
      await page.goto(OPEN + path);
      // Scroll through so below-the-fold sections have faded in.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await settle(page);
      await expectAccessible(page, path);
    }
  });

  test("open states: category menu, search suggestions, photo viewer, bag drawer, errors", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto(OPEN + "/");
    await page
      .getByRole("navigation", { name: "Categories" })
      .locator("button[aria-expanded]")
      .first()
      .click();
    await settle(page);
    await expectAccessible(page, "category menu open");

    await page.keyboard.press("Escape");
    await page
      .getByRole("navigation", { name: "Account and cart" })
      .getByRole("link", { name: "Search" })
      .click();
    await page.getByRole("combobox", { name: "Search the shop" }).fill("clip");
    await page.getByRole("listbox", { name: "Suggestions" }).waitFor();
    await settle(page);
    await expectAccessible(page, "search suggestions");

    await page.goto(OPEN + `/product/${CLIP_INS}`);
    await page
      .getByRole("button", { name: /^View photo 1 of/ })
      .first()
      .click();
    await settle(page);
    await expectAccessible(page, "photo viewer");
    await page.keyboard.press("Escape");

    await page
      .getByRole("button", { name: /^Add to bag/ })
      .first()
      .click();
    await settle(page);
    await expectAccessible(page, "bag drawer");

    await page.goto(OPEN + "/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();
    await settle(page);
    await expectAccessible(page, "sign-in with errors");
  });

  test("the shop closed and the API down", async ({ page }) => {
    await page.goto(CLOSED + "/");
    await settle(page);
    await expectAccessible(page, "coming soon");
    await page.goto(API_DOWN + "/shop");
    await settle(page);
    await expectAccessible(page, "API down");
  });
});

test.describe("accessibility: signed in", () => {
  test("account, checkout, payment, orders and reviews", async ({ page, request }) => {
    test.setTimeout(180_000);
    const { email, token, addressId } = await shopper(request, "a11y");
    await signIn(page, email);
    for (const path of [
      "/account",
      "/account/profile",
      "/account/addresses",
      "/account/addresses/new",
      "/account/security",
      "/wishlist",
      "/cart",
      "/checkout",
      `/product/${CLIP_INS}/review`,
      "/account/reviews",
    ]) {
      await page.goto(OPEN + path);
      await settle(page);
      await expectAccessible(page, path);
    }
    const online = await placeOrderByApi(request, token, addressId, {
      pay: "ONLINE",
      skipAdd: true,
    });
    await page.goto(`${OPEN}/checkout/placed/${online.orderNumber}`);
    await settle(page);
    await expectAccessible(page, "order placed, waiting for payment");
    await page.goto(OPEN + "/account/orders");
    await settle(page);
    await expectAccessible(page, "my orders");
    await page.goto(`${OPEN}/account/orders/${online.orderNumber}`);
    await settle(page);
    await expectAccessible(page, "an order");
    // An unpaid online order holds stock; release it for the other tests.
    await cancelUnpaidOrders(request);
  });
});
