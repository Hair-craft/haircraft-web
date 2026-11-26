import "server-only";
import { apiFetch } from "./client";
import { isApiError } from "./errors";

/** The home page's editable content (owner, 2026-11-24: "make them flexible"). */
export interface HomeContent {
  /** The running lines under "Shop by concern", in order. */
  promiseLines: string[];
  /**
   * Which of the hero's built-in slides show (owner, 2026-11-26: "just mark it show or
   * hide"); an API from before then sends none, and every slide shows.
   */
  slides?: { key: string; title: string; shown: boolean }[];
}

/**
 * The running lines and the hero slides from the admin, refreshed at once when they
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
