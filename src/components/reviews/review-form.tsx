"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import type { ReviewPhoto } from "@/lib/api/types";
import { FormError, useFocusFirstProblem } from "@/components/auth/auth-forms";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { cx } from "@/lib/cx";
import { deleteReviewAction, saveReviewAction, type ReviewFormState } from "@/lib/reviews/actions";
import {
  BODY_MAX,
  MAX_PHOTOS,
  PHOTO_TYPES,
  photoProblem,
  STAR_WORDS,
  TITLE_MAX,
} from "@/lib/reviews/rules";

const EMPTY: ReviewFormState = { error: null, fields: {}, values: {} };

/** Five stars as a radio group: tap or click one; arrow keys move between them. */
function StarInput({ initial, error }: { initial: number; error?: string }) {
  const [chosen, setChosen] = useState(initial);
  const [hover, setHover] = useState(0);
  const shown = hover || chosen;
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? "rating-error" : undefined}>
      <legend className="mb-1 text-sm font-medium">
        Your rating
        <span aria-hidden className="ml-0.5 text-gold">
          *
        </span>
      </legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {([1, 2, 3, 4, 5] as const).map((stars) => (
            <label
              key={stars}
              onMouseEnter={() => setHover(stars)}
              className="cursor-pointer rounded-lg p-1 has-focus-visible:outline-2 has-focus-visible:outline-deep"
            >
              <input
                type="radio"
                name="rating"
                value={stars}
                defaultChecked={initial === stars}
                onChange={() => setChosen(stars)}
                className="sr-only"
              />
              <span className="sr-only">
                {stars} {stars === 1 ? "star" : "stars"}: {STAR_WORDS[stars]}
              </span>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className={cx(
                  "size-9 transition-colors",
                  stars <= shown ? "fill-gold stroke-gold" : "fill-transparent stroke-deep/30",
                )}
                strokeWidth={1.5}
              >
                <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
              </svg>
            </label>
          ))}
        </div>
        <span aria-hidden className="text-sm text-deep/70">
          {shown ? STAR_WORDS[shown as 1 | 2 | 3 | 4 | 5] : ""}
        </span>
      </div>
      {error ? (
        <p id="rating-error" role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Writing or editing a review. A plain form, so it works without JavaScript. */
export function ReviewForm({
  productId,
  review,
  verifiedPurchase,
  back,
  here,
}: {
  productId: string;
  /** Editing this review; none when writing a new one. */
  review: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    photos: ReviewPhoto[];
  } | null;
  verifiedPurchase: boolean;
  back: string;
  here: string;
}) {
  const [state, action, pending] = useActionState(saveReviewAction, EMPTY);
  const form = useFocusFirstProblem(state);
  const values = {
    rating: Number(state.values.rating ?? review?.rating ?? 0),
    title: state.values.title ?? review?.title ?? "",
    body: state.values.body ?? review?.body ?? "",
  };
  const [bodyLength, setBodyLength] = useState(values.body.length);
  return (
    // Keyed by what was sent: React resets a form after its action and ignores new defaults.
    <form
      key={JSON.stringify(state.values)}
      ref={form}
      action={action}
      noValidate
      className="flex flex-col gap-6"
    >
      <FormError message={state.error} />
      <input type="hidden" name="productId" value={productId} />
      {review ? <input type="hidden" name="reviewId" value={review.id} /> : null}
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="here" value={here} />
      <StarInput initial={values.rating} error={state.fields.rating} />
      <Input
        label="Title (optional)"
        name="title"
        maxLength={TITLE_MAX}
        placeholder="Sum it up in a few words"
        defaultValue={values.title}
        error={state.fields.title}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-body" className="text-sm font-medium">
          Your review (optional)
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={6}
          maxLength={BODY_MAX}
          defaultValue={values.body}
          onChange={(event) => setBodyLength(event.target.value.length)}
          placeholder="How does it look and feel? How well does it blend and last?"
          aria-describedby="review-body-count"
          className="w-full rounded-xl border border-deep/20 bg-white/80 px-4 py-3 placeholder:text-deep/40 focus-visible:border-deep focus-visible:outline-2 focus-visible:outline-deep/40"
        />
        <p id="review-body-count" className="text-right text-xs text-deep/70">
          {BODY_MAX - bodyLength} characters left
        </p>
        {state.fields.body ? (
          <p role="alert" className="text-xs font-medium text-red-700">
            {state.fields.body}
          </p>
        ) : null}
      </div>
      <PhotoPicker saved={review?.photos ?? []} error={state.fields.photos} />
      <p className="text-sm text-deep/70">
        {verifiedPurchase ? "Your review will be marked Verified purchase. " : ""}
        {review
          ? "Changes are checked again before they appear."
          : "We check every review before it appears."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {review ? "Save review" : "Send review"}
        </Button>
        <ButtonLink href={back} variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}

/**
 * Photos: the saved ones (tick Remove to take one off) and new ones to add,
 * up to `MAX_PHOTOS` in all, previewed and checked before sending (the API
 * checks again). Plain inputs, so it works without JavaScript too.
 */
function PhotoPicker({ saved, error }: { saved: ReviewPhoto[]; error?: string }) {
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const kept = saved.length - removing.size;
  const message = problem ?? error ?? null;

  // Free the previews' memory when they change or the form goes.
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">Photos (optional)</legend>
      <input type="hidden" name="photoCount" value={saved.length} />
      {saved.length > 0 ? (
        <ul className="flex flex-wrap gap-3" aria-label="Your photos">
          {saved.map((photo, i) => (
            <li key={photo.id} className="flex flex-col items-center gap-1">
              <Image
                src={photo.urls.thumbnail}
                alt={`Your photo ${i + 1}`}
                width={88}
                height={88}
                className={cx(
                  "size-22 rounded-2xl object-cover",
                  removing.has(photo.id) && "opacity-40",
                )}
              />
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  name="removePhoto"
                  value={photo.id}
                  onChange={(event) => {
                    const next = new Set(removing);
                    if (event.target.checked) next.add(photo.id);
                    else next.delete(photo.id);
                    setRemoving(next);
                  }}
                  className="size-4 accent-deep"
                />
                Remove<span className="sr-only"> photo {i + 1}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-deep/70">
          Add up to {MAX_PHOTOS} photos in all: JPEG, PNG or WebP, up to 5 MB each.
        </span>
        <input
          type="file"
          name="photos"
          multiple
          accept={PHOTO_TYPES.join(",")}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? "photos-error" : undefined}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])];
            const found = photoProblem(files, Math.max(0, kept));
            setProblem(found);
            setPreviews(
              found
                ? []
                : files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
            );
          }}
          className="text-sm file:mr-3 file:rounded-full file:border file:border-deep/20 file:bg-white file:px-4 file:py-2 file:text-sm file:text-deep hover:file:border-deep"
        />
      </label>
      {previews.length > 0 ? (
        <ul className="flex flex-wrap gap-3" aria-label="Photos to add">
          {previews.map((preview) => (
            <li key={preview.url}>
              {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (blob: URL), not a page image */}
              <img
                src={preview.url}
                alt={`New photo: ${preview.name}`}
                className="size-22 rounded-2xl object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      {message ? (
        <p id="photos-error" role="alert" className="text-xs font-medium text-red-700">
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Delete, asking first (a plain form inside <details>, so it works without JavaScript). */
export function DeleteReview({ reviewId, productName }: { reviewId: string; productName: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none text-red-800 underline-offset-4 hover:underline">
        Delete<span className="sr-only"> your review of {productName}</span>
      </summary>
      <form action={deleteReviewAction} className="mt-3 flex flex-wrap items-center gap-3">
        <input type="hidden" name="reviewId" value={reviewId} />
        <span className="text-deep/75">Delete this review? This can&apos;t be undone.</span>
        <Button type="submit" size="sm" variant="secondary">
          Delete review
        </Button>
      </form>
    </details>
  );
}
