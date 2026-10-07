import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";
import { CLIP_INS, shopper, signIn } from "./support/shop";

test.describe("reviews on a phone", () => {
  test("the review form fits, and stars can be tapped", async ({ page, request }) => {
    const { email } = await shopper(request, "review.phone");
    await signIn(page, email);
    await page.goto(`${OPEN}/product/${CLIP_INS}/review`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    const star = page.getByText("4 stars: Very good");
    const box = await page.locator("label").filter({ has: star }).boundingBox();
    expect(box!.width, "a comfortable tap target").toBeGreaterThanOrEqual(40);
    await page.locator("label").filter({ has: star }).tap();
    await expect(page.getByRole("radio", { name: "4 stars: Very good" })).toBeChecked();
    // Photos can be added from the phone (camera or gallery).
    await expect(page.getByRole("group", { name: "Photos (optional)" })).toBeVisible();
    expect(await page.locator('input[type="file"][name="photos"]').getAttribute("accept")).toBe(
      "image/jpeg,image/png,image/webp",
    );
  });
});
