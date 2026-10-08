import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API, API_DOWN, CLOSED, OPEN } from "../../playwright.config";

/** The test servers run with PRODUCTS_PER_PAGE=2, so today's 6 products make 3 pages. */
const PER_PAGE = 2;

/** What the API returns for a query: the source of truth to compare the page against. */
async function api(request: APIRequestContext, query: string, page = 1) {
  const res = await request.get(`${API}/products?${query}&limit=${PER_PAGE}&page=${page}`);
  const body = await res.json();
  return {
    names: (body.data as { name: string }[]).map((p) => p.name),
    total: body.meta.total as number,
    totalPages: body.meta.totalPages as number,
  };
}

const results = (page: Page) => page.locator('section[aria-labelledby="results-count"]');
const names = (page: Page) => results(page).getByRole("heading", { level: 3 });
const filters = (page: Page) => page.getByRole("complementary", { name: "Filters" });
const count = (total: number) => `${total} ${total === 1 ? "product" : "products"}`;

async function expectMatchesApi(page: Page, request: APIRequestContext, query: string, pageNo = 1) {
  const expected = await api(request, query, pageNo);
  await expect(page.locator("#results-count")).toHaveText(count(expected.total));
  await expect(names(page)).toHaveText(expected.names);
}

test.describe("shop listing", () => {
  test("/shop: every product, newest first, with heading, breadcrumbs and search-engine details", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/shop");
    await expect(page).toHaveTitle("Shop 100% Human Hair Extensions, Toppers & Wigs | HairCraft");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shop all");
    await expectMatchesApi(page, request, "sort=createdAt:desc");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/shop$/);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    const data = JSON.parse((await crumbs.locator("script").textContent()) ?? "{}");
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Shop"]);
  });

  test("categories: only their products; sub-category chips; unknown → not found", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/shop/clip-in-extensions");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Clip-in Extensions");
    await expect(page).toHaveTitle(/^Human Hair Clip-in Extensions in India \| HairCraft$/);
    await expectMatchesApi(page, request, "category=clip-in-extensions");
    const types = page.getByRole("navigation", { name: "Clip-in Extensions types" });
    await expect(types.getByRole("link", { name: "All Clip-in Extensions" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await types.getByRole("link", { name: "Seamless Clip-ins" }).click();
    await expect(page).toHaveURL(OPEN + "/shop/seamless-clip-ins");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seamless Clip-ins");
    await expectMatchesApi(page, request, "category=seamless-clip-ins");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
      "Clip-in Extensions",
    );

    await page.goto(OPEN + "/shop/no-such-category");
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
    // One header and offers bar, not two (the layout's and the 404's own).
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Offers" })).toHaveCount(1);
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });

  test("a tick applies at once, keeps keyboard focus, and never flashes the loading skeleton", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/shop");
    // Record any loading skeleton that appears from now on.
    await page.evaluate(() => {
      (window as unknown as { skeleton: boolean }).skeleton = false;
      new MutationObserver(() => {
        if (document.querySelector('main [aria-busy="true"][aria-live]'))
          (window as unknown as { skeleton: boolean }).skeleton = true;
      }).observe(document.body, { childList: true, subtree: true });
    });
    const black = filters(page).getByRole("checkbox", { name: "Natural Black" });
    await black.focus();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(OPEN + "/shop?color=natural-black");
    await expectMatchesApi(page, request, "color=Natural Black");
    await expect(black).toBeChecked();
    await expect(black).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { skeleton: boolean }).skeleton)).toBe(
      false,
    );

    // A second filter combines with the first.
    await filters(page).getByRole("checkbox", { name: "Body Wave" }).check();
    await expect(page).toHaveURL(OPEN + "/shop?color=natural-black&texture=body-wave");
    await expectMatchesApi(page, request, "color=Natural Black&texture=Body Wave");
  });

  test("chips remove one filter each; Clear all removes them all and keeps the sort", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/shop?length=18&color=natural-black&instock=1&sort=price-asc");
    const chips = page.getByRole("group", { name: "Active filters" });
    await expect(chips.getByRole("link", { name: /^Remove / })).toHaveCount(3);
    await chips.getByRole("link", { name: "Remove Colour: Natural Black" }).click();
    await expect(page).toHaveURL(OPEN + "/shop?length=18&instock=1&sort=price-asc");
    await expectMatchesApi(page, request, "length=18&inStock=true&sort=price:asc");
    await chips.getByRole("link", { name: "Clear all" }).click();
    await expect(page).toHaveURL(OPEN + "/shop?sort=price-asc");
    await expect(chips).toHaveCount(0);
    await expectMatchesApi(page, request, "sort=price:asc");
  });

  test("price: bands and from/to boxes", async ({ page, request }) => {
    const options = (await (await request.get(`${API}/products/filters`)).json()).data;
    expect(options.price).not.toBeNull();
    await page.goto(OPEN + "/shop");
    const price = filters(page).getByRole("group", { name: "Price" });
    const firstBand = price.getByRole("button").first();
    const label = (await firstBand.textContent()) ?? "";
    const upTo = Number(label.replace(/[^\d]/g, ""));
    await firstBand.click();
    await expect(firstBand).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(`${OPEN}/shop?max=${upTo}`);
    await expectMatchesApi(page, request, `maxPrice=${upTo}`);

    await price.getByLabel("From (₹)").fill("5000");
    await price.getByLabel("To (₹)").fill("7000");
    await price.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(OPEN + "/shop?min=5000&max=7000");
    await expectMatchesApi(page, request, "minPrice=5000&maxPrice=7000");
    await expect(page.getByRole("link", { name: "Remove Price: ₹5,000 – ₹7,000" })).toBeVisible();
  });

  test("in stock only", async ({ page, request }) => {
    await page.goto(OPEN + "/shop");
    await filters(page).getByRole("checkbox", { name: "In stock only" }).check();
    await expect(page).toHaveURL(OPEN + "/shop?instock=1");
    await expectMatchesApi(page, request, "inStock=true");
  });

  test("every sort order matches the API", async ({ page, request }) => {
    await page.goto(OPEN + "/shop");
    const sort = page.getByLabel("Sort by");
    for (const [key, api] of [
      ["price-asc", "price:asc"],
      ["price-desc", "price:desc"],
      ["rating", "rating:desc"],
      ["name", "name:asc"],
    ]) {
      await sort.selectOption(key);
      await expect(page).toHaveURL(`${OPEN}/shop?sort=${key}`);
      await expectMatchesApi(page, request, `sort=${api}`);
    }
    await sort.selectOption("newest");
    await expect(page).toHaveURL(OPEN + "/shop");
  });

  test("pages: numbers, Previous/Next, past the end, and their own canonical address", async ({
    page,
    request,
  }) => {
    const { totalPages } = await api(request, "sort=createdAt:desc");
    expect(totalPages).toBeGreaterThanOrEqual(3);
    await page.goto(OPEN + "/shop");
    const pages = page.getByRole("navigation", { name: "Pages" });
    await expect(pages.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await pages.getByRole("link", { name: "Next ›" }).click();
    await expect(page).toHaveURL(OPEN + "/shop?page=2");
    await expectMatchesApi(page, request, "sort=createdAt:desc", 2);
    await pages.getByRole("link", { name: "‹ Previous" }).click();
    await expect(page).toHaveURL(OPEN + "/shop");

    // Search engines load each page fresh: page 2 names itself as its canonical address.
    // (After in-browser navigation Next leaves the first page's canonical tag in place; crawlers never see that.)
    const fresh = await page.request.get(OPEN + "/shop?page=2");
    expect(await fresh.text()).toMatch(/<link rel="canonical" href="[^"]*\/shop\?page=2"/);
    await page.goto(OPEN + "/shop?page=2");
    await pages.getByRole("link", { name: "‹ Previous" }).click();
    await expect(page).toHaveURL(OPEN + "/shop");

    // A page past the end shows the last page.
    await page.goto(OPEN + "/shop?page=99");
    await expect(page).toHaveURL(`${OPEN}/shop?page=${totalPages}`);
    await expect(pages.getByRole("link", { name: `Page ${totalPages}` })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("Back and Forward step through filter changes; a shared address shows the same view", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/shop");
    await filters(page).getByRole("checkbox", { name: "18 inch" }).check();
    await expect(page).toHaveURL(OPEN + "/shop?length=18");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(OPEN + "/shop?length=18&sort=price-asc");
    await page.goBack();
    await expect(page).toHaveURL(OPEN + "/shop?length=18");
    await expect(filters(page).getByRole("checkbox", { name: "18 inch" })).toBeChecked();
    await expect(page.getByLabel("Sort by")).toHaveValue("newest");
    await page.goBack();
    await expect(page).toHaveURL(OPEN + "/shop");
    await expect(filters(page).getByRole("checkbox", { name: "18 inch" })).not.toBeChecked();
    await page.goForward();
    await expect(page).toHaveURL(OPEN + "/shop?length=18");

    const shared = await page.context().newPage();
    await shared.goto(OPEN + "/shop?length=18");
    await expectMatchesApi(shared, request, "length=18");
  });

  test("untidy or unknown address values are tidied, never an error", async ({ page }) => {
    await page.goto(OPEN + "/shop?length=18&length=99&min=&color=purple&sort=cheapest&page=1");
    await expect(page).toHaveURL(OPEN + "/shop?length=18");
    await page.goto(OPEN + "/shop?page=1");
    await expect(page).toHaveURL(OPEN + "/shop");
  });

  test("no matches: a clear message with a way back", async ({ page }) => {
    await page.goto(OPEN + "/shop/wigs?min=500000");
    await expect(
      page.getByRole("heading", { name: "No products match these filters" }),
    ).toBeVisible();
    await expect(page.locator("#results-count")).toHaveText("0 products");
    await page.getByRole("link", { name: "Clear all filters" }).click();
    await expect(page).toHaveURL(OPEN + "/shop/wigs");
    await expect(names(page).first()).toBeVisible();
  });

  test("filtered views are not indexed by search engines", async ({ page }) => {
    await page.goto(OPEN + "/shop?length=18");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/shop$/);
  });

  test("without JavaScript the filters and sort still work as forms", async ({
    browser,
    request,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(OPEN + "/shop");
    await filters(page).getByRole("checkbox", { name: "Natural Black" }).check();
    await filters(page).getByRole("checkbox", { name: "18 inch" }).check();
    await filters(page).getByRole("button", { name: "Apply filters" }).click();
    // The plain form's address is tidied by the server.
    await expect(page).toHaveURL(OPEN + "/shop?length=18&color=natural-black");
    await expectMatchesApi(page, request, "length=18&color=Natural Black");
    await page.getByLabel("Sort by").selectOption("name");
    await page.getByRole("button", { name: "Sort" }).click();
    await expect(page).toHaveURL(OPEN + "/shop?length=18&color=natural-black&sort=name");
    await context.close();
  });

  test("when the API is down: a calm message, not an error page", async ({ page }) => {
    for (const path of ["/shop", "/shop/wigs"]) {
      const response = await page.goto(API_DOWN + path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
    }
  });

  test("the sitemap lists the shop and its categories only while the shop is open", async ({
    request,
  }) => {
    const open = await (await request.get(OPEN + "/sitemap.xml")).text();
    expect(open).toContain(`${OPEN}/shop</loc>`);
    expect(open).toContain(`${OPEN}/shop/wigs</loc>`);
    expect(open).toContain(`${OPEN}/shop/seamless-clip-ins</loc>`);
    const closed = await (await request.get(CLOSED + "/sitemap.xml")).text();
    expect(closed).not.toContain("/shop");
  });
});

test.describe("shop listing status codes", () => {
  test("an unknown category is a real 404, and untidy addresses a real redirect", async ({
    request,
  }) => {
    expect((await request.get(OPEN + "/shop/no-such-category")).status()).toBe(404);
    const untidy = await request.get(OPEN + "/shop?length=18&length=20", { maxRedirects: 0 });
    expect(untidy.status()).toBe(307);
    expect(untidy.headers().location).toBe("/shop?length=18,20");
  });
});
