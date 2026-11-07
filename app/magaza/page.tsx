import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StoresList from "./StoresList";
export const metadata: Metadata = { title: "Mağazalar | kirayeal.az", description: "kirayeal.az-da kirayə verən mağazalar.", alternates: { canonical: "/magaza" } };
export default function StoresPage() {
  return <><Header /><main className="wrap kzStoresPage"><h1 className="kzPageTitle">Mağazalar</h1><StoresList /></main><Footer /></>;
}
