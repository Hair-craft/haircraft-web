import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { WishlistHeading, WishlistView } from "@/components/wishlist/wishlist-page";
import { isApiError } from "@/lib/api/errors";
import { getSession } from "@/lib/session/session";
import type { Wishlist } from "@/lib/wishlist/rules";
import { getWishlist } from "@/lib/wishlist/server";

export const metadata: Metadata = {
  title: "My wishlist",
  robots: { index: false, follow: false },
};

/** `/wishlist` (signed in; proxy.ts sends guests to sign in first). */
export default async function WishlistPage() {
  const { accessToken } = await getSession();
  if (!accessToken) redirect("/sign-in?next=/wishlist");

  let wishlist: Wishlist | null = null;
  try {
    wishlist = await getWishlist(accessToken);
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
      redirect("/bff/session/end?next=/wishlist");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">Saved for later</p>
      {wishlist ? (
        <WishlistView initial={wishlist} />
      ) : (
        <>
          <WishlistHeading count={null} />
          <ApiUnavailable retryHref="/wishlist" />
        </>
      )}
    </div>
  );
}
