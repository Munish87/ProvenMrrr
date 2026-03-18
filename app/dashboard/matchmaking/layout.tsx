"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { href: "/dashboard/matchmaking", label: "Matches" },
    { href: "/dashboard/matchmaking/preferences", label: "Preferences" },
    { href: "/dashboard/matchmaking/insights", label: "Insights" }
];

export default function MatchmakingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                    Buyer Matchmaking
                </h1>
                <p style={{ color: "var(--color-secondary)", fontSize: 15 }}>
                    Discover startups that perfectly align with your acquisition criteria.
                </p>
            </div>

            <nav style={{ 
                display: "flex", 
                gap: 24, 
                borderBottom: "1px solid var(--color-border)",
                marginBottom: 32
            }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            style={{
                                paddingBottom: 12,
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? "var(--color-text)" : "var(--color-secondary)",
                                borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                                textDecoration: "none",
                                fontSize: 14,
                                transition: "all 0.2s"
                            }}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {children}
        </div>
    );
}
