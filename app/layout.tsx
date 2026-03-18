import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Vetra — Verified Startup Revenue Database",
  description: "Browse verified MRR data from real startups. Connect Stripe, get your AI Health Score, and securely connect with buyers and co-founders.",
  keywords: ["startup", "MRR", "ARR", "Stripe", "revenue", "health score", "SaaS metrics"],
  openGraph: {
    type: "website",
    siteName: "Vetra",
    title: "Vetra — Verified Startup Revenue + AI Health Scoring",
    description: "Connect Stripe. Verify revenue. Share your health score.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased" style={{ background: "#FAFAFA" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
