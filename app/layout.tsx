import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "kirayeal.az — Kirayə elanları",
  description: "Ev, avtomobil və motosiklet kirayəsi üçün elan platforması.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
