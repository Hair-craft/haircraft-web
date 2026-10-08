import { expect, test } from "@playwright/test";
import { API_DOWN, CLOSED, OPEN } from "../../playwright.config";

/** Top-level categories from the development API (seed:catalog). */
const TOP_CATEGORIES = ["Clip-in Extensions", "Tape-in Extensions", "Wigs", "Ponytails"];

test.describe("coming-soon gate (shop closed)", () => {
  test("every address shows Coming soon, at its own URL", async ({ page }) => {
    for (const path of ["/", "/shop", "/shop/wigs", "/account", "/made-up"]) {
      const response = await page.goto(CLOSED + path);
      expect(response?.status(), path).toBe(200);
      await expect(page).toHaveURL(CLOSED + path);
      await expect(page.getByText("HairCraft · Launching soon")).toBeVisible();
      await expect(page.getByRole("heading", { name: /Coming\s+soon/ })).toBeVisible();
    }
    await expect(page).toHaveTitle("HairCraft — Premium Hair Extensions | Coming Soon");
    // No shop header behind the curtain.
    await expect(page.getByRole("navigation", { name: "Categories" })).toHaveCount(0);
  });

  test("robots, sitemap and the health check still work", async ({ request }) => {
    expect((await request.get(CLOSED + "/robots.txt")).status()).toBe(200);
    expect((await request.get(CLOSED + "/sitemap.xml")).status()).toBe(200);
    const health = await request.get(CLOSED + "/bff/health");
    expect(health.status()).toBe(200);
    expect(await health.json()).toEqual({ data: { storefront: "ok", api: "ok" } });
  });
});

test.describe("shop layout (shop open)", () => {
  test("home page with the real categories from the API", async ({ page }) => {
    await page.goto(OPEN + "/");
    await expect(page).toHaveTitle("HairCraft — Human Hair Extensions, Toppers & Wigs in India");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("crafted for");
    const nav = page.getByRole("navigation", { name: "Categories" });
    for (const name of TOP_CATEGORIES) {
      await expect(nav.getByText(name, { exact: true })).toBeVisible();
    }
    const cards = page.getByRole("region", { name: "Shop by category" }).getByRole("link");
    await expect(cards).toHaveCount(4);
    await expect(cards.first()).toHaveAttribute("href", "/shop/clip-in-extensions");
    // Account and cart icons are labelled for screen readers.
    for (const label of ["Search", "Wishlist", "Sign in", "Bag, 0 items"]) {
      await expect(
        page
          .getByRole("navigation", { name: "Account and cart" })
          .getByRole("link", { name: label, exact: true }),
      ).toBeVisible();
    }
    await expect(page.getByRole("contentinfo")).toContainText("GST included");
  });

  test("a category with sub-categories opens its menu by click and keyboard", async ({ page }) => {
    await page.goto(OPEN + "/");
    const trigger = page
      .getByRole("navigation", { name: "Categories" })
      .getByRole("button", { name: "Clip-in Extensions" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: "Seamless Clip-ins" })).toBeVisible();
    await expect(page.getByRole("link", { name: "All Clip-in Extensions" })).toHaveAttribute(
      "href",
      "/shop/clip-in-extensions",
    );
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Classic Clip-ins" })).toBeVisible();
  });

  test("keyboard users can skip straight to the content", async ({ page }) => {
    await page.goto(OPEN + "/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("unknown addresses get the 404 page inside the shop layout", async ({ page }) => {
    const response = await page.goto(OPEN + "/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
    // One header and offers bar, not two (the layout's and the 404's own).
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Offers" })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Categories" })).toBeVisible();
    await page.getByRole("link", { name: "Go to the home page" }).click();
    await expect(page).toHaveURL(OPEN + "/");
  });

  test("old coming-soon links go to the shop once it is open", async ({ page }) => {
    await page.goto(OPEN + "/coming-soon");
    await expect(page).toHaveURL(OPEN + "/");
  });

  test("the health check reports the API", async ({ request }) => {
    const health = await request.get(OPEN + "/bff/health");
    expect(health.headers()["cache-control"]).toBe("no-store");
    expect(await health.json()).toEqual({ data: { storefront: "ok", api: "ok" } });
  });
});

test.describe("when the API can't be reached", () => {
  test("pages still load with a calm message instead of an error", async ({ page }) => {
    const response = await page.goto(API_DOWN + "/");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByText("We can't reach the shop right now", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "We'll be right back" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Try again" }).first()).toBeVisible();
    // The rest of the layout still works.
    await expect(page.getByRole("link", { name: "HairCraft home" })).toBeVisible();
  });

  test("the health check says so (503) with a friendly message", async ({ request }) => {
    const health = await request.get(API_DOWN + "/bff/health");
    expect(health.status()).toBe(503);
    expect(await health.json()).toEqual({
      error: {
        code: "API_UNREACHABLE",
        message: "We can't reach the shop right now. Please try again in a moment.",
        fields: {},
      },
    });
  });
});
