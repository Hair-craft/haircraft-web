import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API, OPEN } from "../../playwright.config";
import { pngFile } from "./support/png";
import { adminToken, auth, shopper, signIn } from "./support/shop";

/*
 * Review photos (S13b): uploaded to the test API's local storage (never
 * Cloudinary). The test servers keep no review cache, so an approval shows
 * at once.
 */

const TAPES = { slug: "silky-straight-tape-ins", name: "Silky Straight Tape-ins" };
const main = (page: Page) => page.locator("main");
const photoInput = (page: Page) => page.locator('input[type="file"][name="photos"]');

async function mine(request: APIRequestContext, token: string) {
  return (await (await request.get(`${API}/reviews/mine`, { headers: auth(token) })).json())
    .data as { id: string; status: string; photos: { id: string }[] }[];
}

async function approve(request: APIRequestContext, id: string) {
  const response = await request.post(`${API}/admin/reviews/${id}/approve`, {
    headers: auth(await adminToken(request)),
  });
  expect(response.ok(), "review approved").toBe(true);
}

async function chooseStars(page: Page, stars: number) {
  await page
    .locator("label")
    .filter({ hasText: `${stars} stars:` })
    .click();
}

test("write a review with photos; once approved they show on the product and home pages", async ({
  page,
  request,
}) => {
  const { email, token } = await shopper(request, "photos");
  const title = `Glossy and full ${Date.now()}`;
  await signIn(page, email);
  await page.goto(`${OPEN}/product/${TAPES.slug}/review`);
  await chooseStars(page, 5);
  await page.getByLabel("Title (optional)").fill(title);
  await page
    .getByLabel("Your review (optional)")
    .fill("Blends with my own hair and stayed put for weeks. Lovely shine.");
  await photoInput(page).setInputFiles([pngFile("one.png"), pngFile("two.png", 400, [90, 60, 40])]);
  await expect(page.getByRole("list", { name: "Photos to add" }).getByRole("listitem")).toHaveCount(
    2,
  );
  await page.getByRole("button", { name: "Send review" }).click();
  await expect(
    page.getByText("Thank you! Your review will appear once it's approved."),
  ).toBeVisible();

  const [review] = await mine(request, token);
  expect(review.photos).toHaveLength(2);
  await page.goto(OPEN + "/account/reviews");
  await expect(main(page).getByRole("list", { name: "Your photos" }).getByRole("img")).toHaveCount(
    2,
  );

  await approve(request, review.id);
  await page.goto(`${OPEN}/product/${TAPES.slug}`);
  const photos = main(page).getByRole("list", { name: "Photos by Meera" }).first();
  await expect(photos.getByRole("button")).toHaveCount(2);
  await expect(main(page).getByText("Customer photos")).toBeVisible();
  await photos.getByRole("button", { name: /^Photo 2 of 2 by Meera/ }).click();
  const viewer = page.getByRole("dialog", { name: "Photos by Meera: photos" });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByText("2 / 2")).toBeVisible();
  await viewer.getByRole("button", { name: "Close photos" }).click();
  await expect(viewer).toBeHidden();

  // The home page's featured reviews put reviews with photos first.
  await page.goto(OPEN + "/");
  const featured = page.getByRole("region", { name: /Loved by women like you/ });
  await expect(featured).toContainText(title);
  await expect(
    featured.getByRole("img", { name: `Photo by Meera of ${TAPES.name}` }).first(),
  ).toBeVisible();
});

test("edit: remove a photo and add another; it goes back for approval", async ({
  page,
  request,
}) => {
  const { email, token } = await shopper(request, "photos.edit");
  await signIn(page, email);
  await page.goto(`${OPEN}/product/${TAPES.slug}/review`);
  await chooseStars(page, 4);
  await photoInput(page).setInputFiles([pngFile("a.png"), pngFile("b.png")]);
  await page.getByRole("button", { name: "Send review" }).click();
  await expect(
    page.getByText("Thank you! Your review will appear once it's approved."),
  ).toBeVisible();
  const [before] = await mine(request, token);
  await approve(request, before.id);

  await page.goto(
    `${OPEN}/product/${TAPES.slug}/review?back=${encodeURIComponent("/account/reviews")}`,
  );
  await expect(page.getByRole("list", { name: "Your photos" }).getByRole("img")).toHaveCount(2);
  await page.getByRole("checkbox", { name: "Remove photo 1" }).check();
  await photoInput(page).setInputFiles([pngFile("c.png")]);
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page).toHaveURL(OPEN + "/account/reviews");
  const [after] = await mine(request, token);
  expect(after.status).toBe("PENDING");
  expect(after.photos).toHaveLength(2);
  expect(after.photos.map((p) => p.id)).not.toContain(before.photos[0].id);
});

test("too many or unsuitable photos are explained before sending", async ({ page, request }) => {
  const { email } = await shopper(request, "photos.checks");
  await signIn(page, email);
  await page.goto(`${OPEN}/product/${TAPES.slug}/review`);
  await photoInput(page).setInputFiles([
    pngFile("1.png"),
    pngFile("2.png"),
    pngFile("3.png"),
    pngFile("4.png"),
  ]);
  await expect(
    page.getByText("You can add up to 3 photos in all. Choose 3 or fewer."),
  ).toBeVisible();
  await photoInput(page).setInputFiles([
    { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
  ]);
  await expect(page.getByText(`"notes.txt" isn't a photo we can use.`)).toBeVisible();
});

test("without JavaScript: photos are sent with the form; the API's checks are explained", async ({
  browser,
  request,
}) => {
  const { email, token } = await shopper(request, "photos.nojs");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(`${OPEN}/product/${TAPES.slug}/review`);
  await page.getByRole("radio", { name: "4 stars: Very good" }).check({ force: true });
  // Claims to be a PNG but isn't one: the API checks the content and refuses it.
  await photoInput(page).setInputFiles([
    { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not really an image") },
  ]);
  await page.getByRole("button", { name: "Send review" }).click();
  await expect(page).toHaveURL(/problem=photos-type/);
  await expect(
    page.getByText(/Your review is saved, but a photo wasn't a JPEG, PNG or WebP image/),
  ).toBeVisible();
  const [review] = await mine(request, token);
  expect(review.photos).toHaveLength(0);

  // The form now edits the saved review: a real photo goes through.
  await photoInput(page).setInputFiles([pngFile("real.png")]);
  await page.getByRole("button", { name: "Save review" }).click();
  expect((await mine(request, token))[0].photos).toHaveLength(1);
  await context.close();
});
