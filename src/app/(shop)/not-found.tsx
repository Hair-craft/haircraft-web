import type { Metadata } from "next";
import { NotFoundMessage } from "@/components/not-found-message";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** A shop page that finds nothing (e.g. an unknown category): the shop layout is already around it. */
export default function ShopNotFound() {
  return <NotFoundMessage />;
}
