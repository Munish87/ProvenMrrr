import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Clock } from "lucide-react";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import { StatusBadge } from "@/components/startup/StatusBadge";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
    title: "Recently Added Startups | ProvenMRR",
    description: "Discover the latest verified startups joining the transparent MRR movement.",
};

// Revalidate every 10 minutes
export const revalidate = 600;

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)} M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString("en-US")} k`;
    return `$${n.toLocaleString("en-US")} `;
}

function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return `1d ago`;
    return `${diffInDays}d ago`;
}

export default async function RecentPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch up to 50 most recently verified startups
    const { data: recentStartups } = await supabase
        .from("startups")
        .select("id, name, category, description, created_at, is_listed_for_sale, sale_status_override, monthly_revenue, growth_rate, revenue_30d, is_anonymous, asking_price")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(50);

    const startups = recentStartups || [];

    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
            <Navbar user={user} />

            <main className="page-container" style={{ paddingTop: 100, paddingBottom: 120, maxWidth: 880 }}>
                {/* Header Title */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.04em", marginBottom: 16 }}>
                        Recently Added
                    </h1>
                    <p style={{ fontSize: 16, color: "var(--color-secondary)", lineHeight: 1.5, maxWidth: 600, margin: "0 auto 32px" }}>
                        Discover the latest startups joining the open startup movement.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <FrictionlessAddWrapper />
                    </div>
                </div>

                {/* Feed List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {startups.length === 0 ? (
                        <div className="card" style={{ padding: 48, textAlign: "center" }}>
                            <p style={{ color: "var(--color-secondary)" }}>No verified startups found.</p>
                        </div>
                    ) : (
                        startups.map((s) => {
                            const mrr = s.monthly_revenue ?? 0;
                            const arr = (mrr * 12);
                            const growth = s.growth_rate ?? 0;
                            const isSold = s.sale_status_override === "sold";
                            const relativeTime = getRelativeTime(s.created_at);

                            return (
                                <Link key={s.id} href={`/startup/${s.id}`} style={{ textDecoration: "none" }}>
                                    <div 
                                        className="card card-hover" 
                                        style={{ 
                                            padding: "24px", 
                                            display: "flex", 
                                            alignItems: "center", 
                                            gap: 20,
                                            background: isSold ? "rgba(255,255,255,0.05)" : "var(--color-surface)",
                                            border: isSold ? "1px solid rgba(255,255,255,0.1)" : "1px solid var(--color-border)",
                                            boxShadow: "var(--shadow-card)",
                                            color: "var(--color-text)"
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="startup-card-logo" style={{ 
                                            width: 56, 
                                            height: 56, 
                                            fontSize: 24, 
                                            flexShrink: 0,
                                            background: "var(--startup-card-logo-bg)",
                                            border: "1px solid var(--startup-card-logo-border)",
                                            color: "var(--color-text)",
                                            filter: s.is_anonymous ? "blur(5px)" : "none"
                                        }}>
                                            {s.name.charAt(0)}
                                        </div>

                                        {/* Left Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0, filter: s.is_anonymous ? "blur(5px)" : "none" }}>{s.name}</h3>
                                                {isSold && (
                                                    <span style={{ 
                                                        fontSize: 9, 
                                                        fontWeight: 800, 
                                                        padding: "2px 7px", 
                                                        borderRadius: 999, 
                                                        background: "#FEE2E2", 
                                                        color: "#991B1B",
                                                        letterSpacing: "0.04em"
                                                    }}>SOLD</span>
                                                )}
                                                {!isSold && s.is_listed_for_sale && <StatusBadge status={"sale" as any} />}
                                                <div style={{ 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    gap: 4, 
                                                    color: "var(--color-secondary)", 
                                                    fontSize: 12, 
                                                    background: "rgba(0,0,0,0.04)", 
                                                    padding: "2px 8px", 
                                                    borderRadius: 12 
                                                }}>
                                                    <Clock size={12} />
                                                    <span style={{ fontWeight: 600 }}>{relativeTime}</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 14, color: "var(--color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, filter: s.is_anonymous ? "blur(5px)" : "none" }}>
                                                {s.category && <><span style={{ fontWeight: 500 }}>{s.category}</span> · </>}
                                                {s.description || "No description provided."}
                                            </p>
                                        </div>

                                        {/* Right Metrics */}
                                        <div style={{ display: "flex", gap: 32, flexShrink: 0, alignItems: "center" }}>
                                            <div style={{ textAlign: "right", minWidth: 60 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-secondary)", marginBottom: 4 }}>MRR</p>
                                                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                                                    {(mrr > 0) ? fmtMoney(mrr) : "$0"}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 60 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-secondary)", marginBottom: 4 }}>ARR</p>
                                                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                                                    {(arr > 0) ? fmtMoney(arr) : "$0"}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 60 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-secondary)", marginBottom: 4 }}>Multiple</p>
                                                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                                                    {s.asking_price && mrr > 0 ? `${(s.asking_price / (mrr * 12)).toFixed(1)}x` : "—"}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right", width: 80 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-secondary)", marginBottom: 4 }}>Growth</p>
                                                <p className={growth >= 0 ? "g-up" : "g-down"} style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                                                    {growth !== 0 ? (
                                                        <>{growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}%</>
                                                    ) : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
