import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API, API_DOWN, OPEN } from "../../playwright.config";

/** The test servers run with PRODUCTS_PER_PAGE=2. */
const PER_PAGE = 2;

interface Suggestions {
  products: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
  didYouMean: string | null;
}

async function apiSuggest(request: APIRequestContext, q: string): Promise<Suggestions> {
  return (await (await request.get(`${API}/products/suggest?q=${encodeURIComponent(q)}`)).json())
    .data;
}

async function apiSearch(request: APIRequestContext, query: string) {
  const body = await (await request.get(`${API}/products?${query}&limit=${PER_PAGE}`)).json();
  return { names: (body.data as { name: string }[]).map((p) => p.name), total: body.meta.total };
}

const searchButton = (page: Page) =>
  page.getByRole("navigation", { name: "Account and cart" }).getByRole("link", { name: "Search" });
const box = (page: Page) => page.getByRole("combobox", { name: "Search the shop" });
const suggestions = (page: Page) => page.getByRole("listbox", { name: "Suggestions" });
const names = (page: Page) =>
  page.locator('section[aria-labelledby="results-count"]').getByRole("heading", { level: 3 });

async function openSearch(page: Page) {
  await searchButton(page).click();
  await expect(box(page)).toBeFocused();
}

test.describe("header search", () => {
  test("suggests categories and products while typing, with the words in bold", async ({
    page,
    request,
  }) => {
    const expected = await apiSuggest(request, "clip");
    expect(expected.products.length).toBeGreaterThan(0);
    await page.goto(OPEN + "/");
    await openSearch(page);
    await expect(searchButton(page)).toHaveAttribute("aria-expanded", "true");
    await box(page).fill("clip");
    const list = suggestions(page);
    await expect(list.getByRole("group", { name: "Products" }).getByRole("option")).toHaveCount(
      expected.products.length,
    );
    for (const product of expected.products)
      await expect(list.getByRole("option", { name: new RegExp(product.name) })).toBeVisible();
    for (const category of expected.categories)
      await expect(
        list
          .getByRole("group", { name: "Categories" })
          .getByRole("option", { name: category.name }),
      ).toBeVisible();
    await expect(list.locator("strong").first()).toHaveText(/clip/i);
    await expect(page.getByRole("status").filter({ hasText: "suggestions" })).toContainText(
      `${expected.products.length + expected.categories.length} suggestions`,
    );
    await expect(box(page)).toHaveAttribute("aria-expanded", "true");
  });

  test("keyboard: arrows choose, Enter opens, Escape closes and returns focus", async ({
    page,
    request,
  }) => {
    const expected = await apiSuggest(request, "clip");
    const first = expected.categories[0]
      ? `/shop/${expected.categories[0].slug}`
      : `/product/${expected.products[0].slug}`;
    await page.goto(OPEN + "/");
    await searchButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(box(page)).toBeFocused();
    await page.keyboard.type("clip");
    await expect(suggestions(page).getByRole("option").first()).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const activeId = await box(page).getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    await expect(page.locator(`[id="${activeId}"]`)).toHaveAttribute("aria-selected", "true");
    // Up from the first goes round to the last ("See all results").
    await page.keyboard.press("ArrowUp");
    await expect(
      suggestions(page).getByRole("option", { name: /See all results for/ }),
    ).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(OPEN + first);

    await openSearch(page);
    await page.keyboard.type("wig");
    await page.keyboard.press("Escape");
    await expect(box(page)).toHaveCount(0);
    await expect(searchButton(page)).toBeFocused();
  });

  test("Enter (or See all) shows the results page; a click outside closes the bar", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    await openSearch(page);
    await box(page).fill("body wave");
    await box(page).press("Enter");
    await expect(page).toHaveURL(OPEN + "/search?q=body%20wave");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Results for “body wave”");
    await expect(box(page)).toHaveCount(0);

    await openSearch(page);
    await box(page).fill("tape");
    await suggestions(page)
      .getByRole("option", { name: /See all results for/ })
      .click();
    await expect(page).toHaveURL(OPEN + "/search?q=tape");

    await openSearch(page);
    // A click outside the bar (at the bottom of the screen, below it) closes it.
    const { height } = page.viewportSize()!;
    await page.mouse.click(20, height - 20);
    await expect(box(page)).toHaveCount(0);
  });

  test("a misspelling: no suggestions, but a correction", async ({ page }) => {
    await page.goto(OPEN + "/");
    await openSearch(page);
    await box(page).fill("wigz");
    await expect(page.getByText("No suggestions for “wigz”")).toBeVisible();
    await page.getByRole("button", { name: "wig", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/search?q=wig");
  });

  test("the suggestions route needs at least two letters", async ({ request }) => {
    expect((await request.get(OPEN + "/bff/search/suggest?q=a")).status()).toBe(400);
    const ok = await request.get(OPEN + "/bff/search/suggest?q=wig");
    expect(ok.status()).toBe(200);
    expect((await ok.json()).data.products.length).toBeGreaterThan(0);
  });
});

test.describe("search results", () => {
  test("results match the API, by relevance, and aren't indexed", async ({ page, request }) => {
    const expected = await apiSearch(request, "search=clip in");
    await page.goto(OPEN + "/search?q=clip%20in");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Results for “clip in”");
    await expect(page.locator("#results-count")).toHaveText(
      `${expected.total} ${expected.total === 1 ? "product" : "products"}`,
    );
    await expect(names(page)).toHaveText(expected.names);
    await expect(page.getByLabel("Sort by")).toHaveValue("relevance");
    await expect(page.getByRole("searchbox", { name: "Search the shop" }).first()).toHaveValue(
      "clip in",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page).toHaveTitle("Search results for “clip in” | HairCraft");
  });

  test("filters, sort and Clear all work on results and keep the search", async ({
    page,
    request,
  }) => {
    await page.goto(OPEN + "/search?q=clip%20in");
    await page
      .getByRole("complementary", { name: "Filters" })
      .getByRole("checkbox", { name: "Natural Black" })
      .check();
    await expect(page).toHaveURL(OPEN + "/search?q=clip%20in&color=natural-black");
    const filtered = await apiSearch(request, "search=clip in&color=Natural Black");
    await expect(names(page)).toHaveText(filtered.names);

    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(OPEN + "/search?q=clip%20in&color=natural-black&sort=price-asc");
    const sorted = await apiSearch(request, "search=clip in&color=Natural Black&sort=price:asc");
    await expect(names(page)).toHaveText(sorted.names);

    await page
      .getByRole("group", { name: "Active filters" })
      .getByRole("link", { name: "Clear all" })
      .click();
    await expect(page).toHaveURL(OPEN + "/search?q=clip%20in&sort=price-asc");
  });

  test("no results: did you mean, tips, categories and products to try", async ({ page }) => {
    await page.goto(OPEN + "/search?q=wigz");
    await expect(page.getByRole("heading", { name: "No results for “wigz”" })).toBeVisible();
    // Nothing to filter or sort: no filter column, count or sort.
    await expect(page.getByRole("complementary", { name: "Filters" })).toHaveCount(0);
    await expect(page.getByLabel("Sort by")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Browse categories" }).getByRole("link"),
    ).not.toHaveCount(0);
    await expect(page.getByRole("heading", { name: "You might like" })).toBeVisible();
    await page.getByRole("link", { name: "wig", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/search?q=wig");
    await expect(names(page).first()).toBeVisible();
  });

  test("an empty search shows the box and categories; `?q=` is tidied away", async ({ page }) => {
    await page.goto(OPEN + "/search?q=%20%20");
    await expect(page).toHaveURL(OPEN + "/search");
    await expect(page.getByRole("heading", { name: "What are you looking for?" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search the shop" }).first().fill("ponytail");
    await page.getByRole("searchbox", { name: "Search the shop" }).first().press("Enter");
    await expect(page).toHaveURL(/\/search\?q=ponytail$/);
    await expect(names(page).first()).toHaveText(/Ponytail/);
  });

  test("a search on the shop's own lists is dropped", async ({ page }) => {
    await page.goto(OPEN + "/shop?q=wig");
    await expect(page).toHaveURL(OPEN + "/shop");
  });

  test("without JavaScript the search icon goes to the search page, which still searches", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(OPEN + "/");
    await searchButton(page).click();
    await expect(page).toHaveURL(OPEN + "/search");
    await page.getByRole("searchbox", { name: "Search the shop" }).fill("clip in");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(OPEN + "/search?q=clip+in");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Results for “clip in”");
    await context.close();
  });

  test("with the API down the box still searches, and the results page stays calm", async ({
    page,
  }) => {
    await page.goto(API_DOWN + "/");
    await openSearch(page);
    await box(page).fill("wig");
    // No suggestions can come, but Enter still searches.
    await page.waitForTimeout(800);
    await expect(suggestions(page)).toBeHidden();
    await box(page).press("Enter");
    await expect(page).toHaveURL(API_DOWN + "/search?q=wig");
    await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
  });
});
