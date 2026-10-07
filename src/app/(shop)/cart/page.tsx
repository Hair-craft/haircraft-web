import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApiUnavailable } from "@/components/api-unavailable";
import { CartPageView } from "@/components/cart/cart-page";
import { isApiError } from "@/lib/api/errors";
import type { Cart } from "@/lib/cart/rules";
import { CART_PROBLEMS, readCart, type CartProblemCode } from "@/lib/cart/server";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: false },
};

/** `/cart`: the whole bag, with quantities, problems and the summary. */
export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const query = await searchParams;
  // Only known codes are shown, in the shop's own words (never text from the address).
  const code = typeof query.problem === "string" ? query.problem : "";
  // (An own-property check: `in` would also accept names like "constructor".)
  const problem = Object.hasOwn(CART_PROBLEMS, code)
    ? CART_PROBLEMS[code as CartProblemCode]
    : null;

  let cart: Cart | null = null;
  try {
    cart = await readCart();
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (error.status === 401) redirect("/bff/session/end?next=/cart");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <p className="text-xs tracking-[0.35em] text-deep-soft uppercase">Shopping bag</p>
      <h1 className="mt-3 font-display text-5xl">Your bag</h1>
      {cart ? (
        <CartPageView initial={cart} problem={problem} />
      ) : (
        <ApiUnavailable retryHref="/cart" />
      )}
    </div>
  );
}
