"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Inbox, Heart, Building2, User, Settings as SettingsIcon, CreditCard, LogOut, Mail, Send } from "lucide-react";
import { setDashboardRole } from "@/app/actions/user";

type DashboardRole = "buyer" | "seller";

const sellerNav = [
    { href: "/dashboard", label: "Overview", icon: Inbox },
    { href: "/dashboard/inbox", label: "Inbox", icon: Mail },
    { href: "/dashboard/startups", label: "My Startups", icon: Building2 },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

const buyerNav = [
    { href: "/dashboard", label: "Overview", icon: Inbox },
    { href: "/dashboard/interested", label: "Interested", icon: Heart },
    { href: "/dashboard/inbox", label: "Inbox", icon: Mail },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export default function Sidebar({ userEmail, avatarUrl, role }: { userEmail?: string; avatarUrl?: string | null; role: DashboardRole }) {
    const pathname = usePathname();
    const navItems = role === "seller" ? sellerNav : buyerNav;

    return (
        <aside style={{
            width: 220,
            flexShrink: 0,
            backgroundColor: "var(--color-card)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            zIndex: 40,
        }}>
            {/* Brand */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--color-border)" }}>
                <Link href="/" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                    color: "var(--color-text)",
                    fontWeight: 700,
                    fontSize: 16,
                }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
                    Vetra
                </Link>
            </div>

            {/* Role toggle */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 8, padding: 3, gap: 2 }}>
                    <button 
                        onClick={() => setDashboardRole("buyer")}
                        style={{ 
                            flex: 1, 
                            padding: "5px 0", 
                            borderRadius: 6, 
                            border: role === "buyer" ? "1px solid var(--color-border)" : "none", 
                            background: role === "buyer" ? "white" : "transparent", 
                            fontSize: 12, 
                            fontWeight: role === "buyer" ? 600 : 500, 
                            color: role === "buyer" ? "var(--color-text)" : "var(--color-secondary)", 
                            cursor: "pointer" 
                        }}
                    >
                        Buyer
                    </button>
                    <button 
                        onClick={() => setDashboardRole("seller")}
                        style={{ 
                            flex: 1, 
                            padding: "5px 0", 
                            borderRadius: 6, 
                            border: role === "seller" ? "1px solid var(--color-border)" : "none", 
                            background: role === "seller" ? "white" : "transparent", 
                            fontSize: 12, 
                            fontWeight: role === "seller" ? 600 : 500, 
                            color: role === "seller" ? "var(--color-text)" : "var(--color-secondary)", 
                            cursor: "pointer" 
                        }}
                    >
                        Seller
                    </button>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 12px 0" }}>
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (pathname.startsWith("/dashboard/claim") && label === "My Startups");
                    return (
                        <Link key={label} href={href} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            borderRadius: 8,
                            marginBottom: 2,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "var(--color-text)" : "var(--color-secondary)",
                            textDecoration: "none",
                            background: isActive ? "#F3F4F6" : "transparent",
                            transition: "background 0.12s, color 0.12s",
                        }}>
                            <Icon size={15} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Signed in as</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    {avatarUrl ? (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                            <Image src={avatarUrl} alt="User Avatar" fill className="object-cover" unoptimized />
                        </div>
                    ) : (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                            <User size={14} />
                        </div>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {userEmail || "Founder"}
                    </p>
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
                        background: "transparent",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "color 0.12s",
                    }}>
                        <LogOut size={13} />
                        Log out
                    </button>
                </form>
            </div>
        </aside>
    );
}
