"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Inbox, Heart, Building2, User, Settings as SettingsIcon, CreditCard, LogOut, Mail, Send, Flame } from "lucide-react";
import { setDashboardRole } from "@/app/actions/user";

type DashboardRole = "buyer" | "seller";

const sellerNav = [
    { href: "/dashboard", label: "Overview", icon: Inbox },
    { href: "/dashboard/inbox", label: "Inbox", icon: Mail },
    { href: "/dashboard/startups", label: "My Startups", icon: Building2 },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const buyerNav = [
    { href: "/dashboard", label: "Overview", icon: Inbox },
    { href: "/dashboard/matchmaking", label: "Matchmaking", icon: Flame },
    { href: "/dashboard/interested", label: "Matches", icon: Heart },
    { href: "/dashboard/inbox", label: "Inbox", icon: Mail },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export default function Sidebar({ userEmail, userName, avatarUrl, role }: { userEmail?: string; userName?: string | null; avatarUrl?: string | null; role: DashboardRole }) {
    const pathname = usePathname();
    const navItems = role === "seller" ? sellerNav : buyerNav;

    return (
        <aside style={{
            width: 260,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            borderRight: "1px solid var(--sidebar-border)",
            background: "var(--sidebar-bg)",
            backdropFilter: "blur(28px) saturate(165%)",
            boxShadow: "var(--sidebar-shadow)",
            zIndex: 50
        }}>
            {/* Brand */}
            <div style={{ padding: "24px 20px 20px" }}>
                <Link href="/" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    color: "var(--color-text)",
                    fontWeight: 800,
                    fontSize: 17,
                }}>
                    <div className="site-logo-icon">
                        <img src="/logo-black.png" alt="ProvenMRR" className="logo-dark" />
                        <img src="/logo-white.png" alt="ProvenMRR" className="logo-light" />
                    </div>
                    ProvenMRR
                </Link>
            </div>

            {/* Role toggle */}
            <div style={{ padding: "0 16px 20px" }}>
                <div style={{ display: "flex", background: "var(--sidebar-toggle-bg)", borderRadius: 12, padding: "4px", gap: "4px", border: "1px solid var(--sidebar-toggle-border)" }}>
                    <button 
                        onClick={() => setDashboardRole("buyer")}
                        style={{ 
                            flex: 1, 
                            border: "none",
                            padding: "6px 0", 
                            borderRadius: "7px", 
                            background: role === "buyer" ? "var(--sidebar-toggle-active-bg)" : "transparent", 
                            boxShadow: role === "buyer" ? "var(--sidebar-toggle-active-shadow)" : "none",
                            fontSize: 12, 
                            fontWeight: 700, 
                            color: role === "buyer" ? "var(--color-text)" : "var(--color-secondary)", 
                            cursor: "pointer",
                        }}
                    >
                        Buyer
                    </button>
                    <button 
                        onClick={() => setDashboardRole("seller")}
                        style={{ 
                            flex: 1, 
                            border: "none",
                            padding: "6px 0", 
                            borderRadius: "7px", 
                            background: role === "seller" ? "var(--sidebar-toggle-active-bg)" : "transparent", 
                            boxShadow: role === "seller" ? "var(--sidebar-toggle-active-shadow)" : "none",
                            fontSize: 12, 
                            fontWeight: 700, 
                            color: role === "seller" ? "var(--color-text)" : "var(--color-secondary)", 
                            cursor: "pointer",
                        }}
                    >
                        Seller
                    </button>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "0 12px" }}>
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (pathname.startsWith("/dashboard/claim") && label === "My Startups");
                    return (
                        <Link key={label} href={href} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 8,
                            marginBottom: 2,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "var(--color-text)" : "var(--color-secondary)",
                            textDecoration: "none",
                            background: isActive ? "var(--sidebar-nav-active-bg)" : "transparent",
                            border: isActive ? "1px solid var(--sidebar-nav-active-border)" : "1px solid transparent",
                            boxShadow: isActive ? "var(--sidebar-nav-active-shadow)" : "none",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}>
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div style={{ padding: "12px 16px 16px", marginTop: "auto" }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, opacity: 0.6 }}>Signed in as</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    {avatarUrl ? (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0, border: "1px solid var(--sidebar-avatar-border)" }}>
                            <Image src={avatarUrl} alt="User Avatar" fill className="object-cover" unoptimized />
                        </div>
                    ) : (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sidebar-avatar-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: "var(--sidebar-avatar-shadow)" }}>
                            <User size={15} />
                        </div>
                    )}
                    <div style={{ flex: 1, overflow: "hidden" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                            {userName || userEmail?.split('@')[0] || "Founder"}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                            {userEmail || "Connect profile"}
                        </p>
                    </div>
                </div>
                <form action="/auth/signout" method="POST">
                    <button type="submit" style={{
                        width: "100%",
                        padding: "7px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--color-secondary)",
                        background: "var(--sidebar-footer-bg)",
                        border: "1px solid var(--sidebar-footer-border)",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}>
                        <LogOut size={13} />
                        Log out
                    </button>
                </form>
            </div>
        </aside>
    );
}
