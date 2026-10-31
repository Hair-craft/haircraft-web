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
  test("hero with its fixed photo, two ways in and a real product", async ({ page }) => {
    await page.goto(OPEN + "/");
    await expect(page).toHaveTitle("HairCraft — Human Hair Extensions, Toppers & Wigs in India");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Hair extensions, crafted for confidence.",
    );
    await expect(page.getByRole("link", { name: /^Shop the collection/ })).toHaveAttribute(
      "href",
      "/shop",
    );
    await expect(page.getByRole("link", { name: /Find my match/ })).toHaveAttribute(
      "href",
      "#match",
    );
    await expect(page.locator('img[src*="%2Fimages%2Fhome%2Fhero.webp"]')).toHaveCount(1);
    // The floating card links to a real product.
    await expect(page.getByRole("link", { name: /Quick view/ })).toHaveAttribute(
      "href",
      /^\/product\//,
    );
    // Exactly one h1 on the page; sections use h2.
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /100% human hair extensions in India/);
  });

  test("announcement bar and hero badges, with the free-shipping amount", async ({ page }) => {
    await page.goto(OPEN + "/");
    const offers = page.getByRole("region", { name: "Offers" });
    await expect(offers).toContainText("Free shipping above ₹1,999");
    await expect(offers.getByRole("listitem")).toHaveCount(4);
    // Still: no scrolling marquee any more.
    await expect(offers.locator(".hc-marquee-track")).toHaveCount(0);
    for (const text of ["100% human hair", "On orders ₹1,999+", "UPI, cards & net banking"]) {
      await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
    }
  });

  test("find your match: a real product for the choices, and a link to all matches", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: /Find your hair extension match/ });
    const panel = section.getByTestId("match-panel");
    // The first goal is chosen to start with, and its best product shows.
    await expect(section.getByRole("button", { pressed: true })).toHaveCount(1);
    await expect(panel.getByRole("link", { name: "View this match" })).toHaveAttribute(
      "href",
      /^\/product\//,
    );

    await section.getByRole("button", { name: "Wigs", exact: true }).click();
    await expect(section.getByRole("button", { name: "Wigs", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(panel).toHaveAttribute("aria-busy", "false");
    await expect(panel.getByRole("link", { name: "View this match" })).toHaveAttribute(
      "href",
      /^\/product\//,
    );
    const all = panel.getByRole("link", { name: /^See all \d+ matches$/ });
    if ((await all.count()) > 0) await expect(all).toHaveAttribute("href", /^\/shop\/wigs/);
  });

  test("product and category photos actually load (not just image tags)", async ({ page }) => {
    await page.goto(OPEN + "/");
    for (const name of ["Shop by category", "Bestsellers & customer favourites"]) {
      await expectPhotosLoad(page.getByRole("region", { name }).locator("img"), name);
    }
  });

  test("shop by category: every top-level category with a photo and a link", async ({ page }) => {
    await page.goto(OPEN + "/");
    const section = page.getByRole("region", { name: "Shop by category" });
    const cards = section.getByRole("listitem").getByRole("link");
    await expect(cards).toHaveCount(4);
    await expect(section.getByRole("link", { name: "View all products" })).toHaveAttribute(
      "href",
      "/shop",
    );
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
    const section = page.getByRole("region", { name: "Bestsellers & customer favourites" });
    const names = () => section.getByRole("tabpanel").getByRole("heading", { level: 3 });
    await expect(section.getByRole("link", { name: "View all products" })).toHaveAttribute(
      "href",
      "/shop",
    );

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

  test("why HairCraft: four cards, WhatsApp advice, and our story", async ({ page }) => {
    await page.goto(OPEN + "/");
    const why = page.getByRole("region", { name: "Why women choose HairCraft" });
    await expect(why.getByRole("heading", { level: 3 })).toHaveCount(4);
    const consult = page.getByRole("region", { name: "Unsure about your shade or length?" });
    await expect(consult.getByRole("link", { name: /Chat on WhatsApp/ })).toHaveAttribute(
      "href",
      /^https:\/\/(wa\.me|api\.whatsapp\.com)\//,
    );
    const story = page.getByRole("region", { name: /Crafted for the way you wear/ });
    await expect(story.locator('img[src*="%2Fimages%2Fhome%2Fstory.webp"]')).toHaveCount(1);
    // The exchange note says what the policy really is.
    await expect(story.getByRole("link", { name: /Exchange for defective items/ })).toHaveAttribute(
      "href",
      "/returns",
    );
  });

  test("review spotlight: one real review, or nothing", async ({ page, request }) => {
    await page.goto(OPEN + "/");
    const reviews = page.getByRole("region", { name: "Loved by women like you" });
    if ((await apiBestRated(request)).length === 0) {
      await expect(reviews).toHaveCount(0);
      return;
    }
    await expect(reviews.locator("figure")).toHaveCount(1);
    await expect(reviews.getByRole("link", { name: /Shop this look/ })).toHaveAttribute(
      "href",
      /^\/product\//,
    );
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

  test("with reduced motion: the hero doesn't animate", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(OPEN + "/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("animation-name", "none");
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("when the API is down the hero, badges and FAQ still show, with calm messages", async ({
    page,
  }) => {
    const response = await page.goto(API_DOWN + "/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("On orders ₹1,999+")).toBeVisible();
    await expect(page.getByRole("region", { name: "Frequently asked questions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "We'll be right back" }).first()).toBeVisible();
    // Sections that need the catalogue simply don't appear.
    await expect(page.getByRole("region", { name: /Find your hair extension match/ })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: /Quick view/ })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Loved by women like you" })).toHaveCount(0);
    await expect(page.getByRole("tab")).toHaveCount(0);
  });
});
