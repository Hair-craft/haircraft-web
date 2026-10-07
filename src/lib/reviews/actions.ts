"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { ACCESS_COOKIE, clearedSessionCookies, flashCookie } from "@/lib/session/cookies";
import { safeNext } from "@/lib/session/rules";
import {
  addReviewPhotos,
  createReview,
  deleteReview,
  removeReviewPhoto,
  updateReview,
} from "./api";
import { checkReview, photoProblem, photoProblemCode, reviewErrorMessage } from "./rules";

export interface ReviewFormState {
  error: string | null;
  fields: Record<string, string>;
  values: { rating?: string; title?: string; body?: string };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const production = () => process.env.NODE_ENV === "production";

async function endSession(next: string): Promise<never> {
  const store = await cookies();
  for (const cookie of clearedSessionCookies(production()))
    store.set(cookie.name, cookie.value, cookie.options);
  redirect(`/sign-in?notice=ended&next=${encodeURIComponent(next)}`);
}

async function flash(note: string) {
  const cookie = flashCookie(note, production());
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
}

/** Write a review (no `reviewId`) or change mine; then back where the shopper came from. */
export async function saveReviewAction(
  _previous: ReviewFormState,
  form: FormData,
): Promise<ReviewFormState> {
  const productId = String(form.get("productId") ?? "");
  const reviewId = String(form.get("reviewId") ?? "");
  const here = safeNext(String(form.get("here") ?? "")) ?? "/account/reviews";
  const back = safeNext(String(form.get("back") ?? "")) ?? "/account/reviews";
  const values = {
    rating: String(form.get("rating") ?? "").slice(0, 2),
    title: String(form.get("title") ?? "").slice(0, 400),
    body: String(form.get("body") ?? "").slice(0, 12_000),
  };
  if (!UUID.test(productId) || (reviewId && !UUID.test(reviewId)))
    return { error: "That product wasn't found.", fields: {}, values };
  // Photos: new files to add, and saved ones to remove (ticked boxes).
  const files = form
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const removing = form
    .getAll("removePhoto")
    .map(String)
    .filter((id) => UUID.test(id));
  const saved = Math.max(0, Number(form.get("photoCount") ?? 0) || 0);
  const checked = checkReview(values);
  const photos = photoProblem(files, Math.max(0, saved - removing.length));
  if ("fields" in checked || photos)
    return {
      error: "Please check your review.",
      fields: { ...("fields" in checked ? checked.fields : {}), ...(photos ? { photos } : {}) },
      values,
    };
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return endSession(here);
  let id = reviewId;
  try {
    if (reviewId) await updateReview(token, reviewId, checked.input);
    else id = (await createReview(token, productId, checked.input)).id;
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") return endSession(here);
    // Written meanwhile (another tab): the page shows it, to edit.
    if (error.code === "REVIEW_ALREADY_EXISTS") redirect(here);
    return { error: reviewErrorMessage(error.status, error.code), fields: {}, values };
  }
  // The words are saved; now the photos. A problem here comes back to the
  // form (which now edits the saved review) with a short code.
  let problem: string | null = null;
  try {
    for (const photoId of removing) await removeReviewPhoto(token, id, photoId);
    if (files.length > 0) await addReviewPhotos(token, id, files);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED") return endSession(here);
    problem = photoProblemCode(error.status, error.fieldErrors[0]?.messages[0] ?? error.message);
  }
  if (problem) redirect(`${here}${here.includes("?") ? "&" : "?"}problem=${problem}`);
  await flash(reviewId ? "review-updated" : "review-sent");
  redirect(back);
}

/** Delete one of my reviews (from My reviews; it asks first). */
export async function deleteReviewAction(form: FormData): Promise<void> {
  const reviewId = String(form.get("reviewId") ?? "");
  if (!UUID.test(reviewId)) redirect("/account/reviews");
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return endSession("/account/reviews");
  try {
    await deleteReview(token, reviewId);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
      return endSession("/account/reviews");
    if (error.status !== 404) redirect("/account/reviews?problem=failed");
  }
  await flash("review-deleted");
  redirect("/account/reviews");
}
