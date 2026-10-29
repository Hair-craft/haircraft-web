import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { authorised, requestedTags } from "@/lib/revalidate";

/**
 * POST /bff/revalidate: the API calls this after admin changes to products
 * or categories (with `Authorization: Bearer <REVALIDATE_SECRET>`), so the
 * shop shows them at once instead of when its caches expire. The next
 * visitor gets fresh data (nothing stale is served for these tags).
 */
export async function POST(request: NextRequest) {
  if (!authorised(request.headers.get("authorization"), process.env.REVALIDATE_SECRET)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not allowed." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const body: unknown = await request.json().catch(() => null);
  const tags = requestedTags(body);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json(
    { data: { revalidated: tags } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
