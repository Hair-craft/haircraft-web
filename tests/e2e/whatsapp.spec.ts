import { expect, test } from "@playwright/test";
import { CLOSED, OPEN } from "../../playwright.config";
import { CLIP_INS, shopper, signIn } from "./support/shop";

const CHAT = "https://wa.me/message/5EXU5MQ2N5Y3B1";
const button = (page: import("@playwright/test").Page) =>
  page.getByRole("link", { name: "Chat with us on WhatsApp (opens in a new tab)" });

test("the WhatsApp button sits bottom right on shop pages and opens the chat in a new tab", async ({
  page,
}) => {
  for (const path of ["/", "/shop", `/product/${CLIP_INS}`, "/contact"]) {
    await page.goto(OPEN + path);
    await expect(button(page), path).toBeVisible();
    await expect(button(page)).toHaveAttribute("href", CHAT);
    await expect(button(page)).toHaveAttribute("target", "_blank");
  }
  const box = (await button(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x + box.width).toBeGreaterThan(viewport.width - 60);
  expect(box.y + box.height).toBeGreaterThan(viewport.height - 60);
  // Contact also lists WhatsApp.
  await expect(page.locator("main").getByRole("link", { name: /^WhatsApp/ })).toHaveAttribute(
    "href",
    CHAT,
  );
});

test("it's also on Coming soon, and not at checkout", async ({ page, request }) => {
  await page.goto(CLOSED + "/");
  await expect(button(page)).toBeVisible();

  const { email } = await shopper(request, "wa");
  await signIn(page, email);
  await page.goto(OPEN + "/checkout");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(button(page)).toHaveCount(0);
});
