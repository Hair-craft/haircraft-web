import { ListingPage, searchMetadata } from "@/components/listing/listing-page";

export function generateMetadata({ searchParams }: PageProps<"/search">) {
  return searchMetadata(searchParams);
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return <ListingPage search searchParams={searchParams} />;
}
