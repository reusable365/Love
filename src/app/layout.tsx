import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F5E6E0",
};

export const metadata: Metadata = {
  title: "Eternal Memories — Your Daily Love Surprise",
  description:
    "A romantic app for couples. Every morning, rediscover a shared photo and song. Open via NFC.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eternal Memories",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable} ${playfair.variable} ${caveat.variable}`}>
      <body className="font-[var(--font-inter)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
