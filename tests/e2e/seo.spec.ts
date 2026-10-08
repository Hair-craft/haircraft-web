import { expect, test, type Page } from "@playwright/test";
import { API, API_DOWN, CLOSED, OPEN } from "../../playwright.config";
import { CLIP_INS } from "./support/shop";

/** Every `application/ld+json` block on the page, parsed. */
async function structuredData(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  return blocks.flatMap((text) => {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  });
}

const meta = (page: Page, selector: string) =>
  page.locator(selector).first().getAttribute("content");

/** A PNG's width and height, read from its header. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test.describe("robots.txt", () => {
  test("the live-like shop lets search engines in, except private pages", async ({ request }) => {
    const text = await (await request.get(OPEN + "/robots.txt")).text();
    expect(text).toMatch(/Allow: \//);
    for (const path of ["/account", "/checkout", "/cart", "/bff/", "/search"])
      expect(text).toContain(`Disallow: ${path}`);
    expect(text).toContain("Sitemap: http://localhost:3101/sitemap.xml");
  });

  test("a copy without ALLOW_INDEXING keeps everything out, and its pages say noindex", async ({
    request,
    page,
  }) => {
    const text = await (await request.get(API_DOWN + "/robots.txt")).text();
    expect(text).toMatch(/Disallow: \/\s*$/m);
    expect(text).not.toContain("Sitemap:");
    await page.goto(API_DOWN + "/faq");
    expect(await meta(page, 'meta[name="robots"]')).toMatch(/noindex/);
  });
});

test.describe("link previews", () => {
  test("the site-wide and category share images are 1200×630 PNGs", async ({ page, request }) => {
    const category = (await (await request.get(`${API}/categories`)).json()).data[0].slug;
    for (const path of ["/", "/faq", `/shop/${category}`]) {
      await page.goto(OPEN + path);
      const image = await meta(page, 'meta[property="og:image"]');
      expect(image, path).toBeTruthy();
      const res = await request.get(image!);
      expect(res.status(), path).toBe(200);
      expect(res.headers()["content-type"]).toBe("image/png");
      expect(pngSize(await res.body())).toEqual({ width: 1200, height: 630 });
    }
    // A product shares its own photo.
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    expect(await meta(page, 'meta[property="og:image"]')).not.toMatch(/opengraph-image/);
  });

  test("share images are served even while the shop is closed", async ({ request }) => {
    const res = await request.get(CLOSED + "/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });

  test("every main page has a title, description, canonical address and large card", async ({
    page,
    request,
  }) => {
    const category = (await (await request.get(`${API}/categories`)).json()).data[0].slug;
    for (const path of ["/", "/shop", `/shop/${category}`, `/product/${CLIP_INS}`, "/shipping"]) {
      await page.goto(OPEN + path);
      expect((await page.title()).length, path).toBeGreaterThan(5);
      expect(await meta(page, 'meta[name="description"]'), path).toBeTruthy();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      const trim = (url: string) => (url.endsWith("/") ? url.slice(0, -1) : url);
      expect(trim(canonical ?? ""), path).toBe(trim(OPEN + path));
      expect(await meta(page, 'meta[property="og:site_name"]'), path).toBe("HairCraft");
      expect(await meta(page, 'meta[name="twitter:card"]'), path).toBe("summary_large_image");
    }
    expect(await page.locator("html").getAttribute("lang")).toBe("en-IN");
  });
});

test.describe("structured data", () => {
  test("a product has offers per option with delivery and returns, and the business has its returns policy", async ({
    page,
    request,
  }) => {
    const product = (await (await request.get(`${API}/products/${CLIP_INS}`)).json()).data;
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    const data = await structuredData(page);
    const item = data.find((d) => d["@type"] === "Product") as {
      offers: {
        offers: { sku: string; shippingDetails: unknown; hasMerchantReturnPolicy: unknown }[];
      };
    };
    expect(item.offers.offers.map((o) => o.sku).sort()).toEqual(
      (product.variants as { sku: string }[]).map((v) => v.sku).sort(),
    );
    for (const offer of item.offers.offers) {
      expect(offer.shippingDetails).toMatchObject({
        shippingDestination: { addressCountry: "IN" },
      });
      expect(offer.hasMerchantReturnPolicy).toMatchObject({ merchantReturnDays: 7 });
    }
    expect(data.find((d) => d["@type"] === "BreadcrumbList")).toBeTruthy();
    expect(data.find((d) => d["@type"] === "OnlineStore")).toMatchObject({
      hasMerchantReturnPolicy: { applicableCountry: "IN" },
    });
  });

  test("a category lists its products in order", async ({ page, request }) => {
    const category = (await (await request.get(`${API}/categories`)).json()).data[0].slug;
    await page.goto(`${OPEN}/shop/${category}`);
    const list = (await structuredData(page)).find((d) => d["@type"] === "ItemList") as {
      itemListElement: { position: number; url: string }[];
    };
    expect(list.itemListElement.length).toBeGreaterThan(0);
    expect(list.itemListElement[0].position).toBe(1);
    expect(list.itemListElement[0].url).toMatch(/\/product\//);
  });
});

test("the sitemap lists the information pages and product photos", async ({ request }) => {
  const xml = await (await request.get(OPEN + "/sitemap.xml")).text();
  for (const path of ["/shipping", "/returns", "/faq", "/privacy"])
    expect(xml).toContain(`<loc>${OPEN}${path}</loc>`);
  expect(xml).toMatch(/<image:loc>/);
});

test("the logo downloads at the size it's shown", async ({ page }) => {
  await page.goto(OPEN + "/faq");
  const src = await page.getByRole("img", { name: "HairCraft home" }).getAttribute("src");
  const width = Number(new URL(src!, OPEN).searchParams.get("w"));
  expect(width).toBeLessThanOrEqual(256);
});
