"use client";

import React from "react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full px-6 mt-auto relative z-10 border-t border-[var(--color-border)] bg-[var(--color-bg-soft)] backdrop-blur-[20px]"
      style={{ paddingBottom: "160px", paddingTop: "96px" }}
    >
      <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-8 text-center">

        {/* Logo - exact match from Navbar.tsx */}
        <Link href="/" className="site-logo">
          <div className="site-logo-dot" />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, alignItems: "center" }}>
            <span>ProvenMRR</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
              Revenue Market
            </span>
          </div>
        </Link>

        {/* Description */}
        <p className="w-full max-w-[800px] text-[var(--color-secondary)] text-sm leading-relaxed">
          The definitive database of verified startup revenue metrics.
          <br />
          Connect your Stripe and join a community of transparent founders.
        </p>

        {/* cleanly separated footer links */}
        <nav className="flex flex-wrap justify-center w-full" style={{ gap: "16px 32px" }}>
          {[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Use" },
            { href: "/refunds", label: "Sales & Refunds" },
            { href: "/legal", label: "Legal" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <div className="mt-2 text-xs text-[var(--color-muted)]">
          &copy; {currentYear} ProvenMRR. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
