import { expect, test } from "@playwright/test";
import type { Category } from "@/lib/api/types";
import { API, OPEN } from "../../playwright.config";
import { expectAccessible } from "./support/a11y";
import { adminToken, auth, CLIP_INS, product } from "./support/shop";

/** The categories the bar shows, as the API gives them (only ones with products, or children that have). */
async function menuNames(request: import("@playwright/test").APIRequestContext) {
  const body = (await (await request.get(`${API}/categories`)).json()) as { data: Category[] };
  const shows = (c: Category): boolean => c.productCount > 0 || c.children.some(shows);
  return body.data
    .filter(shows)
    .map((c) => ({ name: c.name, children: c.children.filter(shows).map((x) => x.name) }));
}

test("the category bar shows five categories with their sub-categories, and the rest under More", async ({
  page,
  request,
}) => {
  const categories = await menuNames(request);
  await page.goto(OPEN + "/");
  const bar = page.getByRole("navigation", { name: "Categories" });
  const shown = categories.slice(0, 5);
  for (const c of shown) {
    await expect(bar.getByText(c.name, { exact: true }).first()).toBeVisible();
  }
  const withChildren = shown.find((c) => c.children.length > 0);
  if (withChildren) {
    const button = bar.getByRole("button", { name: withChildren.name });
    await button.hover();
    await expect(bar.getByRole("link", { name: `All ${withChildren.name}` })).toBeVisible();
    await expect(
      bar.getByRole("link", { name: withChildren.children[0], exact: true }),
    ).toBeVisible();
    // Keyboard too: Escape closes and returns focus.
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 400);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  }
  const more = bar.getByRole("button", { name: "More" });
  if (categories.length > 5) {
    await more.click();
    for (const c of categories.slice(5)) {
      await expect(bar.getByRole("link", { name: c.name, exact: true })).toBeVisible();
    }
  } else {
    await expect(more).toHaveCount(0);
  }
});

test("on a tablet the category bar is shown too (the menu button is for phones)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto(OPEN + "/");
  await expect(page.getByRole("navigation", { name: "Categories" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  const widths = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    screen: window.innerWidth,
  }));
  expect(widths.page).toBeLessThanOrEqual(widths.screen);
});

test("a product's headline shows in bold above its short description; card names are bold", async ({
  page,
  request,
}) => {
  // The product page is cached for about a minute: allow for the refresh.
  test.setTimeout(180_000);
  const token = await adminToken(request);
  const { id } = await product(request, CLIP_INS);
  const set = async (headline: string | null) => {
    const current = await (
      await request.get(`${API}/admin/products/${id}`, { headers: auth(token) })
    ).json();
    const res = await request.patch(`${API}/admin/products/${id}`, {
      headers: auth(token),
      data: { version: current.data.version, headline },
    });
    expect(res.status()).toBe(200);
  };
  await set("Salon-quality Remy hair, ready in 10 minutes");
  try {
    await expect(async () => {
      await page.goto(`${OPEN}/product/${CLIP_INS}`);
      await expect(page.getByText("Salon-quality Remy hair, ready in 10 minutes")).toBeVisible({
        timeout: 1000,
      });
    }).toPass({ timeout: 90_000 });
    const headline = page.getByText("Salon-quality Remy hair, ready in 10 minutes");
    expect(
      Number(await headline.evaluate((el) => getComputedStyle(el).fontWeight)),
    ).toBeGreaterThanOrEqual(700);
    await expectAccessible(page, "product page with a headline");
  } finally {
    await set(null);
  }

  await page.goto(OPEN + "/shop");
  const name = page.locator('a[href^="/product/"] h3').first();
  expect(
    Number(await name.evaluate((el) => getComputedStyle(el).fontWeight)),
  ).toBeGreaterThanOrEqual(600);
});

test("the Exchange policy page says exchange only, within 4 days, defective and unused", async ({
  page,
}) => {
  await page.goto(OPEN + "/returns");
  await expect(
    page.getByRole("heading", { level: 1, name: "Exchange policy and cancellations" }),
  ).toBeVisible();
  await expect(
    page.getByText("Defective and unused? Exchange within 4 days of delivery"),
  ).toBeVisible();
  await expect(page.getByText("No returns or refunds after delivery").first()).toBeVisible();
  await expectAccessible(page, "exchange policy");
});
