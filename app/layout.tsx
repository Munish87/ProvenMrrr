import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeController } from "@/components/theme/ThemeController";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ProvenMRR – Verified Startup Revenue Database",
  description: "Browse verified MRR data from real startups. Connect Stripe, get your AI Health Score, and securely connect with buyers and co-founders.",
  keywords: ["startup", "MRR", "ARR", "Stripe", "revenue", "health score", "SaaS metrics"],
  openGraph: {
    type: "website",
    siteName: "ProvenMRR",
    title: "ProvenMRR – Verified Startup Revenue + AI Health Scoring",
    description: "Connect Stripe. Verify revenue. Share your health score.",
  },
};

import { FloatingNav } from "@/components/layout/FloatingNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="antialiased" suppressHydrationWarning style={{ backgroundColor: "var(--color-bg)" }}>
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: -1,
            background: "var(--app-shell-overlay)",
          }}
        />
        <AuthProvider>
          <PageTransition>{children}</PageTransition>
          <FloatingNav />
        </AuthProvider>
        <ThemeController />
      </body>
    </html>
  );
}
