import { expect, test } from "@playwright/test";
import { OPEN } from "../../playwright.config";
import { CLIP_INS } from "./support/shop";

/**
 * The product page and footer changes (owner, 2026-11-06): Description and
 * Details under the buttons, opening and closing; no Delivery & exchange tab;
 * round colour swatches, length pills and texture icons; Amazon-style zoom on
 * hover; the payment logos in the footer.
 */
test.describe("product page, 2026-11-06", () => {
  test("Description and Details open and close under the buttons; no delivery tab", async ({
    page,
  }) => {
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByText("Delivery & exchange")).toHaveCount(0);
    const description = page.locator("details", {
      has: page.locator("summary", { hasText: "Description" }),
    });
    const details = page.locator("details", {
      has: page.locator("summary", { hasText: "Details" }),
    });
    await expect(description).toHaveAttribute("open", "");
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.locator("dl")).toBeVisible();
    // Under the buttons.
    const bag = await page
      .getByRole("button", { name: /Add to bag/ })
      .first()
      .boundingBox();
    const summary = await description.locator("summary").boundingBox();
    expect(summary!.y).toBeGreaterThan(bag!.y);
    // The policies stay linked.
    await expect(page.getByRole("link", { name: "Shipping details" })).toHaveAttribute(
      "href",
      "/shipping",
    );
    await expect(page.getByRole("link", { name: "Exchange policy" }).first()).toHaveAttribute(
      "href",
      "/returns",
    );
  });

  test("colours are round swatches and lengths compact pills, named in full", async ({ page }) => {
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    const lengths = page.getByRole("group", { name: "Length" });
    const length = lengths.getByRole("link").first();
    await expect(length).toHaveAccessibleName(/^\d+ inch/);
    await expect(length).toContainText("″");
    const colours = page.getByRole("group", { name: "Colour" });
    if ((await colours.count()) > 0) {
      const swatch = colours.locator("a[data-swatch]").first();
      const box = await swatch.boundingBox();
      expect(Math.round(box!.width)).toBe(Math.round(box!.height));
    }
  });

  test("hovering the large photo shows the zoom beside it (desktop)", async ({ page }) => {
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    const photo = page.locator("[data-hover-zoom]").first();
    await expect(photo).toBeVisible();
    const box = (await photo.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator("[data-zoom-lens]")).toBeVisible();
    await expect(page.locator("[data-zoom-view]")).toBeVisible();
    const view = (await page.locator("[data-zoom-view]").boundingBox())!;
    expect(view.x).toBeGreaterThan(box.x + box.width);
    await page.mouse.move(5, 5);
    await expect(page.locator("[data-zoom-lens]")).toHaveCount(0);
  });

  test("the footer shows each payment's own logo", async ({ page }) => {
    await page.goto(OPEN + "/");
    const footer = page.locator("footer");
    for (const name of ["UPI", "Google Pay", "PhonePe", "Paytm", "Visa", "Mastercard", "RuPay"]) {
      const logo = footer.getByRole("img", { name, exact: true });
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toBeVisible();
      // Lazily loaded: wait until the file has arrived.
      await expect
        .poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0);
      expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }
    await expect(footer.getByText("Net banking")).toBeVisible();
  });
});

test("tapping a product shows the loading bar at once, until its page arrives", async ({
  page,
}) => {
  await page.goto(OPEN + "/shop");
  // Slow the page down a little, so the bar is seen.
  await page.route("**/product/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  const link = page.locator('a[href^="/product/"]').first();
  const href = await link.getAttribute("href");
  await link.click();
  await expect(page.locator('[data-navigation-progress="loading"]')).toBeVisible();
  await expect(page).toHaveURL(OPEN + href);
  await expect(page.locator("[data-navigation-progress]")).toHaveCount(0);
});
