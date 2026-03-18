import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/categories";

export const metadata = {
    title: "Startup statistics and insights — ProvenMRR",
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

    // 1. Fetch ALL verified startups using pagination
    let allVerifiedStartups: any[] = [];
    let lastId = null;
    while (true) {
        let query = supabase.from("startups").select("id, category, country").eq("verified", true).order("id");
        if (lastId) query = query.gt("id", lastId);
        
        const { data, error } = await query.limit(1000);
        if (error || !data || data.length === 0) break;
        
        allVerifiedStartups = [...allVerifiedStartups, ...data];
        lastId = data[data.length - 1].id;
        if (data.length < 1000) break;
    }

    const startups: any[] = allVerifiedStartups;
    const validIds = new Set(startups.map((s) => s.id));

    // 2. Fetch ALL revenue snapshots using pagination to ensure we find the latest for each verified startup
    const latestSnapshotsMap = new Map<string, { mrr: number; date: string }>();
    let lastSnapId = null;
    while (true) {
        let query = supabase.from("revenue_snapshots").select("id, startup_id, mrr, snapshot_date").order("id");
        if (lastSnapId) query = query.gt("id", lastSnapId);
        
        const { data, error } = await query.limit(1000);
        if (error || !data || data.length === 0) break;
        
        for (const snap of data) {
            // Only process snapshots for startups we've identified as verified
            if (validIds.has(snap.startup_id)) {
                const mrrValue = parseFloat(snap.mrr as any) || 0;
                const existing = latestSnapshotsMap.get(snap.startup_id);
                // Keep only the most recent snapshot for this startup
                if (!existing || snap.snapshot_date > existing.date) {
                    latestSnapshotsMap.set(snap.startup_id, { mrr: mrrValue, date: snap.snapshot_date });
                }
            }
        }
        
        lastSnapId = data[data.length - 1].id;
        if (data.length < 1000) break;
    }

    // Convert to simple mrr map for calculations
    const latestSnapshots = new Map<string, number>();
    for (const [id, val] of latestSnapshotsMap.entries()) {
        latestSnapshots.set(id, val.mrr);
    }

    /* --- AGGREGATE CALCULATIONS --- */
    let totalVerifiedMrr = 0;
    let totalStartups = startups.length;

    for (const mrr of latestSnapshots.values()) {
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
    const mrByCategory: Record<string, number> = {};
    for (const s of startups) {
        if (s.category) {
            countByCategory[s.category] = (countByCategory[s.category] || 0) + 1;
            const mrr = latestSnapshots.get(s.id) || 0;
            mrByCategory[s.category] = (mrByCategory[s.category] || 0) + mrr;
        }
    }
    const topCategories = Object.keys(countByCategory)
        .map((k) => ({ 
            category: k, 
            count: countByCategory[k],
            mrr: mrByCategory[k] || 0 
        }))
        .sort((a, b) => b.mrr - a.mrr);


    return (
        <div style={{ minHeight: "100vh" }}>
            {/* Header */}
            <header className="site-header">
                <div className="site-header-inner">
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        <Link href="/" className="site-logo">
                            <span className="site-logo-dot" />
                            ProvenMRR
                        </Link>
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
                                    <button type="submit" className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
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
                    <p style={{ fontSize: 18, color: "var(--color-secondary)", maxWidth: 640, margin: "0 auto", lineHeight: 1.5, fontWeight: 500, opacity: 0.6 }}>
                        Live data from <span style={{ fontWeight: 800, color: "var(--color-text)" }}>{fmtMoney(totalVerifiedMrr)}</span> verified monthly recurring revenue across <span style={{ fontWeight: 800, color: "var(--color-text)" }}>{totalStartups}</span> transparent startups.
                    </p>
                </div>

                {/* Grids */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 32 }}>

                    {/* Countries Grid */}
                    <section className="card" style={{ padding: 40 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>Top Countries</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {topCountries.length === 0 ? (
                                <p style={{ color: "var(--color-secondary)", opacity: 0.4 }}>No geographical data available.</p>
                            ) : (
                                topCountries.map((c, i) => (
                                    <Link key={c.code} href={`/browse?country=${c.code}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: i === 0 ? "color-mix(in srgb, var(--color-accent) 7%, transparent)" : "var(--color-surface)", border: i === 0 ? "1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)" : "1px solid var(--color-border)", transition: "all 0.2s" }} className="hover:bg-black/5">
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", width: 24, opacity: 0.4 }}>#{i + 1}</span>
                                            <span style={{ fontSize: 20 }}>{getFlagEmoji(c.code)}</span>
                                            <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{c.code}</span>
                                        </div>
                                        <span style={{ fontWeight: 800, color: i === 0 ? "var(--color-accent)" : "var(--color-text)" }}>
                                            {fmtMoney(c.mrr)}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Categories Grid */}
                    <section className="card" style={{ padding: 40 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>Top Categories</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {topCategories.length === 0 ? (
                                <p style={{ color: "var(--color-secondary)", opacity: 0.4 }}>No categorization data available.</p>
                            ) : (
                                topCategories.map((c, i) => (
                                    <Link
                                        key={c.category}
                                        href={`/category/${slugify(c.category)}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 16px",
                                            borderRadius: 12,
                                            background: i === 0 ? "color-mix(in srgb, var(--color-accent) 7%, transparent)" : "var(--color-surface)",
                                            border: i === 0 ? "1px solid color-mix(in srgb, var(--color-accent) 18%, transparent)" : "1px solid var(--color-border)",
                                            transition: "all 0.2s",
                                            textDecoration: "none"
                                        }}
                                        className="hover:bg-black/5"
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", width: 24, opacity: 0.4 }}>#{i + 1}</span>
                                            <span style={{ fontWeight: 700, color: "var(--color-text)" }}>{c.category}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontWeight: 800, color: i === 0 ? "var(--color-accent)" : "var(--color-text)" }}>
                                                {fmtMoney(c.mrr)}
                                            </span>
                                            <div style={{ borderLeft: "1px solid var(--color-border)", height: 12, margin: "0 4px" }} />
                                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)" }}>{c.count}</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.05em" }}>startups</span>
                                        </div>
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
