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
        {children}
      </body>
    </html>
  );
}
