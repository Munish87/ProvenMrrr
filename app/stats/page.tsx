import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/categories";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
    title: "Startup statistics and insights — ProvenMRR",
    description: "Explore comprehensive startup statistics including revenue distribution, top countries, and categories.",
};

// Revalidate stats every hour
export const revalidate = 3600;

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

    // 1. Fetch only necessary fields for all verified startups
    const { data: startups, error } = await supabase
        .from("startups")
        .select("id, category, country, monthly_revenue")
        .filter("is_verified", "eq", true);

    if (error) {
        console.error("Stats fetch error:", error);
    }

    const verifiedStartups = startups || [];
    let totalVerifiedMrr = 0;
    const totalStartups = verifiedStartups.length;

    const mrByCountry: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};
    const mrByCategory: Record<string, number> = {};

    for (const s of verifiedStartups) {
        const mrr = s.monthly_revenue || 0;
        totalVerifiedMrr += mrr;

        if (s.country) {
            const code = s.country.toUpperCase();
            mrByCountry[code] = (mrByCountry[code] || 0) + mrr;
        }

        if (s.category) {
            countByCategory[s.category] = (countByCategory[s.category] || 0) + 1;
            mrByCategory[s.category] = (mrByCategory[s.category] || 0) + mrr;
        }
    }

    const topCountries = Object.keys(mrByCountry)
        .filter((k) => mrByCountry[k] > 0)
        .map((k) => ({ code: k, mrr: mrByCountry[k] }))
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 50);

    const topCategories = Object.keys(countByCategory)
        .map((k) => ({ 
            category: k, 
            count: countByCategory[k],
            mrr: mrByCategory[k] || 0 
        }))
        .sort((a, b) => b.mrr - a.mrr);

    return (
        <div style={{ minHeight: "100vh" }}>
            <Navbar user={user} />

            <main className="page-container" style={{ paddingTop: 100, paddingBottom: 120 }}>
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
                                    <Link key={c.code} href={`/browse?country=${c.code}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: i === 0 ? "rgba(99, 102, 241, 0.07)" : "var(--color-surface)", border: i === 0 ? "1px solid rgba(99, 102, 241, 0.18)" : "1px solid var(--color-border)", transition: "all 0.2s" }} className="hover:bg-black/5">
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
                                            background: i === 0 ? "rgba(99, 102, 241, 0.07)" : "var(--color-surface)",
                                            border: i === 0 ? "1px solid rgba(99, 102, 241, 0.18)" : "1px solid var(--color-border)",
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
