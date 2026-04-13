import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeddingsByPK | Smart Gallery",
  description: "Premium self-hosted smart gallery for wedding clients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 relative selection:bg-gold-500/30 selection:text-gold-100">
        <SplashScreen />
        <main className="relative z-10 w-full overflow-hidden flex-grow flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
