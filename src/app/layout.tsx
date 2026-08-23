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

        <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>

      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
      
    </html>
  );
}
