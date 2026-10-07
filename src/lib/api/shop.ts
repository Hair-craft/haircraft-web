import "server-only";
import type { ShopPolicies } from "@/lib/info/policies";
import { apiFetch } from "./client";
import { isApiError } from "./errors";

/** The shop's rules change rarely; information pages refresh them every 10 minutes. */
export const POLICIES_REVALIDATE_SECONDS = 600;

/**
 * The delivery, payment and cash-on-delivery rules (backend B15), or null
 * when the API can't be reached: pages then leave the numbers out rather than
 * guess them.
 */
export async function getShopPolicies(): Promise<ShopPolicies | null> {
  try {
    return await apiFetch<ShopPolicies>("/shop/policies", {
      revalidate: POLICIES_REVALIDATE_SECONDS,
      tags: ["shop-policies"],
    });
  } catch (error) {
    if (isApiError(error)) return null;
    throw error;
  }
}
