import { expect, test, type APIRequestContext } from "@playwright/test";
import type { Category, PublicProduct } from "@/lib/api/types";
import { API, OPEN } from "../../playwright.config";
import { expectAccessible } from "./support/a11y";
import { solidPng } from "./support/png";
import {
  adminToken,
  auth,
  CLIP_INS,
  placeOrderByApi,
  product,
  shopper,
  signIn,
} from "./support/shop";

/**
 * Sub-variants and Size from the admin to the shop, the shop refreshing at
 * once after admin changes, and Buy again going straight to checkout.
 *
 * Each test makes its own topper (deleted afterwards): main variants Natural
 * Black (with sub-variants 13 × 15 cm at ₹4,999 and 15 × 16 cm at ₹5,999)
 * and Brown (none, ₹4,500).
 */

interface Made {
  id: string;
  slug: string;
  name: string;
  sku: (suffix: string) => string;
}

async function makeTopper(request: APIRequestContext): Promise<Made> {
  const token = await adminToken(request);
  const headers = auth(token);
  const tag = `E2E${Date.now().toString(36).toUpperCase()}`;
  const sku = (suffix: string) => `${tag}-${suffix}`;
  const categories = (await (await request.get(`${API}/categories`)).json()).data as Category[];
  const name = `Test Silk Topper ${tag}`;
  const created = await request.post(`${API}/admin/products`, {
    headers,
    data: {
      name,
      description: "A topper made by an end-to-end test.",
      categoryIds: [categories[0].id],
      variants: [
        { sku: sku("NB"), price: "4000", color: "Natural Black", initialStock: 0 },
        { sku: sku("BR"), price: "4500", color: "Brown", initialStock: 4 },
      ],
    },
  });
  expect(created.status(), "product created").toBe(201);
  const draft = (await created.json()).data as {
    id: string;
    slug: string;
    variants: { id: string; sku: string }[];
  };
  const main = draft.variants.find((v) => v.sku === sku("NB"))!;
  for (const [suffix, price, h, w, stock] of [
    ["S", "4999", 13, 15, 3],
    ["L", "5999", 15, 16, 2],
  ] as const) {
    const sub = await request.post(`${API}/admin/products/${draft.id}/variants`, {
      headers,
      data: {
        sku: sku(suffix),
        price,
        color: "Natural Black",
        sizeHeightCm: h,
        sizeWidthCm: w,
        parentVariantId: main.id,
        initialStock: stock,
      },
    });
    expect(sub.status(), `sub-variant ${suffix} added`).toBe(201);
  }
  const photo = await request.post(`${API}/admin/products/${draft.id}/images`, {
    headers,
    multipart: {
      files: { name: "topper.png", mimeType: "image/png", buffer: solidPng(400, 500) },
    },
  });
  expect(photo.status(), "photo uploaded").toBe(201);
  const live = await request.patch(`${API}/admin/products/${draft.id}/status`, {
    headers,
    data: { status: "ACTIVE" },
  });
  expect(live.ok(), "product live").toBe(true);
  return { id: draft.id, slug: draft.slug, name, sku };
}

async function deleteProduct(request: APIRequestContext, id: string) {
  const res = await request.delete(`${API}/admin/products/${id}`, {
    headers: auth(await adminToken(request)),
  });
  expect([200, 404], "test product deleted").toContain(res.status());
}

test("sub-variants are the choices (not their main variant, no Option row); the shop filters by size", async ({
  page,
  request,
}) => {
  const topper = await makeTopper(request);
  try {
    await page.goto(`${OPEN}/product/${topper.slug}`);
    const colour = page.getByRole("group", { name: "Colour" });
    const size = page.getByRole("group", { name: "Size" });
    // No second "Option" row: the sub-variants fill the usual rows.
    await expect(page.getByRole("group", { name: "Option" })).toHaveCount(0);
    // Brown (no sub-variants) is the first option in stock.
    await expect(colour.getByRole("link", { name: "Brown" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(size.getByRole("link")).toHaveCount(2);

    await colour.getByRole("link", { name: "Natural Black" }).click();
    await expect(page).toHaveURL(new RegExp(`variant=${topper.sku("S")}$`));
    await expect(size.getByRole("link", { name: "13 × 15 cm" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await size.getByRole("link", { name: "15 × 16 cm" }).click();
    await expect(page).toHaveURL(new RegExp(`variant=${topper.sku("L")}$`));
    await expect(page.getByText("₹5,999").first()).toBeVisible();
    await page.locator("summary", { hasText: "Details" }).click();
    await expect(page.locator("dd", { hasText: "15 × 16 cm" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Option" })).toHaveCount(0);
    await expectAccessible(page, "product with sub-variants");

    // A main variant's own address leads to one of its sub-variants (it isn't sold itself).
    await page.goto(`${OPEN}/product/${topper.slug}?variant=${topper.sku("NB")}`);
    await expect(page).toHaveURL(new RegExp(`variant=${topper.sku("S")}$`));

    // The shop's Size filter (the API refreshed the shop's caches when the topper went live).
    await expect(async () => {
      await page.goto(`${OPEN}/shop?size=15x16`);
      await expect(page.getByText(topper.name).first()).toBeVisible({
        timeout: 1000,
      });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Remove Size: 15 × 16 cm" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "13 × 15 cm" })).toBeVisible();
  } finally {
    await deleteProduct(request, topper.id);
  }
});

test("a product without photos or with an unpriced variant: a placeholder, and only priced options", async ({
  page,
  request,
}) => {
  const headers = auth(await adminToken(request));
  const tag = `E2E${Date.now().toString(36).toUpperCase()}`;
  const categories = (await (await request.get(`${API}/categories`)).json()).data as Category[];
  const name = `Test Plain Wig ${tag}`;
  const created = await request.post(`${API}/admin/products`, {
    headers,
    data: {
      name,
      description: "A wig with no photos, made by an end-to-end test.",
      categoryIds: [categories[0].id],
      variants: [
        // No price: never offered.
        { sku: `${tag}-BL`, color: "Blonde", initialStock: 5 },
        { sku: `${tag}-NB`, price: "3999", color: "Natural Black", initialStock: 5 },
      ],
    },
  });
  expect(created.status()).toBe(201);
  const { id, slug } = (await created.json()).data as { id: string; slug: string };
  try {
    // No photo needed to go live.
    const live = await request.patch(`${API}/admin/products/${id}/status`, {
      headers,
      data: { status: "ACTIVE" },
    });
    expect(live.ok(), "live without photos").toBe(true);

    await page.goto(`${OPEN}/product/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(
      page.getByTestId("photo-placeholder").filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Blonde")).toHaveCount(0);
    await expect(page.getByText("₹3,999").first()).toBeVisible();

    await expect(async () => {
      await page.goto(`${OPEN}/search?q=${encodeURIComponent(tag)}`);
      const card = page.locator(`a[href="/product/${slug}"]`).first();
      await expect(card.getByTestId("photo-placeholder")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });
  } finally {
    await deleteProduct(request, id);
  }
});

test("a product hidden or deleted in the admin leaves the shop at once", async ({
  page,
  request,
}) => {
  const topper = await makeTopper(request);
  try {
    // Seen in the shop (and so in its cache, kept 2 minutes otherwise).
    await expect(async () => {
      await page.goto(`${OPEN}/shop?size=13x15`);
      await expect(page.getByText(topper.name).first()).toBeVisible({
        timeout: 1000,
      });
    }).toPass({ timeout: 20_000 });
    await page.goto(`${OPEN}/product/${topper.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: topper.name })).toBeVisible();

    await deleteProduct(request, topper.id);
    // Well within the 2-minute cache: the shop was told to refresh.
    await expect(async () => {
      await page.goto(`${OPEN}/shop`);
      await expect(page.getByText(topper.name)).toHaveCount(0, { timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await expect(async () => {
      expect((await request.get(`${OPEN}/product/${topper.slug}`)).status()).toBe(404);
    }).toPass({ timeout: 10_000 });
  } finally {
    await deleteProduct(request, topper.id);
  }
});

test("Buy again: only that order's items that can still be bought, straight to checkout", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const topper = await makeTopper(request);
  const admin = auth(await adminToken(request));
  try {
    // An order of the clip-ins (already in the new customer's bag) and the topper.
    const { email, token, addressId } = await shopper(request, "again");
    const detail = (await product(request, topper.slug)) as PublicProduct;
    const small = detail.variants.find((v) => v.sku === topper.sku("S"))!;
    const added = await request.post(`${API}/cart/items`, {
      headers: auth(token),
      data: { variantId: small.id, quantity: 1 },
    });
    expect(added.ok()).toBe(true);
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    // Cancelled (its stock released), then the topper is deleted.
    const cancelled = await request.patch(`${API}/admin/orders/${order.id}/status`, {
      headers: admin,
      data: { status: "CANCELLED", reason: "End-to-end test" },
    });
    expect(cancelled.ok()).toBe(true);
    await deleteProduct(request, topper.id);

    // Something else in the bag meanwhile: Brown would be ordered too if the bag were kept.
    const other = (await (await request.get(`${API}/products?limit=20`)).json()).data.find(
      (p: { slug: string }) => p.slug !== CLIP_INS,
    ) as { slug: string; name: string };
    const otherVariant = (await product(request, other.slug)).variants.find(
      (v) => v.inStock && v.purchasable !== false,
    )!;
    await request.post(`${API}/cart/items`, {
      headers: auth(token),
      data: { variantId: otherVariant.id, quantity: 1 },
    });

    await signIn(page, email);
    await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    await page.getByRole("button", { name: "Buy again" }).click();
    await page.waitForURL(/\/checkout/);
    await expect(
      page.getByText("Some items from your order couldn't be added", { exact: false }),
    ).toBeVisible();
    const clipIns = await product(request, CLIP_INS);
    await expect(page.getByText(clipIns.name).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(other.name)).toHaveCount(0);
    await expect(page.getByText(topper.name)).toHaveCount(0);

    const bag = (await (await request.get(`${API}/cart`, { headers: auth(token) })).json()).data;
    expect(bag.lines.map((l: { productSlug: string }) => l.productSlug)).toEqual([CLIP_INS]);
  } finally {
    await deleteProduct(request, topper.id);
  }
});

test("the home page photos are fixed, and the stacking cards never show through each other", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(OPEN + "/");
  await expect(page.locator('main img[src*="%2Fimages%2Fhome%2Fhero.webp"]')).toBeVisible();
  await expect(page.locator('img[src*="%2Fimages%2Fhome%2Fstory.webp"]')).toHaveCount(1);

  const why = page.locator("[data-why-card]");
  await expect(why).toHaveCount(4);
  for (let i = 0; i < 4; i++)
    await expect(why.nth(i).locator("img")).toHaveAttribute(
      "src",
      new RegExp(`%2Fimages%2Fhome%2Fwhy-${i + 1}\\.webp`),
    );

  // Scroll through the stack: every card stays opaque, and the section ends before the next one.
  await why.first().scrollIntoViewIfNeeded();
  for (let step = 0; step < 8; step++) {
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(250);
    const opacities = await why.evaluateAll((cards) =>
      cards.map((c) => Number(getComputedStyle(c.querySelector("[data-why-inner]")!).opacity)),
    );
    expect(Math.min(...opacities)).toBe(1);
  }
  const gap = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("[data-why-card]")];
    const last = cards[cards.length - 1].getBoundingClientRect().bottom;
    const next = document.querySelector("#range-heading")!.closest("section")!;
    return next.getBoundingClientRect().top - last;
  });
  expect(gap).toBeGreaterThan(0);
});
