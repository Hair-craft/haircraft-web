import "server-only";
import { isApiError } from "@/lib/api/errors";
import type { TokenPair } from "./cookies";
import { refreshRequest, type ShopperClient } from "./api";
import { refreshFailure, type RefreshFailure } from "./rules";

export type RefreshOutcome = { kind: "ok"; tokens: TokenPair } | { kind: RefreshFailure };

/**
 * Refreshes going on in this server process, by refresh token: requests that
 * arrive together (a page and its prefetches) share one refresh instead of
 * racing (a second refresh with the same token fails on the API).
 */
const inFlight = new Map<string, Promise<RefreshOutcome>>();

/** Refresh tokens the API has refused, so a dead token isn't sent again and again. */
const refused = new Map<string, number>();
const REFUSED_FOR_MS = 10 * 60 * 1000;

export function refreshSession(
  refreshToken: string,
  client: ShopperClient,
): Promise<RefreshOutcome> {
  const refusedAt = refused.get(refreshToken);
  if (refusedAt !== undefined && Date.now() - refusedAt < REFUSED_FOR_MS)
    return Promise.resolve({ kind: "keep" });

  const running = inFlight.get(refreshToken);
  if (running) return running;

  const work = (async (): Promise<RefreshOutcome> => {
    try {
      return { kind: "ok", tokens: await refreshRequest(refreshToken, client) };
    } catch (error) {
      if (!isApiError(error)) throw error;
      const failure = refreshFailure(error.status, error.code);
      if (failure !== "unavailable") refused.set(refreshToken, Date.now());
      return { kind: failure };
    } finally {
      // Keep the answer briefly for requests that were a moment behind.
      setTimeout(() => inFlight.delete(refreshToken), 5_000).unref?.();
      if (refused.size > 1000) refused.clear();
    }
  })();
  inFlight.set(refreshToken, work);
  return work;
}
