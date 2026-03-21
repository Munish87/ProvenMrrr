"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareMore, Search, Sparkles, Trophy, Users, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV_ITEMS = [
  { name: "BROWSE", href: "/browse", icon: Search },
  { name: "LEADERBOARD", href: "/leaderboard", icon: Trophy },
  { name: "COMMUNITY", href: "/community", icon: MessageSquareMore },
  { name: "CO-FOUNDERS", href: "/co-founders", icon: Users },
];

function isItemActive(pathname: string, name: string, href: string) {
  return pathname === href || (name === "BROWSE" && pathname === "/") || (name === "DASHBOARD" && pathname.startsWith("/dashboard"));
}

export function FloatingNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const dynamicItem = user 
    ? { name: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard }
    : { name: "SIGN IN", href: "/login", icon: LogIn };

  const navItems = [...NAV_ITEMS, dynamicItem];
  const activeIndex = navItems.findIndex((item) => isItemActive(pathname, item.name, item.href));

  return (
    <nav
      className="floating-nav"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        justifyContent: "space-around",
        width: "calc(100% - 32px)",
        maxWidth: 500,
        gap: 4,
        padding: 10,
        borderRadius: 999,
        background: "var(--floating-nav-bg)",
        backdropFilter: "blur(34px) saturate(165%)",
        WebkitBackdropFilter: "blur(34px) saturate(165%)",
        border: "1px solid var(--floating-nav-border)",
        boxShadow: "var(--floating-nav-shadow)",
        zIndex: 5000,
        ["--active-index" as string]: activeIndex >= 0 ? activeIndex : 0,
        opacity: loading ? 0.5 : 1,
        transition: "opacity 0.3s ease"
      }}
    >
      <div className="floating-nav-indicator" aria-hidden="true" />
      {navItems.map((item) => {
        const isActive = isItemActive(pathname, item.name, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`floating-nav-link ${isActive ? "is-active" : ""}`}
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "11px 4px",
              borderRadius: 999,
              textDecoration: "none",
              color: isActive ? "var(--color-text)" : "var(--color-secondary)",
              background: "transparent",
              boxShadow: "none",
              position: "relative",
              zIndex: 1,
              transform: isActive ? "translateY(-1px)" : "translateY(0)",
              transition: "color 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",
              opacity: isActive ? 1 : 0.82,
            }}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span className="floating-nav-label" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", opacity: isActive ? 1 : 0.78, textAlign: "center", lineHeight: 1.05, whiteSpace: "nowrap" }}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

