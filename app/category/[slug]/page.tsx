import { createClient } from "@/lib/supabase/server";
import { CATEGORY_MAP } from "@/lib/categories";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StartupDiscoveryCard } from "@/components/startup/StartupDiscoveryCard";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { getSaleStatusMap } from "@/lib/startup-sale-status";

export const dynamic = "force-dynamic";

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const categoryName = CATEGORY_MAP[slug];

    if (!categoryName) {
        notFound();
    }

    const supabase = await createClient();

    // 1. Fetch ALL startups for this category using pagination
    let allStartups: any[] = [];
    let lastId = null;
    while (true) {
        let query = supabase
            .from("startups")
            .select("id, name, logo_url, description, category, is_listed_for_sale, is_verified, is_anonymous, created_at, sale_status_override, asking_price, monthly_revenue, growth_rate, revenue_30d")
            .eq("category", categoryName)
            .order("id");
            
        if (lastId) query = query.gt("id", lastId);
        
        const { data, error } = await query.limit(1000).returns<any[]>();
        if (error || !data || data.length === 0) break;
        
        allStartups = [...allStartups, ...data];
        lastId = data[data.length - 1].id;
        if (data.length < 1000) break;
    }

    // Sort by created_at desc in memory as the primary category view
    const startups = allStartups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const ids = startups.map(s => s.id);
    const saleStatusMap = await getSaleStatusMap(ids);

    // 2. Fetch latest revenue snapshots for these IDs in batches
    const latestSnapshotsMap = new Map<string, any>();
    const SNAP_BATCH_SIZE = 500;
    for (let i = 0; i < ids.length; i += SNAP_BATCH_SIZE) {
        const chunk = ids.slice(i, i + SNAP_BATCH_SIZE);
        const { data: chunkSnaps } = await supabase
            .from("revenue_snapshots")
            .select("startup_id, mrr, arr, growth_rate, all_time_revenue, snapshot_date")
            .in("startup_id", chunk)
            .order("snapshot_date", { ascending: false });
        
        for (const snap of chunkSnaps ?? []) {
            if (!latestSnapshotsMap.has(snap.startup_id)) {
                latestSnapshotsMap.set(snap.startup_id, snap);
            }
        }
    }

    const snapMap: Record<string, any> = Object.fromEntries(latestSnapshotsMap.entries());

    // Backfill snapMap from startups table columns
    for (const startup of startups) {
        if (!latestSnapshotsMap.has(startup.id) && (startup.monthly_revenue > 0 || (startup.revenue_30d || 0) > 0)) {
            snapMap[startup.id] = {
                mrr: startup.monthly_revenue || 0,
                arr: (startup.monthly_revenue || 0) > 0 ? (startup.monthly_revenue || 0) * 12 : (startup.revenue_30d || 0) * 12,
                growth_rate: startup.growth_rate || 0,
                all_time_revenue: startup.revenue_30d || 0,
                snapshot_date: startup.created_at
            };
        }
    }

    const { data: { user } } = await supabase.auth.getUser();
    const startupsWithSaleStatus = startups.map((startup) => {
        const status = (startup as any).sale_status_override === "sold" ? "sold" : (startup.is_listed_for_sale ? (saleStatusMap.get(startup.id) ?? "sale") : null);
        return {
            ...startup,
            sale_status: status,
        };
    });

    return (
        <div style={{ minHeight: "100vh" }}>
            <header style={{ 
                background: "transparent",
                borderBottom: "none",
                padding: "14px 0 0",
                position: "sticky",
                top: 12,
                zIndex: 60
            }}>
                <div
                    className="page-container site-header-inner"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        maxWidth: 1240,
                    }}
                >
                    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                        <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: "var(--color-text)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, background: "var(--color-accent)", borderRadius: "50%" }} />
                            ProvenMRR
                        </Link>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {!user ? (
                            <>
                                <Link href="/login" style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
                                <Link href="/login" className="btn btn-secondary btn-sm" style={{ padding: "6px 12px", fontSize: 13 }}>Sign up</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/dashboard" style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 600, textDecoration: "none" }}>Dashboard</Link>
                                <form action="/auth/signout" method="POST">
                                    <button type="submit" className="btn btn-secondary btn-sm" style={{ cursor: "pointer", padding: "6px 12px", fontSize: 13 }}>
                                        Sign out
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="page-container" style={{ paddingTop: 82, paddingBottom: 120 }}>
                {/* Category Header */}
                <div style={{ marginBottom: 40 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(241,241,236,0.6)", marginBottom: 14 }}>
                        Category Spotlight
                    </p>
                    <h1 style={{ 
                        fontSize: 36, 
                        fontWeight: 800, 
                        color: "var(--color-text)", 
                        marginBottom: 12,
                        letterSpacing: "-0.8px"
                    }}>
                        {categoryName} startups
                    </h1>
                    <p style={{ 
                        fontSize: 16, 
                        color: "var(--color-secondary)",
                        maxWidth: 600,
                        fontWeight: 500,
                        opacity: 0.6
                    }}>
                        Verified revenue and MRR data for {typeof categoryName === 'string' ? categoryName.toLowerCase() : 'startup'} companies. 
                        Explore {startupsWithSaleStatus.length} {typeof categoryName === 'string' ? categoryName.toLowerCase() : 'startup'} startups.
                    </p>
                </div>

                {(startupsWithSaleStatus.length === 0) ? (
                    <div className="glass" style={{ 
                        textAlign: "center", 
                        padding: "96px 24px", 
                        borderRadius: 32,
                        border: "1px dashed rgba(224,232,239,0.18)",
                        background: "linear-gradient(180deg, rgba(214,223,230,0.08), rgba(92,98,104,0.04) 18%, rgba(18,19,18,0.56) 58%, rgba(10,11,10,0.82))"
                    }}>
                        <p style={{ color: "rgba(241,241,236,0.72)", fontSize: 15, marginBottom: 18 }}>No startups listed in this category yet.</p>
                        <Link href="/" className="btn btn-secondary" style={{ marginTop: 24 }}>Browse all categories</Link>
                    </div>
                ) : (
                    <div
                        className="glass"
                        style={{
                            padding: 28,
                            borderRadius: 32,
                            background: "linear-gradient(180deg, rgba(164,174,182,0.08), rgba(72,78,84,0.04) 16%, rgba(16,18,17,0.62) 56%, rgba(10,11,10,0.84))",
                            border: "1px solid rgba(224,232,239,0.16)",
                            boxShadow: "0 18px 40px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -14px 30px rgba(0,0,0,0.12)",
                        }}
                    >
                        <div className="startup-grid-container" style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))", 
                            gap: 22,
                            animation: "fadeInUp 0.6s ease-out"
                        }}>
                            {startupsWithSaleStatus.map((s) => (
                                <StartupDiscoveryCard 
                                    key={s.id} 
                                    s={s as any} 
                                    snap={snapMap[s.id]} 
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Discovery Footer (TrustMRR Style) */}
                <div style={{ marginTop: 96, paddingTop: 64, borderTop: "1px solid rgba(224,232,239,0.12)" }}>
                    <CategoryBrowser activeSlug={slug} />
                </div>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 1024px) {
                    .startup-grid-container {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 640px) {
                    .startup-grid-container {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const categoryName = CATEGORY_MAP[slug];
    const year = new Date().getFullYear();
    
    const title = `Top ${categoryName || 'Startup'} Verified Revenue Leaderboard (${year}) — ProvenMRR`;
    const description = `Discover and compare verified revenue, MRR, and growth data for ${categoryName || 'various'} startups. Real-time insights from Stripe-connected companies in ${categoryName}.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://provenmrr.com/category/${slug}`,
        },
        openGraph: {
            title,
            description,
            type: "website",
            url: `https://provenmrr.com/category/${slug}`,
        }
    };
}
