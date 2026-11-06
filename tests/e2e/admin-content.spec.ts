import { expect, test, type APIRequestContext } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";
import { adminToken, auth, CLIP_INS, product } from "./support/shop";

/**
 * Shop content the admin controls (owner, 2026-11-05): the product's
 * Details tab switch, and the FAQs on the home page and /faq. Admin
 * changes refresh the shop's caches at once.
 */

async function setShowDetails(request: APIRequestContext, productId: string, showDetails: boolean) {
  const headers = auth(await adminToken(request));
  const current = (
    await (await request.get(`${API}/admin/products/${productId}`, { headers })).json()
  ).data as { version: number };
  const r = await request.patch(`${API}/admin/products/${productId}`, {
    headers,
    data: { version: current.version, showDetails },
  });
  expect(r.ok(), `showDetails set to ${showDetails}`).toBe(true);
}

test("the admin can hide a product's Details tab", async ({ page, request }) => {
  const item = await product(request, CLIP_INS);
  await page.goto(OPEN + `/product/${CLIP_INS}`);
  await expect(page.locator("summary", { hasText: "Details" })).toBeVisible();
  try {
    await setShowDetails(request, item.id, false);
    await expect(async () => {
      await page.goto(OPEN + `/product/${CLIP_INS}`);
      await expect(page.locator("summary", { hasText: "Details" })).toHaveCount(0, {
        timeout: 1000,
      });
    }).toPass({ timeout: 60_000 });
    // The other tabs stay.
    await expect(page.locator("summary", { hasText: "Description" })).toBeVisible();
  } finally {
    await setShowDetails(request, item.id, true);
  }
});

test("FAQs come from the admin: the home page's ticked questions and every shown one on /faq", async ({
  page,
  request,
}) => {
  const headers = auth(await adminToken(request));
  const question = `Do you have a salon? (${Date.now()})`;
  const created = await request.post(`${API}/admin/faqs`, {
    headers,
    data: { group: "hair", question, answer: "Not yet: we're **online only**.", showOnHome: true },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).data.id as string;
  try {
    await expect(async () => {
      await page.goto(OPEN + "/");
      const section = page.getByRole("region", { name: "Frequently asked questions" });
      await expect(section.getByRole("button", { name: question })).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 60_000 });
    await page.goto(OPEN + "/faq");
    const group = page.getByRole("region", { name: "Choosing and caring for your hair" });
    await group.getByText(question).click();
    await expect(group.getByText("online only")).toBeVisible();
  } finally {
    await request.delete(`${API}/admin/faqs/${id}`, { headers });
  }
});
