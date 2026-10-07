import "server-only";
import { apiFetch, apiFetchPage } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import type { MyReview, ReviewEligibility } from "./rules";

export function reviewEligibility(token: string, productId: string): Promise<ReviewEligibility> {
  return apiFetch<ReviewEligibility>(
    `/products/${encodeURIComponent(productId)}/reviews/eligibility`,
    { token },
  );
}

export function myReviews(token: string, page = 1, limit = 20): Promise<Paginated<MyReview>> {
  return apiFetchPage<MyReview>("/reviews/mine", { token, query: { page, limit } });
}

/** One of my reviews (the API lists them; a customer has at most one per product). */
export async function myReview(token: string, reviewId: string): Promise<MyReview | null> {
  for (let page = 1; page <= 50; page++) {
    const { items, meta } = await myReviews(token, page, 100);
    const found = items.find((r) => r.id === reviewId);
    if (found) return found;
    if (!meta.hasNextPage) return null;
  }
  return null;
}

type ReviewInput = { rating: number; title: string | null; body: string | null };

export function createReview(
  token: string,
  productId: string,
  input: ReviewInput,
): Promise<MyReview> {
  return apiFetch<MyReview>(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    token,
    body: input,
  });
}

export function updateReview(
  token: string,
  reviewId: string,
  input: ReviewInput,
): Promise<MyReview> {
  return apiFetch<MyReview>(`/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteReview(token: string, reviewId: string): Promise<unknown> {
  return apiFetch(`/reviews/${encodeURIComponent(reviewId)}`, { method: "DELETE", token });
}

/** Adds photos to my review (multipart, field `files`); it goes back for approval. */
export function addReviewPhotos(token: string, reviewId: string, files: File[]): Promise<MyReview> {
  const body = new FormData();
  for (const file of files) body.append("files", file, file.name);
  return apiFetch<MyReview>(`/reviews/${encodeURIComponent(reviewId)}/photos`, {
    method: "POST",
    token,
    body,
  });
}

export function removeReviewPhoto(
  token: string,
  reviewId: string,
  photoId: string,
): Promise<MyReview> {
  return apiFetch<MyReview>(
    `/reviews/${encodeURIComponent(reviewId)}/photos/${encodeURIComponent(photoId)}`,
    { method: "DELETE", token },
  );
}
