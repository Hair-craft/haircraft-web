import { ListingPage, listingMetadata } from "@/components/listing/listing-page";

export function generateMetadata({ searchParams }: PageProps<"/shop">) {
  return listingMetadata(undefined, searchParams);
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return <ListingPage searchParams={searchParams} />;
}
