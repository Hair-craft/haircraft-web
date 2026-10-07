import { expect, test } from "@playwright/test";
import type { PublicProduct } from "@/lib/api/types";
import { defaultVariant } from "@/lib/product/variants";
import { API, OPEN } from "../../playwright.config";

test.describe("checkout on a phone", () => {
  test("the summary is folded to its total, and the page fits the screen", async ({
    page,
    request,
  }) => {
    const email = `checkout.phone.${Date.now()}@example.com`;
    const registered = await request.post(`${API}/auth/register`, {
      data: { email, password: "Silky2026!", firstName: "Divya" },
    });
    const token = (await registered.json()).data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    await request.post(`${API}/addresses`, {
      headers,
      data: {
        fullName: "Divya Nair",
        phone: "+919812345678",
        line1: "4 Lake View",
        city: "Kochi",
        state: "Kerala",
        postalCode: "682001",
      },
    });
    const clip: PublicProduct = (
      await (await request.get(`${API}/products/classic-straight-clip-in-set`)).json()
    ).data;
    await request.post(`${API}/cart/items`, {
      headers,
      data: { variantId: defaultVariant(clip.variants)!.id, quantity: 1 },
    });

    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Silky2026!");
    await page.getByRole("button", { name: "Sign in" }).tap();
    await page.waitForURL((url) => url.pathname !== "/sign-in");
    await page.goto(OPEN + "/checkout");

    const screen = page.viewportSize()!;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen.width,
    );
    const fold = page.getByText(/^Order summary \(/);
    await expect(fold).toBeVisible();
    const items = page.getByRole("list", { name: "Items in your order" }).first();
    await expect(items).toBeHidden();
    await fold.tap();
    await expect(items).toBeVisible();
    await expect(page.getByRole("button", { name: /^Place order/ })).toBeEnabled();
  });
});
