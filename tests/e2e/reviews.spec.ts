import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API, API_DOWN, OPEN } from "../../playwright.config";
import {
  adminOrder,
  adminToken,
  auth,
  CLIP_INS,
  placeOrderByApi,
  product,
  shopper,
  signIn,
} from "./support/shop";

/*
 * Each test uses a new customer, so "one review per product" never clashes
 * between runs. Approvals go through the admin API, as staff would.
 */

const main = (page: Page) => page.locator("main");

async function writeReview(page: Page, stars: number, title: string, body: string) {
  // The star itself (its radio button is hidden; the label is what's clicked).
  await page
    .locator("label")
    .filter({ hasText: `${stars} ${stars === 1 ? "star" : "stars"}:` })
    .click();
  await page.getByLabel("Title (optional)").fill(title);
  await page.getByLabel("Your review (optional)").fill(body);
}

async function approve(request: APIRequestContext, reviewId: string) {
  const response = await request.post(`${API}/admin/reviews/${reviewId}/approve`, {
    headers: auth(await adminToken(request)),
  });
  expect(response.ok(), "review approved").toBe(true);
}

async function mine(request: APIRequestContext, token: string) {
  return (await (await request.get(`${API}/reviews/mine`, { headers: auth(token) })).json())
    .data as {
    id: string;
    status: string;
    rating: number;
    verifiedPurchase: boolean;
  }[];
}

test.describe("writing a review", () => {
  test("from the product page: sent for approval, then published", async ({ page, request }) => {
    const { email, token } = await shopper(request, "review");
    await signIn(page, email);
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    await main(page).getByRole("link", { name: "Write a review" }).click();
    await expect(page).toHaveURL(`${OPEN}/product/${CLIP_INS}/review`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Classic Straight Clip-in Set",
    );
    await expect(page.getByText("We check every review before it appears.")).toBeVisible();

    // A rating is needed.
    await page.getByRole("button", { name: "Send review" }).click();
    await expect(page.getByText("Choose from 1 to 5 stars.")).toBeVisible();

    await writeReview(page, 4, "Soft and full", "Blends well with my own hair.");
    await page.getByRole("button", { name: "Send review" }).click();
    await expect(page).toHaveURL(`${OPEN}/product/${CLIP_INS}#reviews`);
    await expect(
      page.getByText("Thank you! Your review will appear once it's approved."),
    ).toBeVisible();
    await expect(main(page).getByRole("link", { name: "Edit your review" })).toBeVisible();
    await expect(main(page).getByText("Your review is waiting for approval.")).toBeVisible();

    const [review] = await mine(request, token);
    expect(review).toMatchObject({ status: "PENDING", rating: 4, verifiedPurchase: false });
    await approve(request, review.id);
    // Published: in the product's public reviews (the page shows it within its 2-minute cache).
    const published = (
      await (await request.get(`${API}/products/${CLIP_INS}/reviews?sort=newest`)).json()
    ).data as { id: string }[];
    expect(published.map((r) => r.id)).toContain(review.id);
    await page.goto(OPEN + "/account/reviews");
    await expect(main(page).getByText("Published")).toBeVisible();
  });

  test("a buyer's review is a verified purchase, written from the delivered order", async ({
    page,
    request,
  }) => {
    const { email, token, addressId } = await shopper(request, "review.buyer");
    const order = await placeOrderByApi(request, token, addressId, { skipAdd: true });
    await adminOrder(request, order.id, { status: "PROCESSING" });
    await adminOrder(request, order.id, {
      shipping: { carrier: "Delhivery", trackingNumber: "9876543210" },
      status: "SHIPPED",
    });
    await adminOrder(request, order.id, { status: "DELIVERED" });
    await signIn(page, email);
    await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
    await main(page).getByRole("link", { name: "Review Classic Straight Clip-in Set" }).click();
    await expect(page.getByText("Your review will be marked Verified purchase.")).toBeVisible();
    await writeReview(page, 5, "Worth it", "Lasted through many washes.");
    await page.getByRole("button", { name: "Send review" }).click();
    // Back to the order it came from.
    await expect(page).toHaveURL(`${OPEN}/account/orders/${order.orderNumber}`);
    const [review] = await mine(request, token);
    expect(review).toMatchObject({ verifiedPurchase: true, rating: 5 });
  });

  test("guests sign in first and come back to the form", async ({ page, request }) => {
    const { email } = await shopper(request, "review.guest");
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    await main(page).getByRole("link", { name: "Write a review" }).click();
    await expect(page).toHaveURL(/\/sign-in\?next=/);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Silky2026!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`${OPEN}/product/${CLIP_INS}/review`);
  });
});

test.describe("my reviews", () => {
  test("edit sends it back for approval; delete asks first", async ({ page, request }) => {
    const { email, token } = await shopper(request, "review.mine");
    const clip = await product(request, CLIP_INS);
    const created = await request.post(`${API}/products/${clip.id}/reviews`, {
      headers: auth(token),
      data: { rating: 3, title: "Okay", body: "A bit thin." },
    });
    expect(created.status()).toBe(201);
    const id = (await created.json()).data.id as string;
    await approve(request, id);

    await signIn(page, email);
    await page.goto(OPEN + "/account");
    await page
      .getByRole("navigation", { name: "My account" })
      .getByRole("link", { name: "My reviews" })
      .click();
    await expect(page).toHaveURL(OPEN + "/account/reviews");
    const card = main(page).getByRole("list", { name: "Reviews" }).getByRole("listitem");
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Published");
    await expect(card).toContainText("A bit thin.");

    await card.getByRole("link", { name: /^Edit/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Classic Straight Clip-in Set",
    );
    await expect(page.getByText("Edit your review")).toBeVisible();
    await expect(page.getByLabel("Title (optional)")).toHaveValue("Okay");
    await expect(page.getByText("Changes are checked again before they appear.")).toBeVisible();
    await page.getByLabel("Title (optional)").fill("Better than I thought");
    await page.getByRole("button", { name: "Save review" }).click();
    await expect(page).toHaveURL(OPEN + "/account/reviews");
    await expect(
      page.getByText("Review saved. It will appear again once it's approved."),
    ).toBeVisible();
    await expect(card).toContainText("Waiting for approval");
    await expect(card).toContainText("Better than I thought");

    await card.locator("summary", { hasText: "Delete" }).click();
    await card.getByRole("button", { name: "Delete review" }).click();
    await expect(page.getByText("Review deleted.")).toBeVisible();
    await expect(main(page).getByText("No reviews yet")).toBeVisible();
  });

  test("a rejected review shows as not published, to edit", async ({ page, request }) => {
    const { email, token } = await shopper(request, "review.rejected");
    const clip = await product(request, CLIP_INS);
    const created = await request.post(`${API}/products/${clip.id}/reviews`, {
      headers: auth(token),
      data: { rating: 1, title: "Call 9999999999 for cheap hair" },
    });
    const id = (await created.json()).data.id as string;
    const rejected = await request.post(`${API}/admin/reviews/${id}/reject`, {
      headers: auth(await adminToken(request)),
      data: { note: "Advertising" },
    });
    expect(rejected.ok()).toBe(true);
    await signIn(page, email);
    await page.goto(OPEN + "/account/reviews");
    await expect(main(page)).toContainText("Not published");
    await expect(main(page)).toContainText("You can edit it and send it again, or delete it.");
    await page.goto(`${OPEN}/product/${CLIP_INS}`);
    await expect(
      main(page).getByText("Your review wasn't published. You can edit it."),
    ).toBeVisible();
  });
});

test("keyboard: the stars are a radio group", async ({ page, request }) => {
  const { email } = await shopper(request, "review.keys");
  await signIn(page, email);
  await page.goto(`${OPEN}/product/${CLIP_INS}/review`);
  await page.getByRole("radio", { name: "1 star: Poor" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "3 stars: Good" })).toBeChecked();
});

test("without JavaScript, a review can be written", async ({ browser, request }) => {
  const { email, token } = await shopper(request, "review.nojs");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(`${OPEN}/product/${CLIP_INS}/review`);
  await page.getByRole("radio", { name: "5 stars: Excellent" }).check({ force: true });
  await page.getByLabel("Title (optional)").fill("Lovely");
  await page.getByRole("button", { name: "Send review" }).click();
  await expect(page).toHaveURL(new RegExp(`/product/${CLIP_INS}`));
  expect((await mine(request, token))[0]).toMatchObject({ rating: 5, status: "PENDING" });
  await context.close();
});

test("with the API down My reviews is calm", async ({ page, context }) => {
  await context.addCookies([
    { name: "hc_at", value: "not-a-real-token", url: API_DOWN, httpOnly: true },
  ]);
  const response = await page.goto(API_DOWN + "/account/reviews");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "We'll be right back" })).toBeVisible();
});
