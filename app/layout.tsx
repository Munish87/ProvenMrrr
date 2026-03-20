import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeController } from "@/components/theme/ThemeController";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://provenmrr.com"),
  title: {
    default: "ProvenMRR – Verified Startup Revenue Database",
    template: "%s | ProvenMRR",
  },
  description: "Browse verified MRR data from real startups. Connect Stripe, get your AI Health Score, and securely connect with buyers and co-founders.",
  keywords: ["startup", "MRR", "ARR", "Stripe", "revenue", "health score", "SaaS metrics", "verified revenue"],
  authors: [{ name: "ProvenMRR" }],
  creator: "ProvenMRR Team",
  publisher: "ProvenMRR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://provenmrr.com",
    siteName: "ProvenMRR",
    title: "ProvenMRR – Verified Startup Revenue + AI Health Scoring",
    description: "Connect Stripe. Verify revenue. Share your health score.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProvenMRR Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProvenMRR – Verified Startup Revenue + AI Health Scoring",
    description: "Connect Stripe. Verify revenue. Share your health score.",
    creator: "@provenmrr",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://provenmrr.com",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo-black.png", type: "image/png" },
    ],
    apple: "/logo-black.png",
  },
};

import { FloatingNav } from "@/components/layout/FloatingNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Footer } from "@/components/layout/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-theme="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('provenmrr-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}",
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div
          aria-hidden="true"
          className="theme-overlay"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: -1,
            background: "var(--app-shell-overlay, transparent)",
          }}
        />
        <AuthProvider>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <PageTransition>{children}</PageTransition>
            <Footer />
          </div>
          <FloatingNav />
        </AuthProvider>
        <ThemeController />
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

