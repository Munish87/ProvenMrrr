import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { HealthScoreBadge } from "@/components/startup/HealthScoreBadge";
import { Heart, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Interested Startups — Vetra" };

export default async function InterestedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch watchlists for the user
    const { data: watchlists } = await supabase
        .from("watchlists")
        .select("startup_id")
        .eq("user_id", user!.id);

    const startupIds = (watchlists ?? []).map((w) => w.startup_id);

    // 2. Fetch those startups
    const { data: startups } = await supabase
        .from("startups")
        .select("id, name, is_verified, is_listed_for_sale, category")
        .in("id", startupIds.length > 0 ? startupIds : ["none"])
        .returns<{ id: string; name: string; is_verified: boolean; is_listed_for_sale: boolean; category: string | null }[]>();

    // 3. Fetch snapshots and health scores for stats
    const { data: snapshots } = await supabase
        .from("revenue_snapshots")
        .select("startup_id, mrr, growth_rate")
        .in("startup_id", startupIds.length > 0 ? startupIds : ["none"])
        .order("snapshot_date", { ascending: false })
        .returns<{ startup_id: string; mrr: number; growth_rate: number }[]>();

    const { data: healthScores } = await supabase
        .from("health_scores")
        .select("startup_id, score")
        .in("startup_id", startupIds.length > 0 ? startupIds : ["none"])
        .order("created_at", { ascending: false })
        .returns<{ startup_id: string; score: number }[]>();

    const snapMap = new Map<string, { mrr: number; growth_rate: number }>();
    for (const sn of snapshots ?? []) if (!snapMap.has(sn.startup_id)) snapMap.set(sn.startup_id, sn);

    const scoreMap = new Map<string, number>();
    for (const hs of healthScores ?? []) if (!scoreMap.has(hs.startup_id)) scoreMap.set(hs.startup_id, hs.score);

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Page header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
                    Interested Startups
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-secondary)" }}>Startups you are tracking for potential acquisition.</p>
            </div>

            {/* Startups list */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Heart size={16} color="var(--color-accent)" fill="var(--color-accent)" />
                        Saved on Watchlist
                    </h2>
                    <Link href="/browse" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
                        Browse More <ExternalLink size={14} />
                    </Link>
                </div>

                {(startups ?? []).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "56px 24px" }}>
                        <Heart size={32} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
                        <p style={{ color: "var(--color-secondary)", marginBottom: 20, fontSize: 14 }}>You haven't bookmarked any startups yet.</p>
                        <Link href="/browse" className="btn btn-primary">
                            Discover Startups
                        </Link>
                    </div>
                ) : (
                    <div>
                        {(startups ?? []).map((startup) => {
                            const snap = snapMap.get(startup.id);
                            const score = scoreMap.get(startup.id);
                            return (
                                <Link key={startup.id} href={`/startup/${startup.id}`} style={{ textDecoration: "none", display: "block" }}>
                                    <div className="hover:bg-gray-50" style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "16px 20px",
                                        borderBottom: "1px solid var(--color-border)",
                                        transition: "background 0.12s",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <div className="startup-card-logo" style={{ width: 44, height: 44, fontSize: 18, borderRadius: 10 }}>
                                                {startup.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{startup.name}</p>
                                                    {startup.is_listed_for_sale && (
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>For Sale</span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: 13, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                                                    {startup.category || "Software"}
                                                    {startup.is_verified && <span style={{ color: "#3B82F6", fontWeight: 600 }}>· Verified</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                                            {/* MRR Column */}
                                            <div style={{ textAlign: "right", minWidth: 80 }}>
                                                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>MRR</p>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{snap ? formatCurrency(snap.mrr) : "—"}</p>
                                            </div>

                                            {/* Health Score Column */}
                                            <div style={{ textAlign: "right", width: 80, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Health</p>
                                                {score !== undefined ? (
                                                    <HealthScoreBadge score={score} size="sm" />
                                                ) : (
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)" }}>—</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
