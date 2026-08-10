import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "BPS Data Matching System",
  description: "Sistem Pencocokan Data - Badan Pusat Statistik Kota Malang",
  keywords: ["BPS", "data matching", "statistics", "government"],
  authors: [{ name: "BPS Kota Malang" }],
};

type LayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="id" className={`${publicSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
