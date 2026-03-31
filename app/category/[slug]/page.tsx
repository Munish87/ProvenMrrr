import { createAdminClient } from "@/lib/supabase/server";
import { CATEGORY_MAP } from "@/lib/categories";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StartupDiscoveryCard } from "@/components/startup/StartupDiscoveryCard";
import { CategoryStartupList } from "@/components/startup/CategoryStartupList";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { getSaleStatusMap } from "@/lib/startup-sale-status";
import { Navbar } from "@/components/layout/Navbar";

// Revalidate category pages every 30 minutes
export const revalidate = 1800;

export async function generateStaticParams() {
    return Object.keys(CATEGORY_MAP).map((slug) => ({
        slug: slug,
    }));
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;
    const categoryName = CATEGORY_MAP[slug];

    if (!categoryName) {
        notFound();
    }

    const supabase = createAdminClient();

    // 1. Fetch first batch of startups
    const { data: firstBatch, error: firstBatchError } = await supabase.from("startups")
        .select("id, name, logo_url, description, category, is_listed_for_sale, is_verified, is_anonymous, created_at, sale_status_override, asking_price, monthly_revenue, growth_rate, revenue_30d")
        .eq("category", categoryName)
        .order("id")
        .limit(1000);

    if (firstBatchError) {
        console.error("Error fetching startups:", firstBatchError);
    }

    let allStartups = firstBatch || [];

    // 2. Fetch remaining startups if necessary (pagination)
    if (allStartups.length === 1000) {
        let lastId = allStartups[allStartups.length - 1].id;
        while (true) {
            const { data, error } = await supabase
                .from("startups")
                .select("id, name, logo_url, description, category, is_listed_for_sale, is_verified, is_anonymous, created_at, sale_status_override, asking_price, monthly_revenue, growth_rate, revenue_30d")
                .eq("category", categoryName)
                .order("id")
                .gt("id", lastId)
                .limit(1000);

            if (error || !data || data.length === 0) break;

            allStartups = [...allStartups, ...data];
            lastId = data[data.length - 1].id;
            if (data.length < 1000) break;
        }
    }

    // Sort by created_at desc in memory as the primary category view
    const startups = allStartups.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const ids = startups.map(s => s.id);

    // 3. Fetch sale status and latest snapshots in parallel for specific IDs
    const [saleStatusMap, snapshotsData] = await Promise.all([
        getSaleStatusMap(ids),
        (async () => {
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
            return latestSnapshotsMap;
        })()
    ]);

    const snapMap: Record<string, any> = Object.fromEntries(snapshotsData.entries());

    // Backfill snapMap from startups table columns
    for (const startup of startups) {
        if (!snapshotsData.has(startup.id) && ((startup.monthly_revenue || 0) > 0 || (startup.revenue_30d || 0) > 0)) {
            snapMap[startup.id] = {
                mrr: startup.monthly_revenue || 0,
                arr: (startup.monthly_revenue || 0) > 0 ? (startup.monthly_revenue || 0) * 12 : (startup.revenue_30d || 0) * 12,
                growth_rate: startup.growth_rate || 0,
                all_time_revenue: startup.revenue_30d || 0,
                snapshot_date: startup.created_at
            };
        }
    }

    const startupsWithSaleStatus = startups.map((startup) => {
        const status = (startup as any).sale_status_override === "sold" ? "sold" : (startup.is_listed_for_sale ? (saleStatusMap.get(startup.id) ?? "sale") : null);
        return {
            ...startup,
            sale_status: status,
        };
    });

    return (
        <div style={{ minHeight: "100vh" }}>
            <Navbar user={null} />

            <main className="page-container" style={{ paddingTop: 82, paddingBottom: 68 }}>
                {/* Category Header */}
                <div style={{ marginBottom: 32 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-secondary)", opacity: 0.6, marginBottom: 14 }}>
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
                        border: "1px dashed var(--color-border)",
                        background: "var(--color-surface)"
                    }}>
                        <p style={{ color: "var(--color-secondary)", fontSize: 15, marginBottom: 18 }}>No startups listed in this category yet.</p>
                        <Link href="/" className="btn btn-secondary" style={{ marginTop: 24 }}>Browse all categories</Link>
                    </div>
                ) : (
                    <CategoryStartupList
                        startups={startupsWithSaleStatus}
                        snapMap={snapMap}
                    />
                )}

                {/* Discovery Footer (TrustMRR Style) */}
                <div style={{ marginTop: 64, paddingTop: 48, borderTop: "1px solid var(--color-border)" }}>
                    <CategoryBrowser activeSlug={slug} />
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
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
