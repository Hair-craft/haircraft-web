import { expect, test } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";

test.describe("product page on a phone", () => {
  test("photos swipe with dots; options tap; the page fits the screen", async ({
    page,
    request,
  }) => {
    const slugs = (
      (await (await request.get(`${API}/products?limit=100`)).json()).data as {
        slug: string;
      }[]
    ).map((p) => p.slug);
    let slug = slugs[0];
    for (const candidate of slugs) {
      const product = (await (await request.get(`${API}/products/${candidate}`)).json()).data;
      if (product.images.length > 1 && product.options.lengths.length > 1) {
        slug = candidate;
        break;
      }
    }
    await page.goto(`${OPEN}/product/${slug}`);
    const row = page.getByRole("list", { name: "Photos", exact: true }).last();
    await expect(row).toBeVisible();
    const dots = page.getByRole("button", { name: /^Photo \d+ of \d+$/ }).filter({ visible: true });
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    await row.evaluate((el) => el.scrollTo({ left: el.clientWidth }));
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");

    const lengths = page.getByRole("group", { name: "Length" });
    await lengths.getByRole("link").last().tap();
    await expect(page).toHaveURL(/\?variant=/);

    const screen = page.viewportSize()!.width;
    const width = await page.evaluate(() => ({
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.inner).toBe(screen);
    expect(width.scroll).toBeLessThanOrEqual(screen);
  });
});
