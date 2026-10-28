import StructuredData from "./components/StructuredData";
import { publicSiteUrl } from "../lib/site-url";
import { siteContact } from "../lib/site-contact";
import { LanguageProvider } from "./components/LanguageProvider";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import DesktopAdRails from "./components/DesktopAdRails";
import "./styles.css";
import "./rental.css";
import "./professional.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#143f3b",
};

export const metadata: Metadata = {
  metadataBase:new URL(publicSiteUrl()),
  icons: { icon: [{url:"/icon.svg",type:"image/svg+xml"},{url:"/favicon-48.png",sizes:"48x48",type:"image/png"}], apple: [{url:"/icon-192.png",sizes:"192x192"}] },
  title: "kirayeal.az — Kirayə elanları",
  description: "Ev, avtomobil və motosiklet kirayəsi üçün elan platforması.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az">
      <body>
        <Script src="/browser-compat.js" strategy="beforeInteractive" />
        <DesktopAdRails />
        <LanguageProvider>{children}</LanguageProvider>
        <StructuredData data={{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":`${publicSiteUrl()}/#organization`,name:"kirayeal.az",url:publicSiteUrl(),logo:`${publicSiteUrl()}/icon-192.png`,email:siteContact.email,telephone:"+994502191145",sameAs:[siteContact.instagram,siteContact.tiktok]},{"@type":"WebSite","@id":`${publicSiteUrl()}/#website`,name:"kirayeal.az",url:publicSiteUrl(),inLanguage:"az-AZ",publisher:{"@id":`${publicSiteUrl()}/#organization`}}]}}/>
      </body>
    </html>
  );
}
