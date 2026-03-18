import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchProviderData } from "@/lib/revenue/fetchers";
import { decryptApiKey } from "@/lib/crypto";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { StartupDiscoveryCard } from "@/components/startup/StartupDiscoveryCard";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ExternalLink, MapPin, ChevronRight, Share2, ShieldCheck } from "lucide-react";
import { SaleBannerWrapper } from "@/components/startup/SaleBannerWrapper";
import { ShareButton } from "@/components/startup/ShareButton";
import { WatchlistButton } from "@/components/startup/WatchlistButton";
import Link from "next/link";

export const revalidate = 3600;

interface Props { params: Promise<{ id: string }>; }

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase.from("startups").select("name, description, is_anonymous").eq("id", id)
        .returns<{ name: string; description: string | null; is_anonymous: boolean }[]>().single();
    
    const displayTitle = data?.is_anonymous ? "Anonymous Startup" : (data?.name ?? "Startup");
    return { title: `${displayTitle} — Vetra`, description: data?.description ?? "Verified startup revenue." };
}

export default async function StartupProfilePage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: startup } = await supabase.from("startups").select("*").eq("id", id)
        .returns<{ id: string; name: string; description: string | null; website_url: string | null; logo_url: string | null; category: string | null; country: string | null; is_anonymous: boolean; is_listed_for_sale: boolean; is_verified: boolean; verified: boolean; claimed_by_user_id: string | null; insights: any; tags: string[]; created_at: string; owner_id: string; x_handle: string | null; asking_price: number | null; profit_margin_30d: number | null; }[]>()
        .single();
    if (!startup) notFound();

    // Check if current visitor has this startup saved
    let initialSaved = false;
    if (user) {
        const { data: existingWatchlist } = await supabase
            .from("watchlists")
            .select("id")
            .eq("startup_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
        if (existingWatchlist) initialSaved = true;
    }

    const { data: healthScore } = await supabase.from("health_scores").select("score, risk_level, ai_summary, created_at").eq("startup_id", id)
        .order("created_at", { ascending: false }).limit(1)
        .returns<{ score: number; risk_level: string; ai_summary: string | null; created_at: string }[]>().single();

    // Real Time Revenue Fetching
    const adminSupabase = createAdminClient();
    const { data: conn } = await adminSupabase.from("stripe_connections").select("encrypted_api_key, provider").eq("startup_id", id).single();

    let latestSnap = null;
    let chartData: { month: string; revenue: number }[] = [];

    if (conn) {
        try {
            const apiKey = decryptApiKey(conn.encrypted_api_key);
            const providerData = await fetchProviderData(conn.provider as any, apiKey);
            const m = providerData.metrics;
            latestSnap = {
                mrr: m.mrr,
                all_time_revenue: m.allTimeRevenue,
                growth_rate: m.momGrowthRate,
                customer_count: m.customerCount,
                churn_rate: m.churnRate,
                volatility_score: m.volatilityScore,
                refund_rate: m.refundRate,
            };
            chartData = m.revenueByMonth.map(point => ({ month: point.month, revenue: point.revenue }));
        } catch (e) {
            console.error("Failed to fetch live real constraints:", e);
        }
    }

    if (!latestSnap) {
        // Fallback to database snapshots if real time fails or doesn't exist
        const { data: snap } = await supabase.from("revenue_snapshots").select("mrr, arr, all_time_revenue, growth_rate, churn_rate, customer_count, volatility_score, refund_rate").eq("startup_id", id)
            .order("snapshot_date", { ascending: false }).limit(1)
            .returns<{ mrr: number; arr: number; all_time_revenue: number; growth_rate: number; churn_rate: number; customer_count: number; volatility_score: number; refund_rate: number }[]>().single();
        latestSnap = snap as any;

        const { data: snapshots } = await supabase.from("revenue_snapshots").select("mrr, snapshot_date").eq("startup_id", id)
            .order("snapshot_date", { ascending: true }).limit(12)
            .returns<{ mrr: number; snapshot_date: string }[]>();

        chartData = (snapshots ?? []).map((s) => ({
            month: new Date(s.snapshot_date).toLocaleString("en-US", { month: "short", day: "numeric" }),
            revenue: s.mrr,
        }));
    }

    let ownerProfile: { name: string | null; x_handle: string | null; avatar_url: string | null } | null = null;
    if (startup.claimed_by_user_id) {
        const { data: profile } = await supabase.from("users").select("name, x_handle, avatar_url").eq("id", startup.claimed_by_user_id)
            .returns<{ name: string | null; x_handle: string | null; avatar_url: string | null }[]>().single();
        ownerProfile = profile;
    }

    const resolvedXHandle = ownerProfile?.x_handle || startup.x_handle;
    const resolvedFounderName = ownerProfile?.name;

    // Fetch X (Twitter) Profile Data
    let xData: { name?: string; followers?: number; avatar_url?: string } | null = null;
    let cleanXHandle = "";
    if (resolvedXHandle) {
        cleanXHandle = resolvedXHandle.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//, "").replace("@", "");
        try {
            const res = await fetch(`https://api.fxtwitter.com/${cleanXHandle}`, { next: { revalidate: 3600 } });
            if (res.ok) {
                const json = await res.json();
                if (json.code === 200 && json.user) {
                    xData = {
                        name: json.user.name,
                        followers: json.user.followers,
                        avatar_url: json.user.avatar_url,
                    };
                }
            }
        } catch (e) {
            console.error("[X Data Fetch] Failed:", e);
        }
    }

    // Related Startups Logistics
    let rawRelated = [];
    if (startup.is_listed_for_sale) {
        const { data } = await supabase.from("startups").select("id, name, category, description, is_listed_for_sale, is_verified, created_at")
            .eq("is_listed_for_sale", true).neq("id", id).limit(50)
            .returns<{ id: string; name: string; category: string | null; description: string | null; is_listed_for_sale: boolean; is_verified: boolean; created_at: string; }[]>();
        rawRelated = data || [];
    } else {
        const { data } = await supabase.from("startups").select("id, name, category, description, is_listed_for_sale, is_verified, created_at")
            .eq("category", startup.category || "Software").neq("id", id).limit(50)
            .returns<{ id: string; name: string; category: string | null; description: string | null; is_listed_for_sale: boolean; is_verified: boolean; created_at: string; }[]>();
        rawRelated = data || [];
    }

    const shuffledRelated = [...rawRelated].sort(() => 0.5 - Math.random()).slice(0, 6);

    let relatedSnapshotsMap: Record<string, any> = {};
    if (shuffledRelated.length > 0) {
        const relatedIds = shuffledRelated.map(s => s.id);
        const { data: relatedSnaps } = await supabase.from("revenue_snapshots").select("startup_id, mrr, growth_rate, all_time_revenue, snapshot_date")
            .in("startup_id", relatedIds).order("snapshot_date", { ascending: false })
            .returns<{ startup_id: string; mrr: number; growth_rate: number; all_time_revenue: number; snapshot_date: string }[]>();

        if (relatedSnaps) {
            for (const snap of relatedSnaps) {
                if (!relatedSnapshotsMap[snap.startup_id]) {
                    relatedSnapshotsMap[snap.startup_id] = snap;
                }
            }
        }
    }

    // Revenue multiples calculations
    const annualRev = (latestSnap?.mrr ?? 0) * 12;
    const revMultiple = annualRev > 0 && startup.asking_price ? (startup.asking_price / annualRev).toFixed(1) : null;
    const profitMultiple = annualRev > 0 && startup.asking_price && startup.profit_margin_30d
        ? (startup.asking_price / (annualRev * (startup.profit_margin_30d / 100))).toFixed(1) : null;

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

            <div className="page-container" style={{ paddingTop: 32, paddingBottom: 80 }}>
                {/* Breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-secondary)", marginBottom: 24 }}>
                    <Link href="/" style={{ color: "var(--color-secondary)", textDecoration: "none" }}>Vetra</Link>
                    <ChevronRight size={12} />
                    <Link href="/browse" style={{ color: "var(--color-secondary)", textDecoration: "none" }}>Startups</Link>
                    <ChevronRight size={12} />
                    <span style={{ color: "var(--color-text)", fontWeight: 600, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</span>
                </div>

                {/* For Sale Banner (if applicable) */}
                {startup.is_listed_for_sale && startup.asking_price && (
                    <SaleBannerWrapper
                        askingPrice={formatCurrency(startup.asking_price, "USD")}
                        startupId={startup.id}
                        startupName={startup.name}
                        revMultiple={revMultiple}
                        profitMultiple={profitMultiple}
                    />
                )}

                {/* Profile Card */}
                <div className="card" style={{ marginBottom: 16 }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                            {startup.logo_url && !startup.is_anonymous ? (
                                <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                    <img src={startup.logo_url} alt={`${startup.name} logo`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            ) : (
                                <div className="startup-card-logo" style={{ width: 64, height: 64, fontSize: 28, borderRadius: 14, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>
                                    {startup.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.4px", filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</h1>
                                    {startup.verified && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 4 }}>
                                            <circle cx="12" cy="12" r="11" fill="#3B82F6" />
                                            <path d="M7 12L10.5 15.5L17 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {startup.is_listed_for_sale && <span className="tag-forsale">For Sale</span>}
                                </div>
                                <p style={{ fontSize: 14, color: "var(--color-secondary)", maxWidth: 480, lineHeight: 1.6 }}>{startup.description}</p>
                                {startup.category && (
                                    <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 8, fontWeight: 500 }}>{startup.category}{startup.country ? ` · ${startup.country}` : ""}</p>
                                )}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <WatchlistButton startupId={startup.id} initialSaved={initialSaved} />
                            <ShareButton />
                            {startup.website_url && !startup.is_anonymous && (
                                <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                                    Visit site <ExternalLink size={13} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                        {[
                            { label: "All Time Rev", value: formatCurrency(latestSnap?.all_time_revenue ?? 0), sub: "Total Volume" },
                            { label: "MRR", value: formatCurrency(latestSnap?.mrr ?? 0), sub: `${latestSnap?.customer_count ?? 0} active subs` },
                            { label: "Health Score", value: `${healthScore?.score ?? 0}/100`, sub: `${healthScore?.risk_level ?? "Unrated"} risk` },
                            {
                                label: "Founder",
                                value: resolvedXHandle ? (
                                    <a href={`https://x.com/${cleanXHandle}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text)", textDecoration: "none" }}>
                                        {xData?.avatar_url && (
                                            <img src={xData.avatar_url} alt="Profile" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                        )}
                                        <span style={{ color: "var(--color-text)", fontWeight: 700 }}>
                                            {resolvedFounderName || xData?.name || `@${cleanXHandle}`}
                                        </span>
                                    </a>
                                ) : (resolvedFounderName || "—"),
                                sub: resolvedXHandle ? (xData?.followers !== undefined ? `${xData.followers.toLocaleString()} followers` : "Founder") : "—"
                            },
                        ].map(({ label, value, sub }) => (
                            <div key={label} style={{ background: "#F9FAFB", border: "1px solid var(--color-border)", borderRadius: 10, padding: "16px 20px" }}>
                                <p className="metric-label" style={{ marginBottom: 6 }}>{label}</p>
                                <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px", marginBottom: 2 }}>{value}</p>
                                <p style={{ fontSize: 12, color: "var(--color-secondary)" }}>{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Revenue Chart */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>Revenue Growth</h2>
                        </div>
                        <div style={{ background: "#F9FAFB", border: "1px solid var(--color-border)", borderRadius: 10, padding: 20 }}>
                            <p style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", marginBottom: 4 }}>{formatCurrency(latestSnap?.mrr ?? 0)}</p>
                            <p style={{ fontSize: 13, color: "var(--color-secondary)", marginBottom: 16 }}>Current MRR</p>
                            {chartData.length > 0 ? (
                                <RevenueChart data={chartData} />
                            ) : (
                                <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed var(--color-border)", borderRadius: 8, color: "var(--color-secondary)", fontSize: 13 }}>
                                    No chart data yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Key Metrics</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                            {[
                                { label: "Growth (MoM)", value: formatPercent(latestSnap?.growth_rate ?? 0), positive: (latestSnap?.growth_rate ?? 0) >= 0 },
                                { label: "Churn Rate", value: `${(latestSnap?.churn_rate ?? 0).toFixed(1)}%`, positive: null },
                                { label: "Volatility", value: (latestSnap?.volatility_score ?? 0).toFixed(2), positive: null },
                                { label: "Refund Rate", value: `${(latestSnap?.refund_rate ?? 0).toFixed(1)}%`, positive: null },
                            ].map(({ label, value, positive }) => (
                                <div key={label} style={{ background: "white", border: "1px solid var(--color-border)", borderRadius: 10, padding: "16px 20px" }}>
                                    <p className="metric-label" style={{ marginBottom: 6 }}>{label}</p>
                                    <p style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: positive === true ? "var(--color-positive)" : positive === false ? "var(--color-negative)" : "var(--color-text)",
                                    }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Founder Card */}
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Founder</h2>
                        <div style={{ background: "#F9FAFB", border: "1px solid var(--color-border)", borderRadius: 10, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                            {ownerProfile?.avatar_url ? (
                                <img src={ownerProfile.avatar_url} alt="Profile" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                            ) : resolvedXHandle && xData?.avatar_url ? (
                                <img src={xData.avatar_url} alt="Profile" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "var(--color-secondary)" }}>
                                    {resolvedXHandle ? cleanXHandle.charAt(0).toUpperCase() : (resolvedFounderName ? resolvedFounderName.charAt(0).toUpperCase() : "F")}
                                </div>
                            )}
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>
                                    {startup.claimed_by_user_id ? (
                                        resolvedXHandle ? (
                                            <a href={`https://x.com/${cleanXHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text)", textDecoration: "none" }}>
                                                <span style={{ color: "var(--color-text)", fontWeight: 700 }}>
                                                    {resolvedFounderName || xData?.name || `@${cleanXHandle}`}
                                                </span>
                                            </a>
                                        ) : (
                                            <span style={{ color: "var(--color-text)", fontWeight: 700 }}>
                                                {resolvedFounderName || "Verified Founder"}
                                            </span>
                                        )
                                    ) : "Unclaimed Startup"}
                                </p>
                                <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, marginTop: 4 }}>
                                    {startup.claimed_by_user_id ? (
                                        resolvedXHandle && xData?.followers !== undefined ? `${xData.followers.toLocaleString()} Twitter Followers` : "Founder & Maker"
                                    ) : "Are you the founder? Connect to claim your profile."}
                                </p>
                            </div>
                            {!startup.claimed_by_user_id && (
                                <Link href={user ? `/dashboard/claim/${startup.id}` : `/login?next=${encodeURIComponent('/dashboard/claim/' + startup.id)}`} className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}>
                                    Claim this startup
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Insights & Tags Section */}
                    {(startup.insights || (startup.tags && startup.tags.length > 0)) && (
                        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--color-border)" }}>
                            {startup.insights && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 24 }}>
                                    {startup.insights.value_proposition && (
                                        <div>
                                            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Value Proposition</h3>
                                            <p style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.5 }}>{startup.insights.value_proposition}</p>
                                        </div>
                                    )}
                                    {startup.insights.problem_solved && (
                                        <div>
                                            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Problem Solved</h3>
                                            <p style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.5 }}>{startup.insights.problem_solved}</p>
                                        </div>
                                    )}
                                    {startup.insights.pricing && (
                                        <div>
                                            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Pricing</h3>
                                            <p style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.5 }}>{startup.insights.pricing}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {startup.tags && startup.tags.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {startup.tags.slice(0, 3).map((tag: string) => (
                                        <span key={tag} style={{
                                            padding: "4px 12px",
                                            borderRadius: "99px",
                                            background: "#F3F4F6",
                                            color: "#4B5563",
                                            fontSize: "12px",
                                            fontWeight: 600
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Related Startups */}
                {shuffledRelated.length > 0 && (
                    <div style={{ marginTop: 40, maxWidth: "1100px", marginLeft: "auto", marginRight: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", fontFamily: "monospace", margin: 0 }}>
                                Discover more startups
                            </h2>
                            <Link href="/search" style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                Advanced Search ↗
                            </Link>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                            {shuffledRelated.map(s => (
                                <div key={s.id} style={{ maxWidth: "320px", width: "100%", margin: "0 auto" }}>
                                    <StartupDiscoveryCard
                                        key={s.id}
                                        s={s}
                                        snap={relatedSnapshotsMap[s.id]}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
