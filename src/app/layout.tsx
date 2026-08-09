import type { Metadata } from "next";
import { Rajdhani, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const rajdhani = Rajdhani({ subsets: ["latin"], variable: "--font-rajdhani", weight: ["500", "600", "700"] });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], variable: "--font-barlow-condensed", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Wraith",
  description: "Inscriptions, personnages et compositions de raid de la guilde"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${rajdhani.variable} ${barlowCondensed.variable}`}>
      <body className="font-ui min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
