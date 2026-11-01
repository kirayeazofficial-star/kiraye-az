import StructuredData from "./components/StructuredData";
import { publicSiteUrl } from "../lib/site-url";
import { siteContact } from "../lib/site-contact";
import { LanguageProvider } from "./components/LanguageProvider";
import InstallPrompt from "./components/InstallPrompt";
import Toaster from "./components/Toaster";
import AnnouncementBar from "./components/AnnouncementBar";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./styles.css";
import "./rental.css";
import "./professional.css";
import "./polish.css";
import "./design-system.css";
import "./refine.css";
import "./site.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase:new URL(publicSiteUrl()),
  icons: { icon: [{url:"/icon.svg",type:"image/svg+xml"},{url:"/favicon-48.png",sizes:"48x48",type:"image/png"}], apple: [{url:"/apple-touch-icon.png",sizes:"180x180"}] },
  appleWebApp: { capable: true, title: "kirayeal.az", statusBarStyle: "default" },
  title: "Kirayə Al — kirayeal.az | Kirayə elanları",
  description: "Ev, avtomobil və motosiklet kirayəsi üçün elan platforması.",
  openGraph: { siteName: "kirayeal.az", locale: "az_AZ", type: "website", images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "kirayeal.az — Kirayə üçün bir ünvan" }] },
  twitter: { card: "summary_large_image", images: ["/og-default.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az">
      <body>
        <Script src="/browser-compat.js" strategy="beforeInteractive" />
        <AnnouncementBar />
        <InstallPrompt />
        <LanguageProvider>{children}</LanguageProvider>
        <Toaster />
        <StructuredData data={{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":`${publicSiteUrl()}/#organization`,name:"kirayeal.az",alternateName:["Kirayə Al","Kiraye Al","kirayeal"],url:publicSiteUrl(),logo:`${publicSiteUrl()}/icon-192.png`,email:siteContact.email,sameAs:[siteContact.instagram,siteContact.tiktok]},{"@type":"WebSite","@id":`${publicSiteUrl()}/#website`,name:"kirayeal.az",alternateName:["Kirayə Al","Kiraye Al az"],potentialAction:{"@type":"SearchAction",target:`${publicSiteUrl()}/?q={search_term_string}#elanlar`,"query-input":"required name=search_term_string"},url:publicSiteUrl(),inLanguage:"az-AZ",publisher:{"@id":`${publicSiteUrl()}/#organization`}}]}}/>
      </body>
    </html>
  );
}
