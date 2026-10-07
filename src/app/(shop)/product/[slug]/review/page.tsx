import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { ReviewForm } from "@/components/reviews/review-form";
import { getProduct } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { PublicProduct } from "@/lib/api/types";
import { galleryFor } from "@/lib/product/variants";
import { myReview, reviewEligibility } from "@/lib/reviews/api";
import {
  PHOTO_PROBLEMS,
  type MyReview,
  type PhotoProblemCode,
  type ReviewEligibility,
} from "@/lib/reviews/rules";
import { safeNext } from "@/lib/session/rules";
import { getSession } from "@/lib/session/session";

export const metadata: Metadata = {
  title: "Write a review",
  robots: { index: false, follow: false },
};

/**
 * `/product/<slug>/review`: write a review of this product, or edit mine.
 * `?back=` (a page of this shop) is where to go afterwards; by default the
 * product's reviews.
 */
export default async function ReviewPage({
  params,
  searchParams,
}: PageProps<"/product/[slug]/review">) {
  const { slug } = await params;
  const query = await searchParams;
  const productHref = `/product/${encodeURIComponent(slug)}`;
  const back =
    safeNext(typeof query.back === "string" ? query.back : null) ?? `${productHref}#reviews`;
  const here = `${productHref}/review${typeof query.back === "string" ? `?back=${encodeURIComponent(back)}` : ""}`;

  const { accessToken } = await getSession();
  if (!accessToken) redirect(`/sign-in?next=${encodeURIComponent(here)}`);

  let product: PublicProduct;
  try {
    product = await getProduct(slug);
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    if (isApiError(error)) return <Unavailable here={here} />;
    throw error;
  }

  let eligibility: ReviewEligibility;
  let existing: MyReview | null = null;
  try {
    eligibility = await reviewEligibility(accessToken, product.id);
    if (eligibility.existingReviewId)
      existing = await myReview(accessToken, eligibility.existingReviewId);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
      redirect(`/bff/session/end?next=${encodeURIComponent(here)}`);
    return <Unavailable here={here} />;
  }

  const photo = galleryFor(product.images, undefined)[0];
  // After saving, a photo problem comes back as a code (never text from the address).
  const problem =
    typeof query.problem === "string" && Object.hasOwn(PHOTO_PROBLEMS, query.problem)
      ? PHOTO_PROBLEMS[query.problem as PhotoProblemCode]
      : null;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white">
          {photo ? (
            <Image src={photo.urls.thumbnail} alt="" fill sizes="80px" className="object-cover" />
          ) : null}
        </div>
        <div>
          <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">
            {existing ? "Edit your review" : "Write a review"}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            <Link href={productHref} className="underline-offset-4 hover:underline">
              {product.name}
            </Link>
          </h1>
        </div>
      </div>
      {problem ? (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-gold/40 bg-gold/15 px-4 py-3 text-sm"
        >
          {problem}
        </p>
      ) : null}
      <div className="mt-8 rounded-[2rem] bg-white/80 p-6 ring-1 ring-deep/5 sm:p-8">
        <ReviewForm
          productId={product.id}
          review={existing}
          verifiedPurchase={eligibility.verifiedPurchase}
          back={back}
          here={here}
        />
      </div>
    </div>
  );
}

function Unavailable({ here }: { here: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <ApiUnavailable retryHref={here} />
    </div>
  );
}
