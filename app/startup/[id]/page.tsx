import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchProviderData } from "@/lib/revenue/fetchers";
import { decryptApiKey } from "@/lib/crypto";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { StartupDiscoveryCard } from "@/components/startup/StartupDiscoveryCard";
import { RealRevenueDashboard } from "@/components/startup/RealRevenueDashboard";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ExternalLink, MapPin, ChevronRight, Share2, Check, Lightbulb, Target, DollarSign, Building } from "lucide-react";
import { SaleBannerWrapper } from "@/components/startup/SaleBannerWrapper";
import { ShareButton } from "@/components/startup/ShareButton";
import { WatchlistButton } from "@/components/startup/WatchlistButton";
import { TECH_STACK_OPTIONS } from "@/lib/constants";
import { getSaleStatusMap } from "@/lib/startup-sale-status";
import { StatusBadge } from "@/components/startup/StatusBadge";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { TrustMRRImporter } from "@/lib/services/trustmrrImporter";
import { calculateHealthScore } from "@/lib/health-score/calculator";

// Revalidate startup profiles every hour
export const revalidate = 3600;

interface Props { params: Promise<{ id: string }>; }

function formatCountryLabel(country: string | null) {
    if (!country) return null;

    const trimmedCountry = country.trim();
    if (!trimmedCountry) return null;

    if (/^[a-z]{2}$/i.test(trimmedCountry)) {
        try {
            return new Intl.DisplayNames(["en"], { type: "region" }).of(trimmedCountry.toUpperCase()) || trimmedCountry.toUpperCase();
        } catch {
            return trimmedCountry.toUpperCase();
        }
    }

    return trimmedCountry;
}

function getCountryFlag(country: unknown) {
    if (typeof country !== "string") return null;

    const trimmedCountry = country.trim();
    if (!/^[a-z]{2}$/i.test(trimmedCountry)) return null;

    return `https://flagcdn.com/48x36/${trimmedCountry.toLowerCase()}.png`;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const { data, error } = await supabase.from("startups").select("name, description, is_anonymous, category, slug, monthly_revenue")
        .or(isUUID ? `id.eq.${id},slug.eq.${id}` : `slug.eq.${id}`)
        .maybeSingle();

    if (error) console.error("[generateMetadata] Startup fetch error:", error);
    if (!data) return { title: "Startup Not Found | ProvenMRR" };

    const name = data.is_anonymous ? "Anonymous Startup" : data.name;
    const revStr = data.monthly_revenue && data.monthly_revenue > 0 
        ? ` with $${Number(data.monthly_revenue).toLocaleString()} monthly revenue` 
        : "";
    
    const title = `${name} — Verified Revenue Data | ProvenMRR`;
    const description = data.description 
        ? `${data.description}${revStr}. View verified growth and MRR metrics for this ${data.category || 'startup'} on ProvenMRR.`
        : `Explore verified revenue metrics and growth data for ${name}${revStr}. Verified via Stripe on ProvenMRR.`;

    return { 
        title, 
        description,
        alternates: {
            canonical: `https://provenmrr.com/startup/${data.slug || id}`,
        },
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://provenmrr.com/startup/${data.slug || id}`,
        }
    };
}

export default async function StartupProfilePage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // 1. Fetch startup, user, health score, and connection in parallel
    const [
        { data: { user } },
        { data: startup },
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("startups").select("*")
            .or(isUUID ? `id.eq.${id},slug.eq.${id}` : `slug.eq.${id}`)
            .maybeSingle()
    ]);

    if (!startup) {
        console.error(`[StartupProfile] Startup not found for ID: ${id} (isUUID: ${isUUID})`);
        notFound();
    }

    const adminSupabase = createAdminClient();
    
    // 2. Fetch secondary data in parallel
    const [
        saleStatusMap,
        { data: healthScore },
        { data: conn },
        { data: snapshots }
    ] = await Promise.all([
        getSaleStatusMap([startup.id]),
        supabase.from("health_scores").select("score, risk_level, ai_summary, created_at").eq("startup_id", startup.id)
            .order("created_at", { ascending: false }).limit(1)
            .maybeSingle(),
        adminSupabase.from("stripe_connections").select("encrypted_api_key, provider").eq("startup_id", startup.id).maybeSingle(),
        supabase.from("revenue_snapshots").select("mrr, arr, all_time_revenue, growth_rate, churn_rate, customer_count, volatility_score, refund_rate, snapshot_date").eq("startup_id", startup.id)
            .order("snapshot_date", { ascending: true })
            .returns<{ mrr: number; arr: number; all_time_revenue: number; growth_rate: number; churn_rate: number; customer_count: number; volatility_score: number; refund_rate: number; snapshot_date: string }[]>()
    ]);

    interface StartupInsights {
        value_proposition?: string;
        problem_solved?: string;
        pricing?: string;
        business_model?: string;
        tech_stack?: string[];
        frontend_stack?: string[];
        backend_stack?: string[];
    }
    let insights = startup.insights as StartupInsights | null;
    const isDev = process.env.NODE_ENV !== "production";

    // Automatic Enrichment for TrustMRR startups missing insights
    if (startup.source === "trustmrr" && startup.slug && (!insights || Object.keys(insights).length <= 1)) {
        const enriched = await TrustMRRImporter.enrichStartup(startup.slug);
        if (enriched.success && enriched.data) {
            Object.assign(startup, enriched.data);
            insights = enriched.data.insights as StartupInsights;
            if (isDev) console.log(`[ProfileEnrichment] Successfully enriched ${startup.slug}`);
        }
    }

    const saleStatus = saleStatusMap.get(startup.id) ?? (startup.is_listed_for_sale ? "sale" : null);

    let initialSaved = false;
    if (user) {
        const { data: existingWatchlist } = await supabase
            .from("watchlists")
            .select("id")
            .eq("startup_id", startup.id)
            .eq("user_id", user.id)
            .maybeSingle();
        if (existingWatchlist) initialSaved = true;
    }

    let latestSnap = null;
    let liveCountry: string | null = null;
    let liveFoundedDate: string | null = null;
    let chartData: { month: string; mrr: number; atr: number }[] = [];

    if (conn) {
        try {
            const apiKey = decryptApiKey(conn.encrypted_api_key);
            const providerData = await fetchProviderData(conn.provider as any, apiKey);
            liveCountry = providerData.metadata?.country || null;
            liveFoundedDate = providerData.metadata?.founded_date || null;
            // Update latest snap with live data
            const m = providerData.metrics;
            console.log("LIVE STRIPE METRICS:", m);
            console.log("LIVE THIS MONTH REVENUE:", m.last30DaysRevenue);
            latestSnap = {
                mrr: m.mrr,
                arr: m.arr,
                all_time_revenue: m.allTimeRevenue,
                growth_rate: m.momGrowthRate,
                customer_count: m.customerCount,
                churn_rate: m.churnRate,
                volatility_score: m.volatilityScore,
                refund_rate: m.refundRate,
                last30DaysRevenue: m.last30DaysRevenue,
            };
            let cumulativeAtr = 0;
            chartData = m.revenueByMonth.map(point => {
                cumulativeAtr += point.revenue;
                const d = new Date(point.date);
                return { 
                    month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }), 
                    mrr: m.mrr, 
                    atr: cumulativeAtr 
                };
            }) as any;

            // Fire-and-forget: Sync live metrics back to DB for the browse page feed
            if (m.mrr !== undefined && m.mrr !== null) {
                adminSupabase.from("startups").update({
                    monthly_revenue: m.mrr,
                    revenue_30d: m.last30DaysRevenue || m.mrr,
                    growth_rate: m.momGrowthRate
                }).eq("id", startup.id).then(({error}) => {
                    if (error) console.error("Failed to sync live metrics:", error);
                });

                const todaySnapDate = new Date().toISOString().split("T")[0];
                const snapData = {
                    startup_id: startup.id,
                    snapshot_date: todaySnapDate,
                    mrr: m.mrr,
                    arr: m.arr || (m.mrr * 12),
                    all_time_revenue: m.allTimeRevenue || 0,
                    growth_rate: m.momGrowthRate || 0,
                    customer_count: m.customerCount || 0,
                    churn_rate: m.churnRate || 0,
                    volatility_score: m.volatilityScore || 0,
                    refund_rate: m.refundRate || 0
                };

                adminSupabase.from("revenue_snapshots")
                    .upsert(snapData, { onConflict: "startup_id,snapshot_date" })
                    .then(({ error: upsertError }) => {
                        if (upsertError) {
                            console.error("Failed to sync revenue snapshot:", {
                                code: upsertError.code,
                                message: upsertError.message,
                                details: upsertError.details,
                                startup_id: startup.id,
                                date: todaySnapDate
                            });
                        }
                    });
            }
        } catch (e) {
            console.error("Failed to fetch live real constraints:", e);
        }
    }

    if (!latestSnap) {
        if (snapshots && snapshots.length > 0) {
            const snap = snapshots[snapshots.length - 1]; // Newest based on date order
            latestSnap = {
                ...snap,
            };

            chartData = snapshots.map((s) => ({
                month: new Date(s.snapshot_date).toLocaleString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
                mrr: s.mrr,
                atr: s.all_time_revenue || 0,
            })) as any;
        }
    }

    // 3. Fallback Health Score Calculation (if missing but metrics available)
    let finalHealthScore = healthScore;
    if (!finalHealthScore && latestSnap) {
        const healthResult = calculateHealthScore({
            mrr: latestSnap.mrr,
            arr: latestSnap.arr,
            allTimeRevenue: latestSnap.all_time_revenue || 0,
            last30DaysRevenue: (latestSnap as any).last30DaysRevenue || latestSnap.mrr,
            momGrowthRate: latestSnap.growth_rate || 0,
            churnRate: latestSnap.churn_rate || 0,
            refundRate: latestSnap.refund_rate || 0,
            customerCount: latestSnap.customer_count || 0,
            volatilityScore: latestSnap.volatility_score || 0,
            revenueByMonth: [] // We don't have month-by-month here, but calculator handles it
        });

        finalHealthScore = {
            score: healthResult.score,
            risk_level: healthResult.riskLevel,
            ai_summary: healthResult.aiSummary,
            created_at: new Date().toISOString()
        };

        // Sync to DB (Await to ensure it completes in server component)
        const { error: healthSyncError } = await adminSupabase.from("health_scores").upsert({
            startup_id: startup.id,
            score: healthResult.score,
            risk_level: healthResult.riskLevel,
            ai_summary: healthResult.aiSummary,
        }, { onConflict: "startup_id" });
        if (healthSyncError) console.error("Failed to sync on-the-fly health score:", healthSyncError);
    }

    let ownerProfile: { name: string | null; x_handle: string | null; avatar_url: string | null } | null = null;
    if (startup.claimed_by_user_id) {
        const { data: profile } = await supabase.from("users").select("name, x_handle, avatar_url").eq("id", startup.claimed_by_user_id)
            .returns<{ name: string | null; x_handle: string | null; avatar_url: string | null }[]>().single();
        ownerProfile = profile;
    }

    const resolvedXHandle = ownerProfile?.x_handle || startup.x_handle;
    const resolvedFounderName = ownerProfile?.name;

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

    // Targeted related startups query
    const relatedQuery = supabase.from("startups")
        .select("id, slug, name, logo_url, is_anonymous, category, description, is_listed_for_sale, is_verified, created_at, sale_status_override, asking_price")
        .neq("id", startup.id)
        .limit(6);

    const { data: rawRelated } = startup.is_listed_for_sale 
        ? await relatedQuery.eq("is_listed_for_sale", true)
        : await relatedQuery.eq("category", startup.category || "Software");

    const shuffledRelated = rawRelated || [];

    let relatedSnapshotsMap: Record<string, any> = {};
    let relatedSaleStatusMap = new Map<string, "sale" | "offers" | "sold">();
    if (shuffledRelated.length > 0) {
        const relatedIds = shuffledRelated.map(s => s.id);
        relatedSaleStatusMap = await getSaleStatusMap(relatedIds);
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

    const annualRev = (latestSnap?.mrr ?? 0) * 12;
    const revMultiple = annualRev > 0 && (startup.asking_price !== null && startup.asking_price !== undefined) ? (startup.asking_price / annualRev).toFixed(1) : null;
    const profitMultiple = annualRev > 0 && (startup.asking_price !== null && startup.asking_price !== undefined) && startup.profit_margin_30d
        ? (startup.asking_price / (annualRev * (startup.profit_margin_30d / 100))).toFixed(1) : null;
    const resolvedCountry = liveCountry || startup.country;
    const formattedCountry = formatCountryLabel(resolvedCountry);
    const countryFlag = getCountryFlag(resolvedCountry);
    const resolvedFoundedDate = liveFoundedDate || startup.founded_date;
    const foundedYear = resolvedFoundedDate ? new Date(resolvedFoundedDate).getFullYear() : null;
    const startupMetaLine = [startup.category, formattedCountry].filter(Boolean).join(" · ");

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": startup.is_anonymous ? "Anonymous Startup" : startup.name,
        "description": startup.description,
        "applicationCategory": startup.category || "BusinessApplication",
        "operatingSystem": "Web",
        "offers": startup.is_listed_for_sale ? {
            "@type": "Offer",
            "price": startup.asking_price,
            "priceCurrency": "USD"
        } : undefined
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar user={user} />

            <div className="page-container" style={{ paddingTop: 100, paddingBottom: 80 }}>
                {/* Breadcrumb */}

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-secondary)", marginBottom: 24, padding: "0 12px" }}>
                    <Link href="/" style={{ color: "var(--color-secondary)", textDecoration: "none" }}>ProvenMRR</Link>
                    <ChevronRight size={12} />
                    <Link href="/browse" style={{ color: "var(--color-secondary)", textDecoration: "none" }}>Startups</Link>
                    <ChevronRight size={12} />
                    <span style={{ color: "var(--color-text)", fontWeight: 600, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</span>
                </div>

                {/* For Sale Banner (if applicable) */}
                {startup.is_listed_for_sale && (
                    <SaleBannerWrapper
                        askingPrice={startup.asking_price && startup.asking_price > 0 ? formatCurrency(startup.asking_price, "USD") : null}
                        startupId={startup.id}
                        startupName={startup.name}
                        revMultiple={revMultiple}
                        profitMultiple={profitMultiple}
                    />
                )}

                {/* Profile Card */}
                <div className="card" style={{ padding: "48px", marginBottom: "40px" }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 88, height: 88, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {startup.logo_url && !startup.is_anonymous ? (
                                    <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative", border: "1px solid var(--startup-card-logo-border)", boxShadow: "var(--startup-card-logo-shadow)", background: "var(--startup-card-logo-bg)" }}>
                                        <img src={startup.logo_url} alt={`${startup.name} logo`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    </div>
                                ) : (
                                    <div style={{ width: 88, height: 88, fontSize: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, letterSpacing: "-0.04em", filter: startup.is_anonymous ? "blur(5px)" : "none", background: "var(--startup-card-logo-bg)", color: "var(--color-text)", border: "1px solid var(--startup-card-logo-border)", boxShadow: "var(--startup-card-logo-shadow)" }}>
                                        {startup.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                    <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em", filter: startup.is_anonymous ? "blur(5px)" : "none", margin: 0 }}>{startup.name}</h1>
                                    {(startup.is_verified && startup.claimed_by_user_id) && (
                                        <div
                                            style={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "linear-gradient(180deg, #78a7ff, #4e72ff)",
                                                boxShadow: "0 8px 18px rgba(78,114,255,0.32), inset 0 1px 0 rgba(255,255,255,0.28)",
                                                border: "1px solid rgba(255,255,255,0.18)",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Check size={15} color="white" strokeWidth={3} />
                                        </div>
                                    )}
                                    {(startup.is_listed_for_sale || saleStatus === "sold") && <StatusBadge status={saleStatus ?? "sale"} />}
                                </div>
                                {startupMetaLine && (
                                    <p style={{ fontSize: 14, color: "var(--color-secondary)", margin: 0, fontWeight: 500, opacity: 0.8 }}>{startupMetaLine}</p>
                                )}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                            <WatchlistButton startupId={startup.id} initialSaved={initialSaved} />
                            <ShareButton />
                            {startup.website_url && !startup.is_anonymous && (
                                <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                                    Visit site <ExternalLink size={14} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 14, marginBottom: 40 }}>
                        {[
                            { label: "MRR", value: formatCurrency(latestSnap?.mrr ?? 0), sub: `${latestSnap?.customer_count ?? 0} active subs` },
                            { label: "ARR", value: formatCurrency((latestSnap?.mrr || 0) * 12), sub: "Annual Recurring" },
                            { label: "ATR", value: formatCurrency(latestSnap?.all_time_revenue || 0), sub: "All Time Revenue" },
                             { label: "Health Score", value: `${finalHealthScore?.score ?? 0}/100`, sub: `${finalHealthScore ? (finalHealthScore.risk_level.charAt(0).toUpperCase() + finalHealthScore.risk_level.slice(1)) : "Unrated"} risk` },
                            {
                                label: "Founded",
                                value: (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <span>{foundedYear || "—"}</span>
                                        {formattedCountry && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-secondary)", fontWeight: 600 }}>
                                                {countryFlag && (
                                                    <img
                                                        src={countryFlag}
                                                        alt={`${formattedCountry} flag`}
                                                        width={18}
                                                        height={14}
                                                        style={{ width: 18, height: 14, objectFit: "cover", borderRadius: 4, border: "1px solid var(--color-border)", flexShrink: 0 }}
                                                    />
                                                )}
                                                <span>{formattedCountry}</span>
                                            </span>
                                        )}
                                    </div>
                                ),
                                sub: ""
                            },
                            {
                                label: "Founder",
                                value: resolvedXHandle ? (
                                    <a href={`https://x.com/${cleanXHandle}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text)", textDecoration: "none", width: "100%", overflow: "hidden" }}>
                                        {xData?.avatar_url && (
                                            <img src={xData.avatar_url} alt="Profile" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                        )}
                                        <span style={{ 
                                            color: "var(--color-text)", 
                                            fontWeight: 700,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            flex: 1
                                        }}>
                                            {resolvedFounderName || xData?.name || `@${cleanXHandle}`}
                                        </span>
                                    </a>
                                ) : (
                                    <span style={{ 
                                        display: "block",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        width: "100%"
                                    }}>
                                        {resolvedFounderName || "—"}
                                    </span>
                                ),
                                sub: resolvedXHandle ? (xData?.followers !== undefined ? `${xData.followers.toLocaleString()} followers` : "Founder") : "—"
                            },
                        ].map(({ label, value, sub }) => (
                            <div
                                key={label}
                                style={{
                                    padding: "20px 24px",
                                    height: 150,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    background: "var(--color-surface-strong)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 20,
                                    boxShadow: "var(--shadow-card)",
                                    backdropFilter: "blur(18px)",
                                    WebkitBackdropFilter: "blur(18px)",
                                    overflow: "hidden"
                                }}
                            >
                                <p className="metric-label" style={{ marginBottom: 8, fontSize: "11px", letterSpacing: "0.08em", color: "var(--color-secondary)", opacity: 0.72 }}>{label}</p>
                                <div style={{ 
                                    fontSize: 28, 
                                    fontWeight: 800, 
                                    color: "var(--color-text)", 
                                    letterSpacing: "-0.03em", 
                                    marginBottom: 8, 
                                    lineHeight: 1.05,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: label === "Founded" ? "normal" : "nowrap",
                                    width: "100%"
                                }}>
                                    {value}
                                </div>
                                <p style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 500, opacity: 0.65, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Revenue Dashboard */}
                    {latestSnap ? (
                         <RealRevenueDashboard
                            latestSnap={latestSnap}
                            chartData={chartData}
                             healthScore={finalHealthScore}
                            isStripeConnected={!!conn && startup.is_verified}
                        />
                    ) : (
                        <div style={{ marginBottom: 40, padding: 40, background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", borderRadius: 20, textAlign: "center", color: "var(--color-secondary)" }}>
                            Historical revenue data is not yet available for this startup.
                        </div>
                    )}

                    {/* Founder Card */}
                    <div style={{ marginBottom: 48 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 24, letterSpacing: "-0.01em" }}>Founder</h2>
                        <div style={{ padding: 28, display: "flex", alignItems: "center", gap: 24, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, boxShadow: "var(--shadow-card)" }}>
                            {ownerProfile?.avatar_url ? (
                                <img src={ownerProfile.avatar_url} alt="Profile" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                            ) : resolvedXHandle && xData?.avatar_url ? (
                                <img src={xData.avatar_url} alt="Profile" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                            ) : (
                                <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600, background: "var(--startup-card-logo-bg)", color: "var(--color-secondary)", border: "1px solid var(--color-border)" }}>
                                    {resolvedXHandle ? cleanXHandle.charAt(0).toUpperCase() : (resolvedFounderName ? resolvedFounderName.charAt(0).toUpperCase() : "F")}
                                </div>
                            )}
                            <div>
                                <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {startup.claimed_by_user_id ? (
                                        resolvedXHandle ? (
                                            <a href={`https://x.com/${cleanXHandle}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text)", textDecoration: "none", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                                <p style={{ fontSize: 14, color: "var(--color-secondary)", margin: 0, marginTop: 6, fontWeight: 500, opacity: 0.6 }}>
                                    {startup.claimed_by_user_id ? (
                                        resolvedXHandle && xData?.followers !== undefined ? `${xData.followers.toLocaleString()} Twitter Followers` : "Founder & Maker"
                                    ) : "Are you the founder? Connect to claim your profile."}
                                </p>
                            </div>
                            {!startup.claimed_by_user_id && (
                                <Link href={user ? `/dashboard/claim/${startup.id}` : `/login?next=${encodeURIComponent('/dashboard/claim/' + startup.id)}`} className="btn btn-primary" style={{ marginLeft: "auto" }}>
                                    Claim this startup
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Insights & Tags Section */}
                    {((insights && Object.keys(insights).length > 0) || (startup.tags && startup.tags.length > 0)) && (
                        <div className="card" style={{ padding: "40px" }}>
                            <h2 style={{ 
                                fontSize: "18px", 
                                fontWeight: 600, 
                                color: "var(--color-text)", 
                                marginBottom: 32 
                            }}>
                                Startup insights
                            </h2>

                            {insights && (
                                <div style={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
                                    gap: "32px", 
                                    marginBottom: 32 
                                }}>
                                    {insights.value_proposition && (
                                        <div style={{ display: "flex", gap: "20px" }}>
                                            <div style={{ 
                                                width: 48, 
                                                height: 48, 
                                                borderRadius: "12px", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: "rgba(99, 102, 241, 0.1)"
                                            }}>
                                                <Lightbulb size={24} color="var(--color-accent)" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, opacity: 0.6 }}>Value Proposition</h3>
                                                <p style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{insights.value_proposition}</p>
                                            </div>
                                        </div>
                                    )}
                                    {insights.problem_solved && (
                                        <div style={{ display: "flex", gap: "20px" }}>
                                            <div style={{ 
                                                width: 48, 
                                                height: 48, 
                                                borderRadius: "12px", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: "rgba(99, 102, 241, 0.1)"
                                            }}>
                                                <Target size={24} color="var(--color-accent)" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, opacity: 0.6 }}>Problem Solved</h3>
                                                <p style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{insights.problem_solved}</p>
                                            </div>
                                        </div>
                                    )}
                                    {insights.pricing && (
                                        <div style={{ display: "flex", gap: "20px" }}>
                                            <div style={{ 
                                                width: 48, 
                                                height: 48, 
                                                borderRadius: "12px", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: "rgba(99, 102, 241, 0.1)"
                                            }}>
                                                <DollarSign size={24} color="var(--color-accent)" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, opacity: 0.6 }}>Pricing</h3>
                                                <p style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{insights.pricing}</p>
                                            </div>
                                        </div>
                                    )}
                                    {insights.business_model && (
                                        <div style={{ display: "flex", gap: "20px" }}>
                                            <div style={{ 
                                                width: 52, 
                                                height: 52, 
                                                borderRadius: "14px", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                background: "var(--color-surface)",
                                                border: "1px solid var(--color-border)",
                                                boxShadow: "var(--shadow-card)"
                                            }}>
                                                <Building size={24} color="var(--color-accent)" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 11, fontWeight: 800, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, opacity: 0.6 }}>Business Details</h3>
                                                <p style={{ fontSize: 15, color: "var(--color-text)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{insights.business_model}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {((startup.tags && startup.tags.length > 0) || (insights?.tech_stack && insights.tech_stack.length > 0)) && (
                                <div style={{ 
                                    paddingTop: 32, 
                                    borderTop: "1px solid rgba(224,232,239,0.1)", 
                                    display: "flex", 
                                    flexDirection: "column",
                                    gap: 24
                                }}>
                                    {(() => {
                                        const techFromInsights = insights?.tech_stack || [];
                                        const techFromTags = startup.tags || [];
                                        const techStack = [...new Set([...techFromInsights, ...techFromTags])]
                                            .filter((t: string) => t && t !== "[object Object]");
                                        
                                        // Use pre-categorized stacks if available, otherwise filter
                                        const insightFrontend = insights?.frontend_stack || [];
                                        const insightBackend = insights?.backend_stack || [];
                                        
                                        const frontendTechs = [...new Set([
                                            ...insightFrontend,
                                            ...techStack.filter((t: string) => TECH_STACK_OPTIONS.find((o: any) => o.value === t)?.category === 'frontend')
                                        ])];
                                        
                                        const backendTechs = [...new Set([
                                            ...insightBackend,
                                            ...techStack.filter((t: string) => TECH_STACK_OPTIONS.find((o: any) => o.value === t)?.category === 'backend')
                                        ])];
                                        
                                        const otherTags = techStack.filter((t: string) => 
                                            !frontendTechs.includes(t) && !backendTechs.includes(t)
                                        );

                                        return (
                                            <>
                                                {frontendTechs.length > 0 && (
                                                    <div>
                                                        <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, opacity: 0.7 }}>Frontend</h3>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                            {frontendTechs.map((tech: string) => {
                                                                const option = TECH_STACK_OPTIONS.find((o: any) => o.value === tech);
                                                                const Icon = option?.icon;
                                                                return (
                                                                    <span key={tech} style={{
                                                                        padding: "6px 14px",
                                                                        fontSize: "12px",
                                                                        fontWeight: 600,
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        background: "var(--color-surface)",
                                                                        border: "1px solid var(--color-border)",
                                                                        borderRadius: 100,
                                                                        color: "var(--color-text)",
                                                                        boxShadow: "var(--shadow-card)"
                                                                    }}>
                                                                        {Icon && <Icon size={14} color="var(--color-accent)" />}
                                                                        {tech}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {backendTechs.length > 0 && (
                                                    <div>
                                                        <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, opacity: 0.7 }}>Backend</h3>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                            {backendTechs.map((tech: string) => {
                                                                const option = TECH_STACK_OPTIONS.find((o: any) => o.value === tech);
                                                                const Icon = option?.icon;
                                                                return (
                                                                    <span key={tech} style={{
                                                                        padding: "6px 14px",
                                                                        fontSize: "12px",
                                                                        fontWeight: 600,
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "8px",
                                                                        background: "var(--color-surface)",
                                                                        border: "1px solid var(--color-border)",
                                                                        borderRadius: 100,
                                                                        color: "var(--color-text)",
                                                                        boxShadow: "var(--shadow-card)"
                                                                    }}>
                                                                        {Icon && <Icon size={14} color="var(--color-accent)" />}
                                                                        {tech}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {otherTags.length > 0 && (
                                                    <div>
                                                        <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, opacity: 0.7 }}>Tags</h3>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                            {otherTags.map((tag: string) => (
                                                                <span key={tag} style={{
                                                                    padding: "6px 14px",
                                                                    fontSize: "12px",
                                                                    fontWeight: 600,
                                                                    background: "var(--color-surface)",
                                                                    border: "1px solid var(--color-border)",
                                                                    borderRadius: 100,
                                                                    color: "var(--color-text)",
                                                                    boxShadow: "var(--shadow-card)"
                                                                }}>
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Related Startups */}
                {shuffledRelated.length > 0 && (
                    <div style={{ marginTop: 48 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "0 12px" }}>
                            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text)", letterSpacing: "-0.01em", margin: 0 }}>
                                Discover more startups
                            </h2>
                            <Link href="/browse" style={{ fontSize: 14, fontWeight: 600, color: "var(--color-accent)", textDecoration: "none" }}>
                                View all startups
                            </Link>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                            {shuffledRelated.map(s => (
                                <StartupDiscoveryCard
                                    key={s.id}
                                    s={{
                                        ...s,
                                        sale_status: (s as any).sale_status_override === "sold" ? "sold" : (s.is_listed_for_sale ? (relatedSaleStatusMap.get(s.id) ?? "sale") : null),
                                    }}
                                    snap={relatedSnapshotsMap[s.id]}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
