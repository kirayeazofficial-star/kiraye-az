import { LanguageProvider } from "./components/LanguageProvider";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./rental.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#143f3b",
};

export const metadata: Metadata = {
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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
