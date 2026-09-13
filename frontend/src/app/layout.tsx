import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Noma Events — Que se passe-t-il au Gabon ?",
    template: "%s | Noma Events",
  },
  description:
    "Découvrez, réservez et vivez les meilleurs événements du Gabon : concerts, festivals, culture, sport et plus encore.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Noma Events",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col bg-ivory font-sans text-ink antialiased">
        <QueryProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
