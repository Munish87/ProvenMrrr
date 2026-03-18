import { FullLeaderboard } from "@/components/startup/FullLeaderboard";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Leaderboard — Vetra" };

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)} M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString('en-US')} k`;
    return `$${n.toLocaleString('en-US')} `;
}

export default async function LeaderboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: allStartups } = await supabase
        .from("startups")
        .select("id, name, logo_url, category, description, x_handle, verified");

    const { data: snaps } = await supabase
        .from("revenue_snapshots")
        .select("startup_id, mrr, growth_rate, all_time_revenue")
        .order("snapshot_date", { ascending: false });

    const snapList: any[] = snaps || [];
    const snapMap = new Map();
    for (const s of snapList) {
        if (!snapMap.has(s.startup_id)) {
            snapMap.set(s.startup_id, s);
        }
    }

    const startups: any[] = allStartups || [];
    const lbEntries = startups
        .filter((s) => s.verified && snapMap.get(s.id))
        .map((s) => ({
            startup_id: s.id,
            startups: s,
            mrr: snapMap.get(s.id).mrr,
            growth_rate: snapMap.get(s.id).growth_rate,
            all_time: snapMap.get(s.id).all_time_revenue,
        }));

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
                            <Link href="/leaderboard" className="nav-link active">Leaderboard</Link>
                            <Link href="/co-founders" className="nav-link">Co-founders</Link>
                        </nav>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {!user ? (
                            <>
                                <Link href="/login" className="nav-link">Sign in</Link>
                                <Link href="/login" className="btn btn-secondary btn-sm">Sign up</Link>
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

            <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>

                {/* Page header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px", marginBottom: 8 }}>
                            Leaderboard
                        </h1>
                        <p style={{ color: "var(--color-secondary)", fontSize: 14, margin: 0 }}>
                            Top verified startups ranked by Health Score.
                        </p>
                    </div>
                    <FrictionlessAddWrapper />
                </div>

                {/* Table */}
                <FullLeaderboard initialEntries={lbEntries} />
            </div>
        </div>
    );
}
