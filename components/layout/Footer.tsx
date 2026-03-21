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
          <div className="site-logo-icon">
            <img src="/logo-black.png" alt="ProvenMRR" className="logo-dark" />
            <img src="/logo-white.png" alt="ProvenMRR" className="logo-light" />
          </div>
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

        {/* Popular Categories for SEO */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6 }}>
            Browse by Category
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 20px" }}>
            {[
              { label: "SaaS", slug: "saas" },
              { label: "AI", slug: "artificial-intelligence" },
              { label: "Fintech", slug: "fintech" },
              { label: "Marketing", slug: "marketing" },
              { label: "Developer Tools", slug: "developer-tools" },
              { label: "E-commerce", slug: "e-commerce" },
            ].map((cat) => (
              <Link 
                key={cat.slug} 
                href={`/category/${cat.slug}`}
                style={{ fontSize: 13, color: "var(--color-secondary)", textDecoration: "none", fontWeight: 500 }}
                className="hover:text-[var(--color-text)] transition-colors"
              >
                {cat.label}
              </Link>
            ))}
            <Link 
               href="/browse"
               style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}
            >
              View all &rarr;
            </Link>
          </div>
        </div>

        {/* cleanly separated footer links */}
        <nav className="flex flex-wrap justify-center w-full" style={{ gap: "16px 32px" }}>
          {[
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Use" },
            { href: "/refunds", label: "Sales & Refunds" },
            { href: "/legal", label: "Legal" },
            { href: "/contact", label: "Contact" },
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
