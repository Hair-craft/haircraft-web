import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccountCard, AccountHeading } from "@/components/account/account-parts";
import { ApiUnavailable } from "@/components/api-unavailable";
import { RatingStars } from "@/components/product/rating-stars";
import { DeleteReview } from "@/components/reviews/review-form";
import { Badge } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { loadForAccount } from "@/lib/account/server";
import { orderDate } from "@/lib/orders/rules";
import { myReviews } from "@/lib/reviews/api";
import { statusWords } from "@/lib/reviews/rules";

export const metadata: Metadata = {
  title: "My reviews",
  robots: { index: false, follow: false },
};

/** `/account/reviews`: my reviews, newest first, with their status. */
export default async function MyReviewsPage({ searchParams }: PageProps<"/account/reviews">) {
  const { problem } = await searchParams;
  const result = await loadForAccount("/account/reviews", (token) => myReviews(token, 1, 100));
  if (!result) return <ApiUnavailable retryHref="/account/reviews" />;
  const reviews = result.items;

  return (
    <>
      <AccountHeading
        title="My reviews"
        lead="Every review is checked before it appears on the product page."
      />
      {problem === "failed" ? (
        <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          That didn&apos;t work. Please try again.
        </p>
      ) : null}
      {reviews.length === 0 ? (
        <AccountCard className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="font-display text-3xl">No reviews yet</p>
          <p className="text-deep/70">
            Bought something you love (or don&apos;t)? Write a review from its page or from your
            orders.
          </p>
          <ButtonLink href="/account/orders">My orders</ButtonLink>
        </AccountCard>
      ) : (
        <ul aria-label="Reviews" className="flex flex-col gap-4">
          {reviews.map((review) => {
            const status = statusWords(review.status);
            const productHref = `/product/${encodeURIComponent(review.product.slug)}`;
            return (
              <li key={review.id}>
                <AccountCard className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={productHref}
                      className="font-display text-2xl underline-offset-4 hover:underline"
                    >
                      {review.product.name}
                    </Link>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-deep/70">
                    <RatingStars
                      rating={review.rating}
                      reviewCount={1}
                      className="[&>span:last-child]:hidden"
                    />
                    <span>
                      {orderDate(review.updatedAt)}
                      {review.verifiedPurchase ? " · Verified purchase" : ""}
                    </span>
                  </div>
                  {review.title ? <p className="font-medium">{review.title}</p> : null}
                  {review.body ? (
                    <p className="line-clamp-4 whitespace-pre-line text-deep/80">{review.body}</p>
                  ) : null}
                  {review.photos.length > 0 ? (
                    <ul aria-label="Your photos" className="flex flex-wrap gap-2">
                      {review.photos.map((photo, i) => (
                        <li key={photo.id}>
                          <Image
                            src={photo.urls.thumbnail}
                            alt={`Your photo ${i + 1} of ${review.photos.length}`}
                            width={64}
                            height={64}
                            className="size-16 rounded-xl object-cover"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="text-sm text-deep/70">{status.text}</p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <Link
                      href={`${productHref}/review?back=${encodeURIComponent("/account/reviews")}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      Edit<span className="sr-only"> your review of {review.product.name}</span>
                    </Link>
                    <DeleteReview reviewId={review.id} productName={review.product.name} />
                  </div>
                </AccountCard>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
