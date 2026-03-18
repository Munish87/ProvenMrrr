import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Startup statistics and insights — Vetra",
    description: "Explore comprehensive startup statistics including revenue distribution, top countries, and categories.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString("en-US")}k`;
    return `$${n.toLocaleString("en-US")}`;
}

const getFlagEmoji = (countryCode: string | null) => {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

export default async function StatsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch verified startups
    const { data: verifiedStartups } = await supabase
        .from("startups")
        .select("id, category, country")
        .eq("verified", true);

    const startups: any[] = verifiedStartups || [];
    const validIds = startups.map((s) => s.id);

    // Fetch latest revenue snapshots for all verified startups
    const { data: revenueData } = await (validIds.length > 0
        ? supabase
            .from("revenue_snapshots")
            .select("startup_id, mrr")
            .in("startup_id", validIds)
            .order("snapshot_date", { ascending: false })
        : Promise.resolve({ data: [] }));

    // Process latest snapshots (ensure 1 MRR record per startup)
    const latestSnapshots = new Map<string, number>();
    const revArray: any[] = revenueData || [];
    for (const snap of revArray) {
        if (!latestSnapshots.has(snap.startup_id)) {
            latestSnapshots.set(snap.startup_id, snap.mrr);
        }
    }

    /* --- AGGREGATE CALCULATIONS --- */
    let totalVerifiedMrr = 0;
    let totalStartups = startups.length;

    for (const [_, mrr] of latestSnapshots.entries()) {
        totalVerifiedMrr += mrr;
    }

    // Group by Country
    const mrByCountry: Record<string, number> = {};
    for (const s of startups) {
        if (s.country) {
            const code = s.country.toUpperCase();
            const mrr = latestSnapshots.get(s.id) || 0;
            mrByCountry[code] = (mrByCountry[code] || 0) + mrr;
        }
    }
    const topCountries = Object.keys(mrByCountry)
        .filter((k) => mrByCountry[k] > 0)
        .map((k) => ({ code: k, mrr: mrByCountry[k] }))
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 50);

    // Group by Category
    const countByCategory: Record<string, number> = {};
    for (const s of startups) {
        if (s.category) {
            countByCategory[s.category] = (countByCategory[s.category] || 0) + 1;
        }
    }
    const topCategories = Object.keys(countByCategory)
        .map((k) => ({ category: k, count: countByCategory[k] }))
        .sort((a, b) => b.count - a.count);


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

            <main className="page-container" style={{ paddingTop: 64, paddingBottom: 120 }}>
                {/* Hero */}
                <div style={{ textAlign: "center", marginBottom: 64 }}>
                    <h1 style={{ fontSize: 48, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.04em", marginBottom: 16 }}>
                        Startup Statistics
                    </h1>
                    <p style={{ fontSize: 18, color: "var(--color-secondary)", maxWidth: 640, margin: "0 auto", lineHeight: 1.5 }}>
                        Live data from <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{fmtMoney(totalVerifiedMrr)}</span> verified monthly recurring revenue across <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{totalStartups}</span> transparent startups.
                    </p>
                </div>

                {/* Grids */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 32 }}>

                    {/* Countries Grid */}
                    <section className="card" style={{ padding: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>Top Countries</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {topCountries.length === 0 ? (
                                <p style={{ color: "var(--color-secondary)" }}>No geographical data available.</p>
                            ) : (
                                topCountries.map((c, i) => (
                                    <Link key={c.code} href={`/browse?country=${c.code}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: i === 0 ? "rgba(99, 102, 241, 0.05)" : "transparent", border: i === 0 ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent", transition: "background 0.2s" }} className="hover:bg-gray-50">
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)", width: 20 }}>#{i + 1}</span>
                                            <span style={{ fontSize: 20 }}>{getFlagEmoji(c.code)}</span>
                                            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{c.code}</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: i === 0 ? "var(--color-accent)" : "var(--color-text)" }}>
                                            {fmtMoney(c.mrr)}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Categories Grid */}
                    <section className="card" style={{ padding: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>Top Categories</h2>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                            {topCategories.length === 0 ? (
                                <p style={{ color: "var(--color-secondary)" }}>No categorization data available.</p>
                            ) : (
                                topCategories.map((c) => (
                                    <Link key={c.category} href={`/browse?category=${encodeURIComponent(c.category)}`} className="nav-pill" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 14 }}>
                                        <span style={{ color: "var(--color-text)" }}>{c.category}</span>
                                        <span style={{ color: "var(--color-secondary)", fontSize: 12 }}>{c.count}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
