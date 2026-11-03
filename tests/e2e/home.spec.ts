import { expect, test, type APIRequestContext, type Locator } from "@playwright/test";
import { API, API_DOWN, OPEN } from "../../playwright.config";
import { adminToken, auth, CLIP_INS, product } from "./support/shop";

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
  // Sections stream in after the page: wait for the first photo before counting.
  await expect(images.first(), `photos in ${where}`).toBeAttached({ timeout: 15_000 });
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
  test("hero banner: the wide photo, the words on the right, no button", async ({ page }) => {
    await page.goto(OPEN + "/");
    await expect(page).toHaveTitle("HairCraft — Human Hair Extensions, Toppers & Wigs in India");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("Crafted for Pure Confidence.");
    await expect(page.getByText("The Art of Bespoke Hair")).toBeVisible();
    // No button in the hero (owner, 2026-11-03).
    await expect(page.locator("section.hc-shutter a")).toHaveCount(0);
    // "Pure Confidence." in the older elegant italic; the words under it in the older sans.
    const italic = heading.locator("em");
    await expect(italic).toHaveText("Pure Confidence.");
    expect(await italic.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(
      /Cormorant.?Garamond/,
    );
    expect(
      await page
        .getByText(/^100% ethically sourced Indian Remy hair extensions/)
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toMatch(/Geist/);
    // The owner's wide photo, across the whole width, with nothing over its left half.
    const photo = page.locator('img[src*="%2Fimages%2Fhome%2Fhero-banner.webp"]');
    await expect(photo).toHaveCount(1);
    const box = await photo.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual((page.viewportSize()?.width ?? 0) - 1);
    const words = await heading.boundingBox();
    expect(words!.x).toBeGreaterThan(box!.width / 2);
    // The shutter: the hero stays put while the rest of the page slides up over it.
    const hero = page.locator("section.hc-shutter");
    await expect(hero).toHaveCSS("position", "sticky");
    const panelTop = async () =>
      (await page.getByRole("region", { name: /Concerns|What would you like/ }).boundingBox())!.y;
    const before = await panelTop();
    await page.mouse.wheel(0, 300);
    await expect.poll(panelTop).toBeLessThan(before - 200);
    await expect.poll(async () => (await hero.boundingBox())!.y).toBeLessThanOrEqual(1);
    // Exactly one h1 on the page; sections use h2.
    await expect(heading).toHaveCount(1);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /100% human hair extensions in India/);
  });

  test("announcement bar, with the free-shipping amount", async ({ page }) => {
    await page.goto(OPEN + "/");
    const offers = page.getByRole("region", { name: "Offers" });
    await expect(offers).toContainText("Free shipping above ₹1,999");
    await expect(offers.getByRole("listitem")).toHaveCount(4);
    // Still: no scrolling marquee any more.
    await expect(offers.locator(".hc-marquee-track")).toHaveCount(0);
  });

  test("shop by concern: each card opens its page, with a photo", async ({ page }) => {
    await page.goto(OPEN + "/");
    // "Find your match" is gone (owner, 2026-11-03).
    await expect(page.getByRole("region", { name: /Find your hair extension match/ })).toHaveCount(
      0,
    );
    const section = page.getByRole("region", { name: "What would you like to change?" });
    // The test shop has clip-ins, wigs and ponytails (no toppers).
    for (const [concern, slug] of [
      ["Want more length", "want-more-length"],
      ["Hair loss or full coverage", "hair-loss-or-full-coverage"],
      ["Instant volume for an occasion", "instant-volume-for-an-occasion"],
    ]) {
      const card = section.getByRole("link", { name: new RegExp(`^${concern}`) });
      await expect(card).toHaveAttribute("href", `/concern/${slug}`);
      await expect(card.locator("img")).toHaveCount(1);
      await expect(card).toContainText("Shop now");
    }
    await expect(section.getByRole("link")).toHaveCount(3);
  });

  test("a concern page lists the products of all its categories, with filters", async ({
    page,
    request,
  }) => {
    // Lists are cached briefly: allow for the refresh.
    test.setTimeout(180_000);
    const token = await adminToken(request);
    const headers = auth(token);
    const concerns = (await (await request.get(`${API}/admin/concerns`, { headers })).json())
      .data as { id: string; title: string; version: number; categories: { id: string }[] }[];
    const length = concerns.find((c) => c.title === "Want more length")!;
    const categories = (await (await request.get(`${API}/admin/categories`, { headers })).json())
      .data as { id: string; slug: string }[];
    const wigs = categories.find((c) => c.slug === "wigs")!;
    const setCategories = async (ids: string[]) => {
      const current = (
        await (await request.get(`${API}/admin/concerns/${length.id}`, { headers })).json()
      ).data as { version: number };
      const res = await request.patch(`${API}/admin/concerns/${length.id}`, {
        headers,
        data: { version: current.version, categoryIds: ids },
      });
      expect(res.status()).toBe(200);
    };
    const original = length.categories.map((c) => c.id);
    const [clipIns, wigList] = await Promise.all([
      (await request.get(`${API}/products?category=clip-in-extensions&limit=50`)).json(),
      (await request.get(`${API}/products?category=wigs&limit=50`)).json(),
    ]);
    const expected = clipIns.meta.total + wigList.meta.total;

    await setCategories([...original, wigs.id]);
    try {
      await expect(async () => {
        await page.goto(OPEN + "/concern/want-more-length");
        await expect(page.getByText(`${expected} products`)).toBeVisible({ timeout: 1000 });
        // The concern itself refreshes in the background too: its category links follow.
        await expect(
          page
            .getByRole("navigation", { name: "Want more length: categories" })
            .getByRole("link", { name: "Wigs" }),
        ).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 90_000 });
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Want more length");
      const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
      await expect(crumbs).toContainText("Shop by concern");
      // Its categories, each a link to that category alone.
      const links = page.getByRole("navigation", { name: "Want more length: categories" });
      await expect(links.getByRole("link", { name: "Wigs" })).toHaveAttribute("href", "/shop/wigs");
      // Sort works as on a category page, with a tidy address.
      await page.goto(OPEN + "/concern/want-more-length?sort=price-asc");
      await expect(page).toHaveURL(/\/concern\/want-more-length/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        /\/concern\/want-more-length$/,
      );
    } finally {
      await setCategories(original);
    }
    // An unknown or hidden concern has no page.
    const missing = await page.goto(OPEN + "/concern/no-such-concern");
    expect(missing?.status()).toBe(404);
  });

  test("product and category photos actually load (not just image tags)", async ({ page }) => {
    await page.goto(OPEN + "/");
    for (const name of ["Shop by category", "Customer favourites"]) {
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
    const section = page.getByRole("region", { name: "Customer favourites" });
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

  test("sections in the owner's order: concern, best sellers (if any), categories, favourites", async ({
    page,
  }) => {
    await page.goto(OPEN + "/");
    const order = await page
      .locator("main section[aria-labelledby]")
      .evaluateAll((sections) => sections.map((el) => el.getAttribute("aria-labelledby")));
    const known = order.filter((id) =>
      ["concerns-heading", "bestsellers-heading", "categories-heading", "loved-heading"].includes(
        id ?? "",
      ),
    );
    expect(known.filter((id) => id !== "bestsellers-heading")).toEqual([
      "concerns-heading",
      "categories-heading",
      "loved-heading",
    ]);
    if (known.includes("bestsellers-heading")) expect(known[1]).toBe("bestsellers-heading");
  });

  test("shop by concern follows the admin: its heading, and a hidden concern disappears", async ({
    page,
    request,
  }) => {
    // The shop's lists are cached briefly: allow for the refresh.
    test.setTimeout(180_000);
    const token = await adminToken(request);
    const headers = auth(token);
    const concerns = (await (await request.get(`${API}/admin/concerns`, { headers })).json())
      .data as { id: string; title: string; isActive: boolean; version: number }[];
    const wigs = concerns.find((c) => c.title === "Hair loss or full coverage")!;
    const section = (await (await request.get(`${API}/admin/concerns/section`, { headers })).json())
      .data as { heading: string; intro: string };
    const setActive = async (isActive: boolean) => {
      const current = (
        await (await request.get(`${API}/admin/concerns/${wigs.id}`, { headers })).json()
      ).data as { version: number };
      const res = await request.patch(`${API}/admin/concerns/${wigs.id}`, {
        headers,
        data: { version: current.version, isActive },
      });
      expect(res.status()).toBe(200);
    };
    const region = page.getByRole("region", { name: "Your hair, your way" });

    await request.put(`${API}/admin/concerns/section`, {
      headers,
      data: { heading: "Your hair, your way", intro: "" },
    });
    await setActive(false);
    try {
      await expect(async () => {
        await page.goto(OPEN + "/");
        await expect(region).toBeVisible({ timeout: 1000 });
        await expect(region.getByRole("link", { name: /^Hair loss or full coverage/ })).toHaveCount(
          0,
          { timeout: 1000 },
        );
      }).toPass({ timeout: 90_000 });
      await expect(region.getByRole("link")).toHaveCount(2);
    } finally {
      await setActive(true);
      await request.put(`${API}/admin/concerns/section`, { headers, data: section });
    }
  });

  test("best sellers: the products ticked in the admin, with a badge; hidden when none", async ({
    page,
    request,
  }) => {
    // Lists are cached for about a minute: allow for the refresh.
    test.setTimeout(180_000);
    const token = await adminToken(request);
    const { id, name } = await product(request, CLIP_INS);
    const tick = async (bestSeller: boolean) => {
      const current = await (
        await request.get(`${API}/admin/products/${id}`, { headers: auth(token) })
      ).json();
      const res = await request.patch(`${API}/admin/products/${id}`, {
        headers: auth(token),
        data: { version: current.data.version, bestSeller },
      });
      expect(res.status()).toBe(200);
    };
    const section = page.getByRole("region", { name: "Our best sellers" });
    await tick(true);
    try {
      await expect(async () => {
        await page.goto(OPEN + "/");
        await expect(section).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 90_000 });
      const card = section.getByRole("link", { name: new RegExp(name) });
      await expect(card).toHaveAttribute("href", `/product/${CLIP_INS}`);
      await expect(card.getByText("Best seller", { exact: true })).toBeVisible();
    } finally {
      await tick(false);
    }
    await expect(async () => {
      await page.goto(OPEN + "/");
      await expect(section).toHaveCount(0, { timeout: 1000 });
    }).toPass({ timeout: 90_000 });
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

  test("when the API is down the hero and FAQ still show, with calm messages", async ({ page }) => {
    const response = await page.goto(API_DOWN + "/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Frequently asked questions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "We'll be right back" }).first()).toBeVisible();
    // Sections that need the catalogue simply don't appear.
    await expect(page.getByRole("region", { name: "What would you like to change?" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("region", { name: "Our best sellers" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Loved by women like you" })).toHaveCount(0);
    await expect(page.getByRole("tab")).toHaveCount(0);
  });
});
