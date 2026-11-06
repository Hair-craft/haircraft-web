import "server-only";
import { type Faq, type FaqGroup, faqGroups, homeFaqs } from "@/content/faq";
import { apiFetch } from "./client";
import { CATEGORY_REVALIDATE_SECONDS } from "./catalog";
import { isApiError } from "./errors";
import { getShopPolicies } from "./shop";

/** The built-in questions shown on the home page when the API can't be reached. */
const HOME_FAQ_COUNT = 4;

/** `GET /faqs`: the questions edited in the admin (owner, 2026-11-05). */
export interface FaqsResponse {
  /** The FAQ page: groups with at least one shown question, in order. */
  groups: { id: string; heading: string; faqs: (Faq & { id: string })[] }[];
  /** The home page's questions, in order. */
  home: (Faq & { id: string })[];
}

export interface ShopFaqs {
  groups: FaqGroup[];
  home: Faq[];
  /** True when these are the shop's built-in questions (the API can't be reached or has none). */
  builtIn: boolean;
}

/**
 * The FAQ page's groups and the home page's questions, as edited in the
 * admin. Refreshed with the catalogue (an admin change refreshes it at
 * once). When the API can't be reached, or no question is shown, the shop's
 * own questions are used, so neither page is ever empty.
 */
export async function getFaqs(): Promise<ShopFaqs> {
  try {
    const data = await apiFetch<FaqsResponse>("/faqs", {
      revalidate: CATEGORY_REVALIDATE_SECONDS,
      tags: ["categories"],
    });
    if (data.groups.length > 0)
      return {
        groups: data.groups.map((group) => ({
          id: group.id,
          heading: group.heading,
          faqs: group.faqs.map(({ question, answer }) => ({ question, answer })),
        })),
        home: data.home.map(({ question, answer }) => ({ question, answer })),
        builtIn: false,
      };
  } catch (error) {
    if (!isApiError(error)) throw error;
  }
  return {
    groups: faqGroups(await getShopPolicies()),
    home: homeFaqs.slice(0, HOME_FAQ_COUNT),
    builtIn: true,
  };
}
