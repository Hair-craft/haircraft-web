import "server-only";
import { settings } from "@/lib/env";
import { ApiError, CLIENT_ERROR_CODES } from "./errors";
import type { ErrorEnvelope, Paginated, SuccessEnvelope } from "./types";

export type QueryValue = string | number | boolean | null | undefined | (string | number)[];

export interface ApiRequest {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Added to the URL; empty values are left out, arrays become `a,b`. */
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Access token of the signed-in customer (sent as a Bearer token). */
  token?: string | null;
  headers?: Record<string, string>;
  /**
   * Public catalogue data can be cached by Next.js for this many seconds.
   * Leave it out for anything personal: those requests are never cached.
   */
  revalidate?: number;
  /** Cache tags, for on-demand revalidation. */
  tags?: string[];
}

/** Lets unit tests replace `fetch`. */
let fetchImpl: typeof fetch = (...args) => fetch(...args);
export function setFetchForTests(impl: typeof fetch | null): void {
  fetchImpl = impl ?? ((...args) => fetch(...args));
}

export function buildUrl(base: string, path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) url.searchParams.set(key, value.join(","));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function call<T>(path: string, request: ApiRequest): Promise<SuccessEnvelope<T>> {
  const { apiBaseUrl, apiTimeoutMs } = settings();
  const method = request.method ?? "GET";
  const cacheable = method === "GET" && request.revalidate !== undefined && !request.token;
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method,
    headers: {
      Accept: "application/json",
      ...(request.body !== undefined && !(request.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(request.token ? { Authorization: `Bearer ${request.token}` } : {}),
      ...request.headers,
    },
    body:
      request.body === undefined
        ? undefined
        : request.body instanceof FormData
          ? request.body
          : JSON.stringify(request.body),
    signal: AbortSignal.timeout(apiTimeoutMs),
    ...(cacheable
      ? { next: { revalidate: request.revalidate, tags: request.tags } }
      : { cache: "no-store" as const }),
  };

  let response: Response;
  try {
    response = await fetchImpl(buildUrl(apiBaseUrl, path, request.query), init);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new ApiError(
      0,
      timedOut ? CLIENT_ERROR_CODES.timeout : CLIENT_ERROR_CODES.unreachable,
      timedOut ? "The shop took too long to answer." : "The shop could not be reached.",
    );
  }

  const requestId = response.headers.get("x-request-id");
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      response.status || 502,
      CLIENT_ERROR_CODES.badResponse,
      "The shop sent an unreadable answer.",
      [],
      null,
      requestId,
    );
  }

  if (!response.ok || (body as { success?: boolean }).success !== true) {
    const error = body as Partial<ErrorEnvelope>;
    throw new ApiError(
      response.status,
      error.code ?? "ERROR",
      error.message ?? "Request failed",
      Array.isArray(error.errors) ? error.errors : [],
      error.data ?? null,
      requestId,
    );
  }
  return body as SuccessEnvelope<T>;
}

/** Calls the API from the server and returns the unwrapped `data`. */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  return (await call<T>(path, request)).data;
}

/** For list endpoints: the items and the pagination `meta`. */
export async function apiFetchPage<T>(
  path: string,
  request: ApiRequest = {},
): Promise<Paginated<T>> {
  const envelope = await call<T[]>(path, request);
  if (!envelope.meta) {
    throw new ApiError(
      502,
      CLIENT_ERROR_CODES.badResponse,
      "The shop sent a list without page information.",
    );
  }
  return { items: envelope.data, meta: envelope.meta };
}
