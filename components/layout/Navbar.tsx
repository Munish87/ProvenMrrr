"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  user: any;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          <div className="site-logo-icon">
            <img src="/logo-black.png" alt="ProvenMRR" className="logo-dark" fetchPriority="high" />
            <img src="/logo-white.png" alt="ProvenMRR" className="logo-light" fetchPriority="high" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span>ProvenMRR</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
              Revenue Market
            </span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!user ? (
            <>
              <Link href="/login" className="nav-link">Sign in</Link>
              <Link href="/login" className="btn btn-primary btn-sm">Join ProvenMRR</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className={`nav-link ${pathname?.startsWith("/dashboard") ? "active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="btn btn-secondary btn-sm" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <LogOut size={14} />
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
