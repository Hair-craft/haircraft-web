import { ShopChrome } from "@/components/layout/shop-chrome";
import { getSession } from "@/lib/session/session";

/**
 * Every shop page: header, footer and (from S6) the visitor's session.
 * Reading the session cookies makes shop pages render per request, so the
 * header can show the account and cart; catalogue data is still cached.
 */
export default async function ShopLayout({ children }: LayoutProps<"/">) {
  await getSession();
  return <ShopChrome>{children}</ShopChrome>;
}
