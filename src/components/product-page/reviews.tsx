"use client";

import Image from "next/image";
import { useState } from "react";
import { RatingStars } from "@/components/product/rating-stars";
import { Button, ButtonLink } from "@/components/ui/button";
import { Lightbox } from "@/components/product-page/gallery";
import type { PublicReview, ReviewPhoto, ReviewSummary } from "@/lib/api/types";

type Sort = "relevant" | "newest" | "highest" | "lowest";
const SORT_LABELS: Record<Sort, string> = {
  relevant: "Most relevant",
  newest: "Newest",
  highest: "Highest rated",
  lowest: "Lowest rated",
};

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/**
 * "Customer reviews": the average with a bar per star level, then the
 * reviews 5 at a time (Show more), sortable. The first page comes with the
 * page; more pages and other orders come from `/bff/products/<slug>/reviews`.
 */
export function Reviews({
  slug,
  summary,
  first,
  totalPages,
  mine,
}: {
  slug: string;
  summary: ReviewSummary;
  first: PublicReview[];
  totalPages: number;
  /** The shopper's own review of this product, if signed in and written. */
  mine: { status: string } | null;
}) {
  const [sort, setSort] = useState<Sort>("relevant");
  // The full-screen view: the photos shown, and which one was opened.
  const [viewing, setViewing] = useState<{
    photos: ReviewPhoto[];
    start: number;
    title: string;
  } | null>(null);
  const [items, setItems] = useState(first);
  // Customer photos: from the reviews loaded so far (Most relevant puts reviews with photos first).
  const stripPhotos = items.flatMap((review) => review.photos).slice(0, 8);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = async (nextSort: Sort, nextPage: number) => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/bff/products/${encodeURIComponent(slug)}/reviews?sort=${nextSort}&page=${nextPage}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(String(response.status));
      const body = (await response.json()) as {
        data: { items: PublicReview[]; totalPages: number };
      };
      setItems((current) => (nextPage === 1 ? body.data.items : [...current, ...body.data.items]));
      setPage(nextPage);
      setPages(body.data.totalPages);
      setSort(nextSort);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28">
      <h2 id="reviews-heading" className="text-center font-display text-4xl md:text-5xl">
        Customer reviews
      </h2>
      <div className="mt-5 flex flex-col items-center gap-2 text-center">
        <ButtonLink
          href={`/product/${encodeURIComponent(slug)}/review`}
          variant="secondary"
          size="sm"
        >
          {mine ? "Edit your review" : "Write a review"}
        </ButtonLink>
        {mine?.status === "PENDING" ? (
          <p className="text-sm text-deep/70">Your review is waiting for approval.</p>
        ) : mine?.status === "REJECTED" ? (
          <p className="text-sm text-deep/70">
            Your review wasn&apos;t published. You can edit it.
          </p>
        ) : null}
      </div>
      {summary.count === 0 ? (
        <p className="mt-6 text-center text-deep/70">
          No reviews yet. Be the first to share how it looks and feels.
        </p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
          <div>
            <p className="font-display text-6xl leading-none">
              {Number.isInteger(summary.average) ? summary.average : summary.average.toFixed(1)}
              <span className="text-2xl text-deep/70"> / 5</span>
            </p>
            <div className="mt-3">
              {/* The count is written out just below. */}
              <RatingStars
                rating={summary.average}
                reviewCount={summary.count}
                className="[&>span:last-child]:hidden"
              />
            </div>
            <p className="mt-1 text-sm text-deep/70">
              Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}
            </p>
            <ul className="mt-6 flex flex-col gap-2" aria-label="Reviews by star rating">
              {(["5", "4", "3", "2", "1"] as const).map((stars) => {
                const count = summary.breakdown[stars];
                const share = summary.count === 0 ? 0 : Math.round((count / summary.count) * 100);
                return (
                  <li key={stars} className="flex items-center gap-3 text-sm">
                    <span className="w-14 shrink-0">{stars} star</span>
                    <span
                      aria-hidden
                      className="h-2 flex-1 overflow-hidden rounded-full bg-deep/10"
                    >
                      <span
                        className="block h-full rounded-full bg-gold"
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-deep/70">
                      {count}
                      <span className="sr-only"> {count === 1 ? "review" : "reviews"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            {stripPhotos.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-sm font-medium">Customer photos</h3>
                <ul className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                  {stripPhotos.map((photo, i) => (
                    <li key={photo.id} className="shrink-0">
                      <PhotoButton
                        photo={photo}
                        size={88}
                        label={`Customer photo ${i + 1} of ${stripPhotos.length}`}
                        onOpen={() =>
                          setViewing({ photos: stripPhotos, start: i, title: "Customer photos" })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <label className="flex items-center justify-end gap-2 text-sm">
              <span className="text-deep/70">Sort reviews</span>
              <select
                value={sort}
                disabled={loading}
                onChange={(event) => load(event.target.value as Sort, 1)}
                className="h-10 rounded-full border border-deep/20 bg-white/80 px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
              >
                {(Object.keys(SORT_LABELS) as Sort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <ul
              aria-busy={loading || undefined}
              className={`mt-4 divide-y divide-deep/10 transition-opacity ${loading ? "opacity-50" : ""}`}
            >
              {items.map((review) => (
                <li key={review.id} className="py-6">
                  <article aria-label={`Review by ${review.reviewerName}`}>
                    <RatingStars
                      rating={review.rating}
                      reviewCount={1}
                      className="[&>span:last-child]:hidden"
                    />
                    {review.title ? (
                      <h3 className="mt-2 font-display text-2xl">{review.title}</h3>
                    ) : null}
                    {review.body ? (
                      <p className="mt-2 leading-relaxed whitespace-pre-line text-deep/80">
                        {review.body}
                      </p>
                    ) : null}
                    {review.photos.length > 0 ? (
                      <ul
                        aria-label={`Photos by ${review.reviewerName}`}
                        className="mt-3 flex flex-wrap gap-2"
                      >
                        {review.photos.map((photo, i) => (
                          <li key={photo.id}>
                            <PhotoButton
                              photo={photo}
                              size={72}
                              label={`Photo ${i + 1} of ${review.photos.length} by ${review.reviewerName}`}
                              onOpen={() =>
                                setViewing({
                                  photos: review.photos,
                                  start: i,
                                  title: `Photos by ${review.reviewerName}`,
                                })
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-3 text-sm text-deep/70">
                      <span className="font-medium text-deep">{review.reviewerName}</span>
                      {review.verifiedPurchase ? " · Verified purchase" : ""} ·{" "}
                      <time dateTime={review.createdAt}>
                        {dateFormat.format(new Date(review.createdAt))}
                      </time>
                    </p>
                  </article>
                </li>
              ))}
            </ul>
            {failed ? (
              <p role="alert" className="mt-4 text-sm text-red-800">
                We couldn&apos;t load more reviews. Please try again.
              </p>
            ) : null}
            {page < pages ? (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" loading={loading} onClick={() => load(sort, page + 1)}>
                  Show more reviews
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {viewing ? (
        <Lightbox
          images={viewing.photos.map((photo) => ({
            id: photo.id,
            urls: photo.urls,
            altText: null,
          }))}
          name={viewing.title}
          start={viewing.start}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </section>
  );
}

/** A square thumbnail that opens the photo full screen. */
function PhotoButton({
  photo,
  size,
  label,
  onOpen,
}: {
  photo: ReviewPhoto;
  size: number;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label} (opens large)`}
      className="block overflow-hidden rounded-2xl bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep"
      style={{ width: size, height: size }}
    >
      <Image
        src={photo.urls.thumbnail}
        alt=""
        width={size}
        height={size}
        className="size-full object-cover transition-transform hover:scale-105"
      />
    </button>
  );
}
