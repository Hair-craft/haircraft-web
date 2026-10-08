import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { PublicProduct, PublicVariant } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { defaultVariant, pick } from "@/lib/product/variants";
import { API, API_DOWN, OPEN } from "../../playwright.config";

/**
 * API answers, asked once per test file: the API allows 100 requests a
 * minute per address, and the test servers' own requests count too.
 */
const answers = new Map<string, unknown>();
async function apiGet<T>(request: APIRequestContext, path: string): Promise<T> {
  if (!answers.has(path)) {
    const response = await request.get(`${API}${path}`);
    if (!response.ok()) throw new Error(`API ${path} answered ${response.status()}`);
    answers.set(path, (await response.json()).data);
  }
  return answers.get(path) as T;
}
const apiProduct = (request: APIRequestContext, slug: string) =>
  apiGet<PublicProduct>(request, `/products/${slug}`);
async function apiSlugs(request: APIRequestContext): Promise<string[]> {
  return (await apiGet<{ slug: string }[]>(request, "/products?limit=100")).map((p) => p.slug);
}
/** A product with at least two lengths and two colours (for the picker), from the sample catalogue. */
async function richProduct(request: APIRequestContext): Promise<PublicProduct> {
  for (const slug of await apiSlugs(request)) {
    const product = await apiProduct(request, slug);
    if (product.options.lengths.length > 1 && product.options.colors.length > 1) return product;
  }
  throw new Error("No product with several lengths and colours in the catalogue");
}

const buyBox = (page: Page) => page.locator("main");
const price = (variant: PublicVariant) => formatPrice(variant.effectivePrice);

test.describe("product page", () => {
  test("every product page shows its name, price and photos, linked from the shop", async ({
    page,
    request,
  }) => {
    for (const slug of await apiSlugs(request)) {
      const product = await apiProduct(request, slug);
      const first = defaultVariant(product.variants)!;
      await page.goto(`${OPEN}/product/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name);
      // The name, then key facts (S15b), then the brand.
      await expect(page).toHaveTitle(new RegExp(`^${product.name}( — .+)? \\| HairCraft$`));
      await expect(buyBox(page)).toContainText(price(first));
      const photo = page
        .getByRole("button", { name: /^View photo 1 of/ })
        .locator("img")
        .first();
      await expect
        .poll(
          () => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
          {
            message: `${slug}: the first photo loads`,
          },
        )
        .toBe(true);
    }
    // A product card in the shop opens its page.
    await page.goto(OPEN + "/shop");
    const card = page
      .locator('section[aria-labelledby="results-count"] a[href^="/product/"]')
      .first();
    const name = await card.getByRole("heading", { level: 3 }).textContent();
    await card.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name ?? "");
  });

  test("picking options changes price, stock, photos and address, without reloading", async ({
    page,
    request,
  }) => {
    const product = await richProduct(request);
    const start = defaultVariant(product.variants)!;
    await page.goto(`${OPEN}/product/${product.slug}`);
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));

    const lengths = page.getByRole("group", { name: "Length" });
    const otherLength = product.options.lengths.find((l) => l !== start.lengthInches)!;
    const expected = pick(product.variants, start, "lengthInches", otherLength);
    await lengths.getByRole("link", { name: new RegExp(`^${otherLength} inch`) }).click();
    await expect(page).toHaveURL(`${OPEN}/product/${product.slug}?variant=${expected.sku}`);
    await expect(
      lengths.getByRole("link", { name: new RegExp(`^${otherLength} inch`) }),
    ).toHaveAttribute("aria-current", "true");
    await expect(buyBox(page)).toContainText(price(expected));
    await expect(page.getByText(`SKU: ${expected.sku}`)).toBeVisible();
    await expect(
      page.getByText(expected.inStock ? "In stock" : "Sold out", { exact: true }),
    ).toBeVisible();

    const otherColour = product.options.colors.find((c) => c !== expected.color)!;
    const next = pick(product.variants, expected, "color", otherColour);
    await page
      .getByRole("group", { name: "Colour" })
      .getByRole("link", { name: new RegExp(`^${otherColour}`) })
      .click();
    await expect(page).toHaveURL(`${OPEN}/product/${product.slug}?variant=${next.sku}`);
    await expect(page.getByText(`SKU: ${next.sku}`)).toBeVisible();
    // The option's own photo comes first, when it has one.
    const own = product.images.find((image) => image.variantId === next.id);
    if (own)
      await expect(
        page
          .getByRole("button", { name: /^View photo 1 of/ })
          .first()
          .locator("img"),
      ).toHaveAttribute(
        "src",
        new RegExp(
          encodeURIComponent(own.urls.large)
            .slice(-40)
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      );
    // No page load happened.
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);

    // The details follow the chosen option.
    await page
      .locator("summary")
      .filter({ hasText: /^Details/ })
      .click();
    await expect(page.locator("dl")).toContainText(`${next.lengthInches} inch`);
  });

  test("sold-out options are struck through but can be chosen; sale options show the saving", async ({
    page,
    request,
  }) => {
    let soldOut: { product: PublicProduct; variant: PublicVariant } | null = null;
    let onSale: { product: PublicProduct; variant: PublicVariant } | null = null;
    for (const slug of await apiSlugs(request)) {
      const product = await apiProduct(request, slug);
      for (const variant of product.variants) {
        if (!variant.inStock && !soldOut) soldOut = { product, variant };
        if (variant.onSale && variant.inStock && !onSale) onSale = { product, variant };
      }
    }
    expect(soldOut, "the sample catalogue has a sold-out option").not.toBeNull();
    expect(onSale, "the sample catalogue has an option on sale").not.toBeNull();

    await page.goto(`${OPEN}/product/${soldOut!.product.slug}?variant=${soldOut!.variant.sku}`);
    // The stock line says so, and the button can't be pressed.
    await expect(page.locator("main p").filter({ hasText: /^Sold out$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sold out" })).toBeDisabled();

    await page.goto(`${OPEN}/product/${onSale!.product.slug}?variant=${onSale!.variant.sku}`);
    const v = onSale!.variant;
    await expect(page.locator("main s").first()).toContainText(formatPrice(v.price));
    await expect(page.getByText(/^Save ₹/)).toBeVisible();
  });

  test("a shared option link opens that option; other addresses are tidied", async ({
    page,
    request,
  }) => {
    const product = await richProduct(request);
    const last = product.variants[product.variants.length - 1];
    await page.goto(`${OPEN}/product/${product.slug}?variant=${last.sku}`);
    await expect(page.getByText(`SKU: ${last.sku}`)).toBeVisible();

    const lower = await request.get(
      `${OPEN}/product/${product.slug}?variant=${last.sku.toLowerCase()}`,
      { maxRedirects: 0 },
    );
    expect(lower.status()).toBe(307);
    expect(lower.headers().location).toBe(`/product/${product.slug}?variant=${last.sku}`);
    const unknown = await request.get(`${OPEN}/product/${product.slug}?variant=NOPE&x=1`, {
      maxRedirects: 0,
    });
    expect(unknown.headers().location).toBe(`/product/${product.slug}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/product/${product.slug}$`),
    );
  });

  test("gallery: thumbnails, arrows, keyboard and the full-screen view", async ({
    page,
    request,
  }) => {
    const product = await richProduct(request);
    const total = product.images.length;
    expect(total).toBeGreaterThan(1);
    await page.goto(`${OPEN}/product/${product.slug}`);
    const thumbs = page.getByRole("list", { name: "Photos" }).first().getByRole("button");
    await expect(thumbs).toHaveCount(total);
    await thumbs.nth(1).click();
    await expect(thumbs.nth(1)).toHaveAttribute("aria-current", "true");
    await page.getByRole("button", { name: "Next photo" }).first().click();
    await expect(thumbs.nth(2 % total)).toHaveAttribute("aria-current", "true");

    await page
      .getByRole("button", { name: /full screen/ })
      .first()
      .click();
    const viewer = page.getByRole("dialog", { name: `${product.name}: photos` });
    await expect(viewer).toBeVisible();
    await expect(viewer).toContainText(`/ ${total}`);
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
  });

  test("reviews: the summary and list match the API, and can be re-sorted", async ({
    page,
    request,
  }) => {
    let reviewed: PublicProduct | null = null;
    let unreviewed: PublicProduct | null = null;
    for (const slug of await apiSlugs(request)) {
      const product = await apiProduct(request, slug);
      if (product.reviewCount > 0 && !reviewed) reviewed = product;
      if (product.reviewCount === 0 && !unreviewed) unreviewed = product;
    }
    expect(reviewed).not.toBeNull();
    const summary = (
      await (await request.get(`${API}/products/${reviewed!.slug}/reviews/summary`)).json()
    ).data;

    await page.goto(`${OPEN}/product/${reviewed!.slug}`);
    const section = page.getByRole("region", { name: "Customer reviews" });
    await expect(section).toContainText(
      `Based on ${summary.count} ${summary.count === 1 ? "review" : "reviews"}`,
    );
    const lowest = (
      await (
        await request.get(`${API}/products/${reviewed!.slug}/reviews?sort=lowest&limit=5`)
      ).json()
    ).data as { id: string; reviewerName: string }[];
    await section.getByLabel("Sort reviews").selectOption("lowest");
    await expect(section.getByRole("article")).toHaveCount(lowest.length);
    await expect(section.getByRole("article").first()).toHaveAccessibleName(
      `Review by ${lowest[0].reviewerName}`,
    );
    // The stars near the name jump to the reviews.
    await expect(page.getByRole("link", { name: /^Rated / }).first()).toHaveAttribute(
      "href",
      "#reviews",
    );

    // The route behind Show more and sorting.
    const more = await request.get(
      `${OPEN}/bff/products/${reviewed!.slug}/reviews?sort=highest&page=1`,
    );
    expect((await more.json()).data.items.length).toBeGreaterThan(0);
    expect(
      (await request.get(`${OPEN}/bff/products/${reviewed!.slug}/reviews?sort=best`)).status(),
    ).toBe(400);

    if (unreviewed) {
      await page.goto(`${OPEN}/product/${unreviewed.slug}`);
      await expect(page.getByText(/^No reviews yet/)).toBeVisible();
    }
  });

  test("related products, breadcrumbs and structured data", async ({ page, request }) => {
    const product = await richProduct(request);
    await page.goto(`${OPEN}/product/${product.slug}`);
    const related = page.getByRole("region", { name: "You may also like" });
    const links = related.locator('a[href^="/product/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(4);
    for (let i = 0; i < count; i++)
      expect(await links.nth(i).getAttribute("href")).not.toBe(`/product/${product.slug}`);

    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs).toContainText(product.categories[0].name);
    const data = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map((text) => JSON.parse(text))
      .find((item) => item["@type"] === "Product");
    expect(data).toMatchObject({
      name: product.name,
      offers: {
        priceCurrency: "INR",
        lowPrice: product.priceRange.min,
        highPrice: product.priceRange.max,
      },
    });
    expect(data.aggregateRating === undefined).toBe(product.reviewCount === 0);
  });

  test("an unknown product is a real 404; the API being down is calm", async ({
    page,
    request,
  }) => {
    expect((await request.get(OPEN + "/product/no-such-product")).status()).toBe(404);
    await page.goto(OPEN + "/product/no-such-product");
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
    await expect(page.getByRole("banner")).toHaveCount(1);

    const response = await page.goto(API_DOWN + "/product/deep-wave-tape-ins");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
  });

  test("without JavaScript the option buttons are links that work", async ({
    browser,
    request,
  }) => {
    const product = await richProduct(request);
    const start = defaultVariant(product.variants)!;
    const otherLength = product.options.lengths.find((l) => l !== start.lengthInches)!;
    const expected = pick(product.variants, start, "lengthInches", otherLength);
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${OPEN}/product/${product.slug}`);
    await page
      .getByRole("group", { name: "Length" })
      .getByRole("link", { name: new RegExp(`^${otherLength} inch`) })
      .click();
    await expect(page).toHaveURL(`${OPEN}/product/${product.slug}?variant=${expected.sku}`);
    await expect(page.getByText(`SKU: ${expected.sku}`)).toBeVisible();
    await context.close();
  });

  test("products are in the sitemap while the shop is open", async ({ request }) => {
    const sitemap = await (await request.get(OPEN + "/sitemap.xml")).text();
    for (const slug of await apiSlugs(request)) expect(sitemap).toContain(`/product/${slug}</loc>`);
  });
});
