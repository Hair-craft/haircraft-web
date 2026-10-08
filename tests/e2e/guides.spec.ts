import { expect, test } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";
import { CLIP_INS } from "./support/shop";

const GUIDE = "/guides/hair-toppers-for-thinning-hair";

test("the guides page lists every guide, and each opens", async ({ page }) => {
  await page.goto(OPEN + "/guides");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hair guides");
  const cards = page.locator("main").getByRole("link", { name: /min read/ });
  await expect(cards).toHaveCount(5);
  await page.getByRole("link", { name: /Hair toppers for thinning hair/ }).click();
  await expect(page).toHaveURL(OPEN + GUIDE);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hair toppers for thinning hair: a complete guide for women",
  );
});

test("a guide has its contents, Shop the look, and is an Article for Google", async ({ page }) => {
  await page.goto(OPEN + GUIDE);
  await expect(page.getByText(/^Hair guide · \d+ min read$/)).toBeVisible();
  await page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("link", { name: "Choosing the base" })
    .click();
  await expect(page).toHaveURL(/#base$/);
  const shop = page.getByRole("complementary", { name: "Shop the look" });
  await expect(shop.getByRole("link", { name: "Hair toppers" })).toHaveAttribute(
    "href",
    "/shop/toppers-on-head",
  );
  await expect(page.getByRole("heading", { name: "Keep reading" })).toBeVisible();

  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => JSON.parse(el.textContent ?? "{}")));
  const article = blocks.flat().find((d) => d["@type"] === "Article");
  expect(article).toMatchObject({ headline: expect.stringContaining("Hair toppers") });
  expect(await page.locator('meta[property="og:type"]').getAttribute("content")).toBe("article");
  // Its own share image.
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toContain("/guides/hair-toppers-for-thinning-hair/opengraph-image");
  expect((await page.request.get(image!)).headers()["content-type"]).toBe("image/png");
});

test("an unknown guide is not found", async ({ page }) => {
  const response = await page.goto(OPEN + "/guides/no-such-guide");
  expect(response?.status()).toBe(404);
});

test("a category's first page shows its buying guide; its sub-category shows the parent's", async ({
  page,
}) => {
  await page.goto(OPEN + "/shop/clip-in-extensions");
  const guide = page.getByRole("region", { name: "Buying guide: clip-in hair extensions" });
  await expect(guide).toBeVisible();
  const question = guide.locator("details", { hasText: "Will clip-ins damage my hair?" });
  await question.locator("summary").click();
  await expect(question).toHaveAttribute("open", "");
  await expect(guide.getByRole("link", { name: /How to choose hair extensions/ })).toBeVisible();

  // Page 2 doesn't repeat it (the test shop shows 2 products a page).
  await page.goto(OPEN + "/shop?page=2");
  await expect(page.getByRole("region", { name: /^Buying guide/ })).toHaveCount(0);

  await page.goto(OPEN + "/shop/seamless-clip-ins");
  await expect(
    page.getByRole("region", { name: "Buying guide: clip-in hair extensions" }),
  ).toBeVisible();
});

test("titles and descriptions use the words people search for", async ({ page, request }) => {
  await page.goto(OPEN + "/");
  await expect(page).toHaveTitle("HairCraft — Human Hair Extensions, Toppers & Wigs in India");

  await page.goto(OPEN + "/shop/clip-in-extensions");
  await expect(page).toHaveTitle("Human Hair Clip-in Extensions in India | HairCraft");
  const categoryDescription = await page
    .locator('meta[name="description"]')
    .getAttribute("content");
  expect(categoryDescription!.length).toBeLessThanOrEqual(160);

  const product = (await (await request.get(`${API}/products/${CLIP_INS}`)).json()).data;
  await page.goto(`${OPEN}/product/${CLIP_INS}`);
  await expect(page).toHaveTitle(new RegExp(`^${product.name} — Human Hair`));
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toMatch(/100% human hair, (from )?₹[\d,]+\./);
  expect(description!.length).toBeLessThanOrEqual(160);
});

test("internal links: footer categories and guides, product guides, FAQ to guides", async ({
  page,
}) => {
  await page.goto(OPEN + "/faq");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Hair guides" })).toHaveAttribute(
    "href",
    "/guides",
  );
  await expect(footer.getByRole("link", { name: "Clip-in Extensions" })).toHaveAttribute(
    "href",
    "/shop/clip-in-extensions",
  );
  await expect(page.locator("main").getByRole("link", { name: "hair guides" })).toHaveAttribute(
    "href",
    "/guides",
  );

  await page.goto(`${OPEN}/product/${CLIP_INS}`);
  const helpful = page.getByRole("region", { name: "Helpful guides" });
  await expect(helpful.getByRole("link")).not.toHaveCount(0);
});

test("the sitemap lists the guides", async ({ request }) => {
  const xml = await (await request.get(OPEN + "/sitemap.xml")).text();
  expect(xml).toContain(`<loc>${OPEN}/guides</loc>`);
  expect(xml).toContain(`<loc>${OPEN}${GUIDE}</loc>`);
});
