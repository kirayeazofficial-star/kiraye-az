import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import OwnedListing from "../../../components/OwnedListing";
export const metadata = {
  title: "Elanın şəxsi önbaxışı | kirayeal.az",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main className="wrap listingDetailPage">
        <OwnedListing id={id} />
      </main>
      <Footer />
    </>
  );
}
