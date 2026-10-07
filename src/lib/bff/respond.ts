import "server-only";
import { NextResponse } from "next/server";
import { ApiError, friendlyMessage, isApiError } from "@/lib/api/errors";

/**
 * The pattern for BFF route handlers (`src/app/bff/...`): browser code calls
 * the storefront, the handler calls the API on the server (with the
 * session cookie's token), and every failure becomes the same small JSON
 * shape with a customer-friendly message.
 */
export interface BffError {
  error: { code: string; message: string; fields: Record<string, string[]> };
}

export function bffError(error: unknown): NextResponse<BffError> {
  const apiError = isApiError(error) ? error : null;
  if (!apiError) console.error("BFF handler failed", error);
  const status = apiError ? (apiError.status === 0 ? 503 : apiError.status) : 500;
  return NextResponse.json(
    {
      error: {
        code: apiError?.code ?? "INTERNAL_ERROR",
        message: friendlyMessage(error),
        fields: Object.fromEntries((apiError?.fieldErrors ?? []).map((f) => [f.field, f.messages])),
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Runs a handler body and turns any failure into a `bffError`. */
export async function bff<T>(work: () => Promise<T>, init?: ResponseInit): Promise<NextResponse> {
  try {
    const data = await work();
    return NextResponse.json(
      { data },
      { ...init, headers: { "Cache-Control": "no-store", ...init?.headers } },
    );
  } catch (error) {
    return bffError(error);
  }
}

export { ApiError };
