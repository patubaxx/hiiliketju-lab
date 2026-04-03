import type { Metadata } from "next";
import { Geist_Mono, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiiliketju",
  description:
    "Techno-economic scenario calculator: compare CO₂ + H₂ → CH₄ with hydrogen sales, with time-varying electricity and CO₂ inputs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${sourceSerif.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="app-page-surface flex min-h-full flex-col text-foreground">
        <main className="min-h-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
