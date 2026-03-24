import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import { HealthScoreBadge } from "@/components/startup/HealthScoreBadge";
import { DashboardStartupRow } from "@/components/startup/DashboardStartupRow";
import { TrendingUp, Building2, Zap, ArrowRight, Plus, Heart, Send, Globe } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata = { title: "Dashboard — ProvenMRR" };

// Cache for 30 seconds to speed up repeat visits while keeping data fresh for dashboard
export const revalidate = 30;

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const cookieStore = await cookies();
    const role = (cookieStore.get("dashboard_role")?.value as "buyer" | "seller") || "seller";

    if (role === "buyer") {
        // Fetch Primary Buyer Data in parallel
        const [watchlistsRes, sentOffersRes, totalListedRes] = await Promise.all([
            supabase.from("watchlists").select("startup_id").eq("user_id", user.id).returns<{ startup_id: string }[]>(),
            supabase.from("offers").select("id, amount, status, startup_id, created_at").eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(3).returns<{ id: string; amount: number; status: string; startup_id: string; created_at: string }[]>(),
            supabase.from("startups").select("id", { count: "exact", head: true }).eq("is_listed_for_sale", true)
        ]);

        const watchlists = watchlistsRes.data;
        const sentOffers = sentOffersRes.data;
        const totalListedCount = totalListedRes.count;

        // Fetch Secondary Data (Startup details) in parallel
        const sentStartupIds = (sentOffers ?? []).map(o => o.startup_id);
        const savedStartupIds = (watchlists ?? []).map(w => w.startup_id);

        const [sentStartupsRes, savedStartupsRes] = await Promise.all([
            sentStartupIds.length > 0
                ? supabase.from("startups").select("id, name").in("id", sentStartupIds).returns<{ id: string; name: string }[]>()
                : Promise.resolve({ data: [] }),
            savedStartupIds.length > 0
                ? supabase.from("startups").select("id, name, is_verified, is_listed_for_sale").in("id", savedStartupIds).limit(5).returns<{ id: string; name: string; is_verified: boolean; is_listed_for_sale: boolean }[]>()
                : Promise.resolve({ data: [] })
        ]);

        const sentStartupMap = new Map((sentStartupsRes.data ?? []).map(s => [s.id, s.name]));
        const savedStartups = savedStartupsRes.data;

        const stats = [
            { label: "Saved Startups", value: String(watchlists?.length ?? 0), icon: Heart, iconColor: "#EC4899" },
            { label: "Offers Sent", value: String(sentOffers?.length ?? 0), icon: Send, iconColor: "#6366F1" },
            { label: "Market Listings", value: String(totalListedCount ?? 0), icon: Globe, iconColor: "#10B981" },
        ];

        return (
            <div style={{ maxWidth: 900 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-1px", marginBottom: 6 }}>
                        Acquisition Dashboard 🔍
                    </h1>
                    <p style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 500 }}>Manage your saved startups and active offers.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                    {stats.map(({ label, value, icon: Icon, iconColor }) => (
                        <div key={label} className="card">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                <p className="metric-label">{label}</p>
                                <Icon size={16} color={iconColor} />
                            </div>
                            <p style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-1px" }}>{value}</p>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", letterSpacing: "0.02em", textTransform: "uppercase" }}>Pinned on Watchlist</h2>
                        <Link href="/dashboard/interested" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-accent)", fontWeight: 700, textDecoration: "none" }}>
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    {(savedStartups ?? []).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "56px 24px" }}>
                            <Heart size={32} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
                            <p style={{ color: "var(--color-secondary)", marginBottom: 20, fontSize: 14 }}>No saved startups yet.</p>
                            <Link href="/browse" className="btn btn-primary">
                                Find startups to buy
                            </Link>
                        </div>
                    ) : (
                        <div>
                            {(savedStartups ?? []).map((startup) => (
                                <Link key={startup.id} href={`/startup/${startup.id}`} style={{ textDecoration: "none", display: "block" }}>
                                    <div className="hover:bg-gray-50" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "14px 20px",
                                        borderBottom: "1px solid var(--color-border)",
                                        transition: "background 0.12s",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div className="startup-card-logo" style={{ width: 36, height: 36, fontSize: 14 }}>
                                                {startup.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{startup.name}</p>
                                                <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 1 }}>
                                                    {startup.is_verified ? "✓ Verified" : "Not verified"} · Listed for Sale
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} color="var(--color-border)" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>Recently Sent Offers</h2>
                        <Link href="/dashboard/sent-offers" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>

                    {(sentOffers ?? []).length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 24px" }}>
                            <p style={{ color: "var(--color-secondary)", fontSize: 13 }}>No offers sent yet.</p>
                        </div>
                    ) : (
                        <div>
                            {sentOffers!.map((offer) => (
                                <Link key={offer.id} href={`/dashboard/sent-offers`} style={{ textDecoration: "none", display: "block" }}>
                                    <div className="hover:bg-white/[0.03]" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "16px 24px",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        transition: "all 0.2s",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div className="startup-card-logo" style={{ width: 32, height: 32, fontSize: 12 }}>
                                                {(sentStartupMap.get(offer.startup_id) || "U").charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{sentStartupMap.get(offer.startup_id) || "Project"}</p>
                                                <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 1 }}>
                                                    ${Number(offer.amount).toLocaleString()} · {offer.status}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 11, color: "var(--color-secondary)" }}>
                                            {new Date(offer.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- Seller Logic (Default) ---
    const { data: startups } = await supabase
        .from("startups")
        .select("id, name, is_verified, is_listed_for_sale")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .returns<{ id: string; name: string; is_verified: boolean; is_listed_for_sale: boolean }[]>();

    const startupIds = (startups ?? []).map((s) => s.id);

    // Fetch Health Scores and Snapshots in parallel
    const [healthScoresRes, snapshotsRes] = await Promise.all([
        startupIds.length > 0
            ? supabase.from("health_scores").select("startup_id, score, risk_level, created_at").in("startup_id", startupIds).order("created_at", { ascending: false }).returns<{ startup_id: string; score: number; risk_level: string; created_at: string }[]>()
            : Promise.resolve({ data: [] }),
        startupIds.length > 0
            ? supabase.from("revenue_snapshots").select("startup_id, mrr, growth_rate").in("startup_id", startupIds).order("snapshot_date", { ascending: false }).returns<{ startup_id: string; mrr: number; growth_rate: number }[]>()
            : Promise.resolve({ data: [] })
    ]);

    const healthScores = healthScoresRes.data;
    const snapshots = snapshotsRes.data;

    const scoreMap = new Map<string, number>();
    for (const hs of healthScores ?? []) if (!scoreMap.has(hs.startup_id)) scoreMap.set(hs.startup_id, hs.score);
    const snapMap = new Map<string, { mrr: number; growth_rate: number }>();
    for (const sn of snapshots ?? []) if (!snapMap.has(sn.startup_id)) snapMap.set(sn.startup_id, sn);

    const totalMrr = Array.from(snapMap.values()).reduce((s, v) => s + v.mrr, 0);
    const avgScore = scoreMap.size > 0
        ? Math.round(Array.from(scoreMap.values()).reduce((a, b) => a + b, 0) / scoreMap.size)
        : 0;

    const statCards = [
        { label: "Total MRR", value: formatCurrency(totalMrr), icon: TrendingUp, iconColor: "var(--color-positive)" },
        { label: "Avg Health Score", value: avgScore > 0 ? `${avgScore}/100` : "—", icon: Zap, iconColor: "var(--color-accent)" },
        { label: "Startups", value: String(startups?.length ?? 0), icon: Building2, iconColor: "var(--color-secondary)" },
    ];

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Page header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-1px", marginBottom: 6 }}>
                    Welcome back 👋
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 500 }}>Here&apos;s your portfolio overview.</p>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                {statCards.map(({ label, value, icon: Icon, iconColor }) => (
                    <div key={label} className="card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <p className="metric-label">{label}</p>
                            <Icon size={16} color={iconColor} />
                        </div>
                        <p style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-1px" }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Startups list */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", letterSpacing: "0.02em", textTransform: "uppercase" }}>Your Startups</h2>
                    <Link href="/dashboard/startups" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-accent)", fontWeight: 700, textDecoration: "none" }}>
                        Manage <ArrowRight size={14} />
                    </Link>
                </div>

                {(startups ?? []).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "56px 24px" }}>
                        <Building2 size={32} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
                        <p style={{ color: "var(--color-secondary)", marginBottom: 20, fontSize: 14 }}>No startups yet.</p>
                        <Link href="/dashboard/startups" className="btn btn-primary">
                            <Plus size={15} /> Add your first startup
                        </Link>
                    </div>
                ) : (
                    <div>
                        {(startups ?? []).slice(0, 5).map((startup) => {
                            const score = scoreMap.get(startup.id);
                            const snap = snapMap.get(startup.id);
                            return (
                                <DashboardStartupRow 
                                    key={startup.id} 
                                    startup={startup} 
                                    score={score} 
                                    snap={snap} 
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
