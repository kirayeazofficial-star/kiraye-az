import ListingForm from "../../components/ListingForm";
export default async function EditListing({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingForm listingId={id} />;
}
