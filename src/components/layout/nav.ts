import type { Category } from "@/lib/api/types";

/** Shop URLs, in one place so pages and menus agree. */
export const routes = {
  home: "/",
  shop: "/shop",
  category: (slug: string) => `/shop/${encodeURIComponent(slug)}`,
  search: "/search",
  account: "/account",
  wishlist: "/wishlist",
  cart: "/cart",
} as const;

export interface NavItem {
  label: string;
  href: string;
  children: NavItem[];
}

/** The category tree as menu items (only categories that have products, or children that do). */
export function categoryNav(categories: Category[]): NavItem[] {
  const toItem = (category: Category): NavItem | null => {
    const children = category.children.map(toItem).filter((item): item is NavItem => item !== null);
    if (category.productCount === 0 && children.length === 0) return null;
    return { label: category.name, href: routes.category(category.slug), children };
  };
  return categories.map(toItem).filter((item): item is NavItem => item !== null);
}
