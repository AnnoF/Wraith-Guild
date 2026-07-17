import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", weight: ["500", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Wraith-Guild — Registre de guilde",
  description: "Inscriptions, personnages et compositions de raid de la guilde"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${oswald.variable} ${inter.variable}`}>
      <body className="font-ui min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
