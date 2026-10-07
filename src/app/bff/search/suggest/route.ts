import { NextResponse, type NextRequest } from "next/server";
import { getSuggestions } from "@/lib/api/catalog";
import { bff } from "@/lib/bff/respond";
import { cleanSearch, MIN_SUGGEST_LENGTH } from "@/lib/listing/query";

/**
 * GET /bff/search/suggest?q=…: type-ahead suggestions for the header search.
 * The browser calls the storefront; the storefront asks the API (each query's
 * answer is cached on the server for a minute, and the browser may keep it as
 * long). Nothing about the search is stored or logged.
 */
export async function GET(request: NextRequest) {
  const q = cleanSearch(request.nextUrl.searchParams.get("q") ?? undefined);
  if (q === null || q.length < MIN_SUGGEST_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `Type at least ${MIN_SUGGEST_LENGTH} letters.`,
          fields: { q: [`At least ${MIN_SUGGEST_LENGTH} letters`] },
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return bff(() => getSuggestions(q), {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
