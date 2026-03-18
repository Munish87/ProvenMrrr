
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Link as LinkIcon, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";

export const metadata = {
    title: "Recently Added Startups | Vetra",
    description: "Discover the latest verified startups joining the transparent MRR movement.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Fetch up to 20 most recently verified startups
    const { data: recentStartups } = await supabase
        .from("startups")
        .select("id, name, category, description, created_at")
        .eq("verified", true)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<{ id: string; name: string; category: string | null; description: string | null; created_at: string }[]>();

    const startups = recentStartups || [];
    const validIds = startups.map((s) => s.id);

    // Fetch latest revenue snapshots for these 20 startups
    const { data: revenueData } = await (validIds.length > 0
        ? supabase
            .from("revenue_snapshots")
            .select("startup_id, mrr, growth_rate")
            .in("startup_id", validIds)
            .order("snapshot_date", { ascending: false })
            .returns<{ startup_id: string; mrr: number; growth_rate: number }[]>()
        : Promise.resolve({ data: [] }));

    const latestSnapshots = new Map<string, { mrr: number; growth_rate: number }>();
    const revArray = revenueData || [];
    for (const snap of revArray) {
        if (!latestSnapshots.has(snap.startup_id)) {
            latestSnapshots.set(snap.startup_id, snap);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
            {/* Header */}
            <header className="site-header">
                <div className="site-header-inner">
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        <Link href="/" className="site-logo">
                            <span className="site-logo-dot" />
                            Vetra
                        </Link>
                        <nav style={{ display: "flex", gap: 24 }}>
                            <Link href="/browse" className="nav-link">Browse</Link>
                            <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
                            <Link href="/co-founders" className="nav-link">Co-founders</Link>
                        </nav>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {!user ? (
                            <>
                                <Link href="/login" className="nav-link">Sign in</Link>
                                <FrictionlessAddWrapper className="btn btn-secondary btn-sm" />
                            </>
                        ) : (
                            <>
                                <Link href="/dashboard" className="nav-link">Dashboard</Link>
                                <form action="/auth/signout" method="POST">
                                    <button type="submit" className="btn btn-secondary btn-sm" style={{ background: "transparent", border: "1px solid var(--color-border)", cursor: "pointer" }}>
                                        Sign out
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="page-container" style={{ paddingTop: 64, paddingBottom: 120, maxWidth: 800 }}>
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
                            const snap = latestSnapshots.get(s.id);
                            const relativeTime = getRelativeTime(s.created_at);

                            return (
                                <Link key={s.id} href={`/ startup / ${s.id} `} style={{ textDecoration: "none" }}>
                                    <div className="card card-hover" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>

                                        {/* Avatar */}
                                        <div className="startup-card-logo" style={{ width: 56, height: 56, fontSize: 24, flexShrink: 0 }}>
                                            {s.name.charAt(0)}
                                        </div>

                                        {/* Left Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{s.name}</h3>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-secondary)", fontSize: 12, background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: 12 }}>
                                                    <Clock size={12} />
                                                    <span style={{ fontWeight: 600 }}>{relativeTime}</span>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 14, color: "var(--color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                                                {s.category && <><span style={{ fontWeight: 500 }}>{s.category}</span> · </>}
                                                {s.description || "No description provided."}
                                            </p>
                                        </div>

                                        {/* Right Metrics */}
                                        <div style={{ display: "flex", gap: 32, flexShrink: 0, alignItems: "center" }}>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-secondary)", marginBottom: 4 }}>MRR</p>
                                                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                                                    {snap ? fmtMoney(snap.mrr) : "$0"}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right", width: 80 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-secondary)", marginBottom: 4 }}>Growth</p>
                                                <p className={snap && snap.growth_rate >= 0 ? "g-up" : "g-down"} style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                                                    {snap ? (
                                                        <>{snap.growth_rate >= 0 ? "↑" : "↓"} {Math.abs(snap.growth_rate).toFixed(1)}%</>
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
