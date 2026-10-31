import type { NextRequest } from "next/server";
import { getProducts } from "@/lib/api/catalog";
import type { ProductCard } from "@/lib/api/types";
import { bff } from "@/lib/bff/respond";
import { matchSteps, type MatchChoice } from "@/components/home/match";

export interface MatchResult {
  /** The best-rated product for the first search that found one (null: none at all). */
  product: ProductCard | null;
  /** How many products that search found. */
  total: number;
  /** The search that found it (looser than asked when `exact` is false). */
  choice: MatchChoice;
  exact: boolean;
}

/** A short, plain value from the address, or null. */
const value = (request: NextRequest, key: string) => {
  const raw = request.nextUrl.searchParams.get(key)?.trim();
  return raw && raw.length <= 80 ? raw : null;
};

/**
 * GET /bff/match?category=&texture=&color=: the home page's "Find your
 * match". Tries the strictest search first and loosens it until a product
 * turns up. Product lists are public and cached on the server, so the
 * browser may keep each answer for a minute.
 */
export async function GET(request: NextRequest) {
  const asked: MatchChoice = {
    category: value(request, "category"),
    texture: value(request, "texture"),
    color: value(request, "color"),
  };
  return bff(
    async (): Promise<MatchResult> => {
      const steps = matchSteps(asked);
      for (const [i, step] of steps.entries()) {
        const { items, meta } = await getProducts({
          category: step.category ?? undefined,
          texture: step.texture ? [step.texture] : undefined,
          color: step.color ? [step.color] : undefined,
          sort: "rating:desc",
          limit: 1,
        });
        if (items.length > 0)
          return { product: items[0], total: meta.total, choice: step, exact: i === 0 };
      }
      return { product: null, total: 0, choice: asked, exact: false };
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
