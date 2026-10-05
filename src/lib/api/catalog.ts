import "server-only";
import { apiFetch } from "./client";
import type { Category } from "./types";

/** Categories change rarely; the menu is refreshed every 5 minutes. */
export const CATEGORY_REVALIDATE_SECONDS = 300;

/** Active categories as a tree (top level with children). */
export function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories", {
    revalidate: CATEGORY_REVALIDATE_SECONDS,
    tags: ["categories"],
  });
}
