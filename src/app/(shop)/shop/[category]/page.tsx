import { ListingPage, listingMetadata } from "@/components/listing/listing-page";

export async function generateMetadata({ params, searchParams }: PageProps<"/shop/[category]">) {
  return listingMetadata((await params).category, searchParams);
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/shop/[category]">) {
  return <ListingPage categorySlug={(await params).category} searchParams={searchParams} />;
}
