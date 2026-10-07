"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart/cart-context";
import { ProductCard } from "@/components/product/product-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { moveToBagAction, toggleSaveAction } from "@/lib/wishlist/actions";
import { cx } from "@/lib/cx";
import type { Wishlist, WishlistItem } from "@/lib/wishlist/rules";
import { markMoving, useWishlist } from "./wishlist-ui";

/** The page heading; the count follows what's left on the page. */
export function WishlistHeading({ count }: { count: number | null }) {
  return <h1 className="mt-3 font-display text-5xl">My wishlist{count ? ` (${count})` : ""}</h1>;
}

/** The wishlist page's contents: saved products with Move to bag and Remove. */
export function WishlistView({ initial }: { initial: Wishlist }) {
  const [items, setItems] = useState(initial.items);
  const { adopt } = useWishlist();
  const heading = <WishlistHeading count={items.length} />;

  if (items.length === 0)
    return (
      <>
        {heading}
        <div className="mt-10 flex flex-col items-center gap-4 rounded-[2rem] bg-white/70 px-6 py-14 text-center">
          <p className="font-display text-3xl">Nothing saved yet</p>
          <p className="text-deep/70">
            Press the heart on anything you like, and it waits for you here.
          </p>
          <ButtonLink href="/shop">Shop all</ButtonLink>
        </div>
      </>
    );

  const gone = (productId: string, savedIds: string[], count: number) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
    adopt(savedIds, count);
  };

  return (
    <>
      {heading}
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.productId} className="flex">
            <SavedProduct item={item} onGone={gone} />
          </li>
        ))}
      </ul>
    </>
  );
}

function SavedProduct({
  item,
  onGone,
}: {
  item: WishlistItem;
  onGone: (productId: string, savedIds: string[], count: number) => void;
}) {
  const router = useRouter();
  const { adopt: adoptCart, openDrawer } = useCart();
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState<string | null>(null);

  const remove = () =>
    startTransition(async () => {
      const result = await toggleSaveAction(item.productId, false);
      if (result.savedIds) onGone(item.productId, result.savedIds, result.count ?? 0);
      else setProblem(result.error);
    });

  const move = () =>
    startTransition(async () => {
      const result = await moveToBagAction(item.productId, item.slug);
      if (result.kind === "added") {
        adoptCart(result.cart);
        onGone(item.productId, result.savedIds, result.count);
        openDrawer();
      } else if (result.kind === "choose") {
        markMoving(item.productId);
        router.push(result.href);
      } else setProblem(result.error);
    });

  return (
    <div className={cx("flex w-full flex-col", pending && "opacity-60 transition-opacity")}>
      {item.available && item.product ? (
        <ProductCard product={item.product} heart={false} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-white/50 p-4 text-center text-sm text-deep/70">
            No longer available
          </div>
          <p className="px-1 font-display text-xl text-deep/70">{item.name}</p>
        </div>
      )}
      <div className="mt-auto flex flex-col gap-2 px-1 pt-3">
        {item.available && item.product ? (
          item.product.inStock ? (
            <Button size="sm" onClick={move} disabled={pending}>
              Move to bag
            </Button>
          ) : (
            <Button size="sm" disabled>
              Sold out
            </Button>
          )
        ) : null}
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Remove ${item.name} from your wishlist`}
          className="text-sm text-deep/70 underline-offset-4 hover:text-deep hover:underline disabled:opacity-40"
        >
          Remove
        </button>
        {problem ? (
          <p role="alert" className="text-sm text-red-800">
            {problem}
          </p>
        ) : null}
      </div>
    </div>
  );
}
