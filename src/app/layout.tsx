import type { Metadata } from "next";
import { Cinzel, EB_Garamond } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["500", "600", "700"] });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--font-eb-garamond", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Wraith",
  description: "Inscriptions, personnages et compositions de raid de la guilde"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cinzel.variable} ${ebGaramond.variable}`}>
      <body className="font-ui min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
