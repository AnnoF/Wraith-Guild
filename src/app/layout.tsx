import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

// Polices auto-hébergées (variables, sous-ensemble latin, licence SIL OFL, voir
// src/app/fonts/LICENSE-*.txt) : le build ne dépend plus de Google Fonts.
const cinzel = localFont({
  src: "./fonts/cinzel-latin-wght-normal.woff2",
  variable: "--font-cinzel",
  weight: "400 900",
  display: "swap"
});
const ebGaramond = localFont({
  src: "./fonts/eb-garamond-latin-wght-normal.woff2",
  variable: "--font-eb-garamond",
  weight: "400 800",
  display: "swap"
});

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
