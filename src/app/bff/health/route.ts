import { apiFetch } from "@/lib/api/client";
import { bff } from "@/lib/bff/respond";

/**
 * GET /bff/health: is the storefront able to reach the API? The first BFF
 * route, and the pattern for later ones (cart, wishlist…): the browser calls
 * the storefront, the storefront calls the API on the server.
 */
export async function GET() {
  return bff(async () => {
    await apiFetch<unknown>("/health/live");
    return { storefront: "ok", api: "ok" };
  });
}
