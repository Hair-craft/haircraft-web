/**
 * Reviews: rules that need no server or browser, so they are unit-tested
 * (star words, the form's checks, statuses, the API's answers).
 */

import type { ReviewPhoto } from "@/lib/api/types";

export const TITLE_MAX = 150;
export const BODY_MAX = 5000;

/** Photos per review, their size and kinds (the API's limits). */
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Checks photos about to be added (the API checks them again, by their
 * content). Returns the problem in the shop's words, or null.
 */
export function photoProblem(
  files: { name: string; size: number; type: string }[],
  kept: number,
): string | null {
  if (kept + files.length > MAX_PHOTOS)
    return `You can add up to ${MAX_PHOTOS} photos in all. Choose ${Math.max(0, MAX_PHOTOS - kept)} or fewer.`;
  for (const file of files) {
    if (!(PHOTO_TYPES as readonly string[]).includes(file.type))
      return `"${file.name}" isn't a photo we can use. Please choose JPEG, PNG or WebP photos.`;
    if (file.size > MAX_PHOTO_BYTES)
      return `"${file.name}" is larger than 5 MB. Please choose a smaller photo (or a screenshot of it).`;
  }
  return null;
}

/** Why photos weren't added after a review was saved (codes only travel in the address). */
export const PHOTO_PROBLEMS = {
  "photos-type":
    "Your review is saved, but a photo wasn't a JPEG, PNG or WebP image, so the photos weren't added.",
  "photos-size":
    "Your review is saved, but a photo was too large (over 5 MB), so the photos weren't added.",
  "photos-count": `Your review is saved, but it can have at most ${MAX_PHOTOS} photos, so the new ones weren't added.`,
  "photos-failed": "Your review is saved, but the photos couldn't be added. Please try again.",
} as const;
export type PhotoProblemCode = keyof typeof PHOTO_PROBLEMS;

/** The API's refusal of a photo upload, as a code. */
export function photoProblemCode(status: number, message: string): PhotoProblemCode {
  if (status === 415) return "photos-type";
  if (status === 413) return "photos-size";
  if (/at most \d+ photos/.test(message)) return "photos-count";
  return "photos-failed";
}

/** What each number of stars means, shown beside the stars. */
export const STAR_WORDS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

/** The writer's view of a status. */
export const STATUS_WORDS: Record<
  ReviewStatus,
  { label: string; tone: "gold" | "mint" | "muted"; text: string }
> = {
  PENDING: {
    label: "Waiting for approval",
    tone: "gold",
    text: "We check every review before it appears, usually within a day or two.",
  },
  APPROVED: { label: "Published", tone: "mint", text: "Shown on the product page." },
  REJECTED: {
    label: "Not published",
    tone: "muted",
    text: "This review wasn't published. You can edit it and send it again, or delete it.",
  },
};

export function statusWords(status: string) {
  return STATUS_WORDS[(status in STATUS_WORDS ? status : "PENDING") as ReviewStatus];
}

/** A review as its writer sees it (`GET /reviews/mine`). */
export interface MyReview {
  id: string;
  product: { id: string; name: string; slug: string };
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  photos: ReviewPhoto[];
}

export interface ReviewEligibility {
  canReview: boolean;
  existingReviewId: string | null;
  verifiedPurchase: boolean;
}

const tidy = (value: string) => value.trim().replace(/[ \t]+/g, " ");

/** The form's checks, in the shop's words; or what to send. */
export function checkReview(values: {
  rating: string;
  title: string;
  body: string;
}):
  | { fields: Record<string, string> }
  | { input: { rating: number; title: string | null; body: string | null } } {
  const fields: Record<string, string> = {};
  const rating = Number(values.rating);
  const title = tidy(values.title);
  const body = values.body.trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    fields.rating = "Choose from 1 to 5 stars.";
  if (title.length > TITLE_MAX) fields.title = `Use at most ${TITLE_MAX} characters.`;
  if (body.length > BODY_MAX) fields.body = `Use at most ${BODY_MAX} characters.`;
  if (Object.keys(fields).length > 0) return { fields };
  return { input: { rating, title: title || null, body: body || null } };
}

/** The API's refusals, in the shop's words. */
export function reviewErrorMessage(status: number, code: string): string {
  if (code === "REVIEW_ALREADY_EXISTS")
    return "You've already reviewed this product. You can edit your review instead.";
  if (status === 404) return "That review or product no longer exists.";
  if (status === 0 || status >= 500)
    return "We can't reach the shop at the moment. Please try again in a minute.";
  if (status === 429) return "Too many attempts. Please wait a minute and try again.";
  return "That didn't work. Please check your review and try again.";
}
