import { NextResponse, type NextRequest } from "next/server";
import { getReviewPage, REVIEW_SORTS, type ReviewSort } from "@/lib/api/catalog";
import { bff } from "@/lib/bff/respond";

/**
 * GET /bff/products/<slug>/reviews?sort=relevant|newest|highest|lowest&page=N:
 * more of a product's reviews for the product page (Show more, sorting).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/bff/products/[slug]/reviews">,
) {
  const { slug } = await params;
  const search = request.nextUrl.searchParams;
  const sort = (search.get("sort") ?? "relevant") as ReviewSort;
  const page = Number(search.get("page") ?? "1");
  if (!REVIEW_SORTS.includes(sort) || !Number.isInteger(page) || page < 1 || page > 1000) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "sort must be relevant, newest, highest or lowest, and page a number from 1.",
          fields: {},
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return bff(async () => {
    const { items, meta } = await getReviewPage(slug, sort, page);
    return { items, totalPages: meta.totalPages };
  });
}
