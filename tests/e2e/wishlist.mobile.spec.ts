import { expect, test } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";

test.describe("wishlist on a phone", () => {
  test("the menu links to it, hearts can be tapped, and the page fits the screen", async ({
    page,
    request,
  }) => {
    const email = `wish.phone.${Date.now()}@example.com`;
    await request.post(`${API}/auth/register`, {
      data: { email, password: "Silky2026!", firstName: "Meera" },
    });
    await page.goto(OPEN + "/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Silky2026!");
    await page.getByRole("button", { name: "Sign in" }).tap();
    await page.waitForURL((url) => url.pathname !== "/sign-in");

    await page.goto(OPEN + "/shop");
    const heart = page
      .locator("main")
      .getByRole("button", { name: "Save Wrap-around Ponytail to your wishlist" });
    const box = await heart.boundingBox();
    expect(box!.width, "a comfortable tap target").toBeGreaterThanOrEqual(44);
    await heart.tap();
    await expect(
      page
        .locator("main")
        .getByRole("button", { name: "Remove Wrap-around Ponytail from your wishlist" }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Open menu" }).tap();
    await page
      .getByRole("dialog", { name: "Menu" })
      .getByRole("link", { name: "My wishlist" })
      .tap();
    await expect(page).toHaveURL(OPEN + "/wishlist");
    await expect(page.locator("main").getByRole("listitem")).toHaveCount(1);
    const screen = page.viewportSize()!;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      screen.width,
    );
  });
});
