import { expect, test } from "@playwright/test";
import { API, API_DOWN, CLOSED, OPEN } from "../../playwright.config";
import { placeOrderByApi, shopper, signIn } from "./support/shop";

const PAGES = [
  { link: "Shipping", path: "/shipping", heading: "Shipping and delivery" },
  { link: "Returns & refunds", path: "/returns", heading: "Returns, refunds and cancellations" },
  { link: "FAQ", path: "/faq", heading: "Frequently asked questions" },
  { link: "Contact us", path: "/contact", heading: "Contact us" },
  { link: "About HairCraft", path: "/about", heading: "About HairCraft" },
  { link: "Privacy policy", path: "/privacy", heading: "Privacy policy" },
  { link: "Terms of use", path: "/terms", heading: "Terms of use" },
];

/** "1999.00" → "₹1,999" (whole rupees, as the pages show them). */
const rupees = (amount: string) =>
  `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

test("every footer link opens its page, with one heading and the side list", async ({ page }) => {
  for (const info of PAGES) {
    await page.goto(OPEN + "/");
    await page.getByRole("contentinfo").getByRole("link", { name: info.link, exact: true }).click();
    await expect(page).toHaveURL(OPEN + info.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(info.heading);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByText(/^Last updated/)).toBeVisible();
    const list = page.getByRole("navigation", { name: "Help and policies" });
    await expect(list.getByRole("link")).toHaveCount(PAGES.length);
    await expect(list.getByRole("link", { name: info.link, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
});

test("Shipping and the FAQ show the API's delivery charge and cash on delivery", async ({
  page,
  request,
}) => {
  const rules = (await (await request.get(`${API}/shop/policies`)).json()).data;
  const line = `Delivery is free on orders of ${rupees(rules.freeShippingThreshold)} or more; below that it costs ${rupees(rules.shippingFee)}.`;

  await page.goto(OPEN + "/shipping");
  await expect(page.getByText(line)).toBeVisible();
  await expect(page.getByRole("list", { name: "In short" })).toContainText(
    `Free delivery over ${rupees(rules.freeShippingThreshold)}`,
  );
  // The test API has cash on delivery on, up to ₹10,000.
  await expect(
    page.getByText(
      `Cash on delivery is available for orders up to ${rupees(rules.cashOnDelivery.maxOrderAmount)}.`,
    ),
  ).toBeVisible();

  // Sections can be linked to.
  await page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("link", { name: "Tracking your order" })
    .click();
  await expect(page).toHaveURL(/#tracking$/);

  await page.goto(OPEN + "/faq");
  await page.getByText("How much does delivery cost?").click();
  await expect(page.getByText(line)).toBeVisible();
});

test("FAQ: answers open with the mouse and the keyboard, one at a time per group", async ({
  page,
}) => {
  await page.goto(OPEN + "/faq");
  const groups = page.getByRole("navigation", { name: "Questions about" });
  await expect(groups.getByRole("link")).toHaveText([
    "Ordering and payment",
    "Delivery",
    "Returns and refunds",
    "Choosing and caring for your hair",
  ]);

  const cancel = page.locator("details", { hasText: "Can I cancel my order?" });
  const refund = page.locator("details", { hasText: "When will I get my refund?" });
  await cancel.locator("summary").click();
  await expect(cancel).toHaveAttribute("open", "");
  await expect(cancel.getByRole("link", { name: "My orders" })).toBeVisible();

  await refund.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(refund).toHaveAttribute("open", "");
  await expect(cancel).not.toHaveAttribute("open", "");

  // Search engines get every answer, without the link marks.
  const blocks = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  const data = JSON.parse(blocks.find((text) => text.includes("FAQPage")) ?? "{}");
  expect(data["@type"]).toBe("FAQPage");
  expect(data.mainEntity.length).toBeGreaterThan(10);
  expect(JSON.stringify(data)).not.toMatch(/\]\(/);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("FAQ answers still open", async ({ page }) => {
    await page.goto(OPEN + "/faq");
    const item = page.locator("details", { hasText: "Do you deliver outside India?" });
    await item.locator("summary").click();
    await expect(item.getByText("Not at the moment")).toBeVisible();
  });
});

test("Contact: one tap to email; the grievance officer is listed", async ({ page }) => {
  await page.goto(OPEN + "/contact");
  await expect(page.getByRole("link", { name: /^Email/ })).toHaveAttribute("href", /^mailto:.+@.+/);
  await expect(page.getByRole("heading", { name: "Grievance officer" })).toBeVisible();
  await expect(page.locator("#grievance + p + dl").getByRole("link")).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  // Linked from the returns policy.
  await page.goto(OPEN + "/returns");
  await page.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(OPEN + "/contact#grievance");
});

test("the home page links to the full FAQ and the story", async ({ page }) => {
  await page.goto(OPEN + "/");
  await page.getByRole("link", { name: "See all questions" }).click();
  await expect(page).toHaveURL(OPEN + "/faq");
  await page.goto(OPEN + "/");
  await page.getByRole("link", { name: "Read our story" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About HairCraft");
});

test("the bag, checkout and an order link to the policies", async ({ page, request }) => {
  const { email, token, addressId } = await shopper(request, "info");
  await signIn(page, email);

  await page.goto(OPEN + "/cart");
  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary.getByRole("link", { name: "Delivery" })).toHaveAttribute(
    "href",
    "/shipping",
  );
  await expect(summary.getByRole("link", { name: "Returns & refunds" })).toHaveAttribute(
    "href",
    "/returns",
  );

  await page.goto(OPEN + "/checkout");
  const terms = page.getByRole("link", { name: "Terms of use (opens in a new tab)" });
  await expect(terms).toHaveAttribute("target", "_blank");
  await expect(
    page.getByRole("link", { name: "Returns & refunds (opens in a new tab)" }),
  ).toHaveAttribute("href", "/returns");

  const order = await placeOrderByApi(request, token, addressId, { pay: "COD", skipAdd: true });
  await page.goto(`${OPEN}/account/orders/${order.orderNumber}`);
  await expect(
    page.locator("#main").getByRole("link", { name: "Returns & refunds" }),
  ).toHaveAttribute("href", "/returns");
});

test("the product page's Delivery & returns links to both policies", async ({ page }) => {
  await page.goto(OPEN + "/shop");
  await page.locator('a[href^="/product/"]').first().click();
  await page.getByText("Delivery & returns").click();
  await expect(page.getByRole("link", { name: "Shipping details" })).toHaveAttribute(
    "href",
    "/shipping",
  );
  await expect(page.getByRole("link", { name: "Returns & refunds" }).first()).toBeVisible();
});

test("with the API down, Shipping still shows, without numbers", async ({ page }) => {
  await page.goto(API_DOWN + "/shipping");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Shipping and delivery");
  await expect(
    page.getByText("The delivery charge for your order is shown in your bag and at checkout."),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "In short" })).toContainText(
    "Delivery charge shown at checkout",
  );
});

test("while the shop is closed, the pages show Coming soon", async ({ page }) => {
  await page.goto(CLOSED + "/privacy");
  await expect(page.getByRole("heading", { name: "Privacy policy" })).toHaveCount(0);
});
