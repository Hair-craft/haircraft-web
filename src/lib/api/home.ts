import "server-only";
import { apiFetch } from "./client";
import { isApiError } from "./errors";
import type { ImageUrls } from "./types";

/** The home page's editable content (owner, 2026-11-24: "make them flexible"). */
export interface HomeContent {
  /** The running lines under "Shop by concern", in order. */
  promiseLines: string[];
  /** Uploaded banners; null: the shop's built-in one. */
  banners: { desktop: ImageUrls | null; mobile: ImageUrls | null };
}

/**
 * The running lines and banners from the admin, refreshed at once when they
 * change there (tag `home`), or null when the API can't be reached: the shop
 * then shows its built-in ones.
 */
export async function getHomeContent(): Promise<HomeContent | null> {
  try {
    return await apiFetch<HomeContent>("/home", { revalidate: 300, tags: ["home"] });
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}
