import { expect, test, type APIRequestContext, type Locator } from "@playwright/test";
import { API, API_DOWN, OPEN } from "../../playwright.config";

interface ApiCard {
  name: string;
  slug: string;
  onSale: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

/** What the API says, to compare the page against (the API is the source of truth). */
async function apiProducts(request: APIRequestContext, query: string): Promise<ApiCard[]> {
  const res = await request.get(`${API}/products?${query}`);
  return (await res.json()).data as ApiCard[];
}

/** The reviewed products the "Best rated" tab shows (highest first, at most four). */
async function apiBestRated(request: APIRequestContext) {
  return (await apiProducts(request, "sort=rating:desc&limit=16"))
    .filter((p) => p.reviewCount > 0)
    .slice(0, 4);
}

async function expectPhotosLoad(images: Locator, where: string) {
  const count = await images.count();
  expect(count, `photos in ${where}`).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        message: `photo ${i + 1} in ${where} loads`,
      })
      .toBe(true);
  }
}

test.describe("home page", () => {
  test("hero with a featured product photo and two ways in", async ({ page }) => {
    await page.goto(OPEN + "/");
    await expect(page).toHaveTitle("HairCraft — Human Hair Extensions, Toppers & Wigs in India");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Hair extensions, crafted for confidence",
    );
    await expect(page.getByRole("link", { name: "Shop all", exact: true }).first()).toHaveAttribute(
      "href",
      "/shop",
    );
    await expect(page.getByRole("link", { name: "Shop wigs" })).toHaveAttribute(
      "href",
      "/shop/wigs",
    );
    // Exactly one h1 on the page; sections use h2.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /100% human hair extensions in India/);
  });

  test("desktop: the 3D accent loads after the page and stays decorative", async ({ page }) => {
    await page.goto(OPEN + "/");
    const accent = page.getByTestId("hero-accent");
    await expect(accent).toHaveAttribute("data-active", "true", { timeout: 10_000 });
    await expect(accent.locator("canvas")).toHaveCount(1, { timeout: 10_000 });
    // Decorative only: hidden from screen readers, never in the way of clicks.
    await expect(accent).toHaveAttribute("aria-hidden", "true");
    await expect(accent).toHaveCSS("pointer-events", "none");
  });

  test("announcement bar and trust strip: read once, pause on hover", async ({ page }) => {
    await page.goto(OPEN + "/");
    const offers = page.getByRole("region", { name: "Offers" });
    await expect(offers).toContainText("Free shipping above ₹1,999");
    // Screen readers get each message once; the copies that make the loop are hidden.
    await expect(offers.getByRole("listitem")).toHaveCount(3);

    const trust = page.getByRole("region", { name: "Why customers choose HairCraft" });
    await expect(trust.getByRole("listitem")).toHaveCount(5);
    const track = trust.locator(".hc-marquee-track");
    await expect(track).toHaveCSS("animation-play-state", "running");
    await trust.hover();
    await expect(track).toHaveCSS("animation-play-state", "paused");
  });

  test("brand promises, with the free-shipping amount", async ({ page }) => {
    await page.goto(OPEN + "/");
    const promises = page.getByRole("region", { name: "Our promises" });
    for (const title of ["100% human hair", "Free shipping", "Secure payments", "Here to help"]) {
      await expect(promises.getByRole("heading", { name: title })).toBeVisible();
    }
    await expect(promises).toContainText("On orders above ₹1,999");
  });

  test("product and category photos actually load (not just image tags)", async ({ page }) => {
    await page.goto(OPEN + "/");
    for (const name of ["Shop by category", "Most loved hair extensions"]) {
      await expectPhotosLoad(page.getByRole("region", { name }).locator("img"), name);
    }
  });

  test("shop by category: every top-level category with a photo and a link", async ({ page }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Shop by category" });
    const cards = section.getByRole("link");
    await expect(cards).toHaveCount(4);
    for (const [name, slug] of [
      ["Clip-in Extensions", "clip-in-extensions"],
      ["Tape-in Extensions", "tape-in-extensions"],
      ["Wigs", "wigs"],
      ["Ponytails", "ponytails"],
    ]) {
      const card = section.getByRole("link", { name: new RegExp(`^${name}`) });
      await expect(card).toHaveAttribute("href", `/shop/${slug}`);
      await expect(card.locator("img")).toHaveCount(1);
    }
  });

  test("most loved: best rated first, then new arrivals, by mouse and keyboard", async ({
    page,
    request,
  }) => {
    const [rated, newest] = await Promise.all([
      apiBestRated(request),
      apiProducts(request, "sort=createdAt:desc&limit=8"),
    ]);
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Most loved hair extensions" });
    const names = () => section.getByRole("tabpanel").getByRole("heading", { level: 3 });
    await expect(section.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/shop");

    if (rated.length === 0) {
      // Nothing reviewed yet: no tabs, just the new arrivals.
      await expect(section.getByRole("tab")).toHaveCount(0);
      await expect(section.getByRole("heading", { level: 3 })).toHaveText(
        newest.map((p) => p.name),
      );
      return;
    }

    const ratedTab = section.getByRole("tab", { name: "Best rated" });
    const newTab = section.getByRole("tab", { name: "New arrivals" });
    await expect(ratedTab).toHaveAttribute("aria-selected", "true");
    await expect(names()).toHaveText(rated.map((p) => p.name));

    await newTab.click();
    await expect(newTab).toHaveAttribute("aria-selected", "true");
    await expect(names()).toHaveText(newest.map((p) => p.name));
    for (const product of newest) {
      const card = section.getByRole("link", { name: new RegExp(product.name) });
      await expect(card).toHaveAttribute("href", `/product/${product.slug}`);
      await expect(card.getByText("Sale", { exact: true })).toHaveCount(
        product.onSale && product.inStock ? 1 : 0,
      );
      await expect(card.getByText("Sold out", { exact: true })).toHaveCount(
        product.inStock ? 0 : 1,
      );
    }

    // Keyboard: arrows move between the tabs (and focus follows).
    await newTab.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(ratedTab).toHaveAttribute("aria-selected", "true");
    await expect(ratedTab).toBeFocused();
    await page.keyboard.press("End");
    await expect(newTab).toBeFocused();
    await expect(newTab).toHaveAttribute("tabindex", "0");
    await expect(ratedTab).toHaveAttribute("tabindex", "-1");
  });

  test("why HairCraft: four cards that stack while scrolling on desktop", async ({ page }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Why women choose HairCraft" });
    await expect(section.getByRole("heading", { level: 3 })).toHaveCount(4);
    const cards = section.locator("[data-why-card]");
    await expect(cards.first()).toHaveCSS("position", "sticky");
    await expectPhotosLoad(section.locator("img"), "Why HairCraft");
  });

  test("range explorer: pointing at a category shows it", async ({ page }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Explore our range" });
    const wigs = section.getByRole("button", { name: "Wigs" });
    await wigs.hover();
    await expect(wigs).toHaveAttribute("aria-pressed", "true");
    await expect(section.getByRole("link", { name: "Shop Wigs" })).toHaveAttribute(
      "href",
      "/shop/wigs",
    );
    // Keyboard reaches it too.
    const ponytails = section.getByRole("button", { name: "Ponytails" });
    await ponytails.focus();
    await expect(ponytails).toHaveAttribute("aria-pressed", "true");
    await expect(section.getByRole("link", { name: "Shop Ponytails" })).toBeVisible();
  });

  test("our story and testimonials (real reviews only)", async ({ page, request }) => {
    await page.goto(OPEN + "/");
    await expect(page.getByRole("heading", { name: /Crafted for the way you wear/ })).toBeVisible();
    const reviews = page.getByRole("region", { name: "Loved by women like you" });
    if ((await apiBestRated(request)).length === 0) {
      await expect(reviews).toHaveCount(0);
      return;
    }
    const quotes = reviews.locator("figure");
    const count = await quotes.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(6);
    // Each quote names its product, linked.
    await expect(quotes.first().getByRole("link")).toHaveAttribute("href", /^\/product\//);
  });

  test("FAQ: one answer open at a time, and described for search engines", async ({ page }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Frequently asked questions" });
    const questions = section.getByRole("button");
    await expect(questions).toHaveCount(6);
    await expect(questions.nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(section).toContainText("sulphate-free shampoo");

    await questions.nth(1).click();
    await expect(questions.nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(questions.nth(0)).toHaveAttribute("aria-expanded", "false");
    await expect(section.getByText("sulphate-free shampoo")).toHaveCount(0);
    await questions.nth(1).click();
    await expect(questions.nth(1)).toHaveAttribute("aria-expanded", "false");

    const jsonLd = await section.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(jsonLd ?? "{}");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(6);
  });

  test("with reduced motion: nothing moves, nothing sticks, no 3D", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(OPEN + "/");
    const track = page.getByRole("region", { name: "Offers" }).locator(".hc-marquee-track");
    await expect(track).toHaveCSS("animation-name", "none");
    await expect(
      page
        .getByRole("region", { name: "Why women choose HairCraft" })
        .locator("[data-why-card]")
        .first(),
    ).toHaveCSS("position", "static");
    // Give the accent its chance to load, then check it didn't.
    await page.waitForTimeout(3000);
    await expect(page.getByTestId("hero-accent")).toHaveAttribute("data-active", "false");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("when the API is down the hero and promises still show, with calm messages", async ({
    page,
  }) => {
    const response = await page.goto(API_DOWN + "/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Our promises" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Frequently asked questions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "We'll be right back" }).first()).toBeVisible();
    // Sections that need the catalogue simply don't appear.
    await expect(page.getByRole("region", { name: "Explore our range" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Loved by women like you" })).toHaveCount(0);
    await expect(page.getByRole("tab")).toHaveCount(0);
  });
});
