import { notFound } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { concernMetadata, ListingPage } from "@/components/listing/listing-page";
import { getConcern } from "@/lib/api/catalog";
import { isApiError } from "@/lib/api/errors";
import type { PublicConcern } from "@/lib/api/types";

/**
 * A "Shop by concern" page (owner, 2026-11-03): the concern's title and line,
 * its categories, and the products of all of them with the usual filters,
 * sort and pages. 404 when the concern is hidden or missing; a calm message
 * when the API is down.
 */
async function concernFor(slug: string): Promise<PublicConcern | null> {
  try {
    return await getConcern(slug);
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    if (isApiError(error)) return null;
    throw error;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps<"/concern/[slug]">) {
  const concern = await concernFor((await params).slug);
  return concern ? concernMetadata(concern, searchParams) : { title: "Shop by concern" };
}

export default async function ConcernPage({ params, searchParams }: PageProps<"/concern/[slug]">) {
  const slug = (await params).slug;
  const concern = await concernFor(slug);
  if (!concern)
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-14 sm:px-6">
        <ApiUnavailable retryHref={`/concern/${encodeURIComponent(slug)}`} />
      </div>
    );
  return <ListingPage concern={concern} searchParams={searchParams} />;
}
