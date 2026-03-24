"use client";

import {
    Sparkles, Cloud, Terminal, CreditCard,
    Megaphone, ShoppingBag, PenTool, Boxes, BarChart3,
    GraduationCap, Share2, Video,
    Headphones, Users, Home, Plane,
    BarChart2, MessageCircle, Bitcoin, Film, Gamepad2,
    Leaf, HeartPulse, Cpu, Scale, Store, Smartphone,
    Newspaper, CheckCircle, Briefcase, Shield, Wrench
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
    { name: "Analytics", label: "Analytics", icon: BarChart2, slug: "analytics" },
    { name: "Artificial Intelligence", label: "Artificial Intelligence", icon: Sparkles, slug: "artificial-intelligence" },
    { name: "Community", label: "Community", icon: MessageCircle, slug: "community" },
    { name: "Content Creation", label: "Content Creation", icon: Video, slug: "content-creation" },
    { name: "Crypto & Web3", label: "Crypto & Web3", icon: Bitcoin, slug: "crypto-web3" },
    { name: "Customer Support", label: "Customer Support", icon: Headphones, slug: "customer-support" },
    { name: "Design", label: "Design Tools", icon: PenTool, slug: "design" },
    { name: "Developer Tools", label: "Developer Tools", icon: Terminal, slug: "developer-tools" },
    { name: "E-commerce", label: "E-commerce", icon: ShoppingBag, slug: "e-commerce" },
    { name: "Education", label: "Education", icon: GraduationCap, slug: "education" },
    { name: "Entertainment", label: "Entertainment", icon: Film, slug: "entertainment" },
    { name: "Fintech", label: "Fintech", icon: CreditCard, slug: "fintech" },
    { name: "Games", label: "Games", icon: Gamepad2, slug: "games" },
    { name: "Green Tech", label: "Green Tech", icon: Leaf, slug: "green-tech" },
    { name: "Health & Fitness", label: "Health & Fitness", icon: HeartPulse, slug: "health-fitness" },
    { name: "IoT & Hardware", label: "IoT & Hardware", icon: Cpu, slug: "iot-hardware" },
    { name: "Legal", label: "Legal", icon: Scale, slug: "legal" },
    { name: "Marketing", label: "Marketing", icon: Megaphone, slug: "marketing" },
    { name: "Marketplace", label: "Marketplace", icon: Store, slug: "marketplace" },
    { name: "Mobile Apps", label: "Mobile Apps", icon: Smartphone, slug: "mobile-apps" },
    { name: "News & Magazines", label: "News & Magazines", icon: Newspaper, slug: "news-magazines" },
    { name: "No-Code", label: "No-Code", icon: Boxes, slug: "no-code" },
    { name: "Productivity", label: "Productivity", icon: CheckCircle, slug: "productivity" },
    { name: "Real Estate", label: "Real Estate", icon: Home, slug: "real-estate" },
    { name: "Recruiting & HR", label: "Recruiting & HR", icon: Users, slug: "recruiting-hr" },
    { name: "SaaS", label: "SaaS", icon: Cloud, slug: "saas" },
    { name: "Sales", label: "Sales", icon: Briefcase, slug: "sales" },
    { name: "Security", label: "Security", icon: Shield, slug: "security" },
    { name: "Social Media", label: "Social Media", icon: Share2, slug: "social-media" },
    { name: "Travel", label: "Travel", icon: Plane, slug: "travel" },
    { name: "Utilities", label: "Utilities", icon: Wrench, slug: "utilities" },
];

export function CategoryBrowser({
    activeSlug
}: {
    activeSlug?: string
}) {
    return (
        <section style={{ marginTop: activeSlug ? 0 : 32, marginBottom: activeSlug ? 0 : 40 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h2 style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "var(--color-text)",
                    marginBottom: 12,
                    letterSpacing: "-0.5px"
                }}>
                    {activeSlug ? "Browse other categories" : "Browse by category"}
                </h2>
                <p style={{
                    fontSize: 15,
                    color: "var(--color-secondary)",
                    maxWidth: 800,
                    margin: "0 auto",
                    fontWeight: 500,
                    opacity: 0.6
                }}>
                    {activeSlug
                        ? "Discover other industry niches and find your next acquisition."
                        : "Find your next acquisition by exploring verified startups across the industry."}
                </p>
            </div>

            <div
                className="glass"
                style={{
                    maxWidth: 1120,
                    margin: "0 auto",
                    padding: "28px 24px",
                    borderRadius: 40,
                    background: "var(--color-surface)",
                    boxShadow: "var(--shadow-card)",
                    border: "1px solid var(--color-border)",
                }}
            >
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 14,
                    maxWidth: 980,
                    margin: "0 auto",
                }}>
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeSlug === cat.slug;
                        return (
                            <Link
                                key={cat.name}
                                href={isActive ? "/" : `/category/${cat.slug}`}
                                className="category-pill"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "13px 18px",
                                    minHeight: 46,
                                    borderRadius: 100,
                                    background: isActive
                                        ? "linear-gradient(135deg, #7da2ff 0%, #5b7cff 46%, #3e58d8 100%)"
                                        : "var(--color-surface-strong)",
                                    border: isActive ? "1px solid rgba(255,255,255,0.42)" : "1px solid var(--color-border)",
                                    color: isActive ? "white" : "var(--color-text)",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isActive
                                        ? "0 18px 34px rgba(91,124,255,0.24), inset 0 1px 0 rgba(255,255,255,0.24)"
                                        : "var(--shadow-card)",
                                    backdropFilter: "blur(26px)",
                                    WebkitBackdropFilter: "blur(26px)",
                                    whiteSpace: "nowrap",
                                    textDecoration: "none",
                                    letterSpacing: "-0.01em"
                                }}
                            >
                                <Icon size={15} strokeWidth={1.9} />
                                {cat.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
