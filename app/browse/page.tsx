import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrowseFeed, BrowseStartupNode } from "@/components/browse/BrowseFeed";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { Navbar } from "@/components/layout/Navbar";
import { getSaleStatusMap } from "@/lib/startup-sale-status";

export const metadata = { title: "Browse Verified Startups — ProvenMRR" };
export const dynamic = "force-dynamic";

export default async function BrowsePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const filterQuery = searchParams?.filter;
    const searchQuery = typeof searchParams?.q === "string" ? searchParams.q : "";
    const categoryQuery = typeof searchParams?.category === "string" ? searchParams.category : "All";
    const countryQuery = typeof searchParams?.country === "string" ? searchParams.country.toUpperCase() : "All";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch ALL verified startups using pagination to exceed Supabase's 1,000 limit
    let allVerifiedStartups: any[] = [];
    let lastId = null;
    while (true) {
        let query = supabase
            .from("startups")
            .select("id, name, logo_url, description, category, country, website_url, is_listed_for_sale, is_verified, is_anonymous, created_at, asking_price, monthly_revenue, revenue_30d, growth_rate")
            .eq("is_verified", true)
            .order("id");
            
        if (lastId) query = query.gt("id", lastId);
        
        const { data, error } = await query.limit(1000).returns<any[]>();
        if (error || !data || data.length === 0) break;
        
        allVerifiedStartups = [...allVerifiedStartups, ...data];
        lastId = data[data.length - 1].id;
        if (data.length < 1000) break;
    }

    // Sort by created_at desc in memory as the primary feed view
    const all = allVerifiedStartups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const ids = all.map((s) => s.id);
    const saleStatusMap = await getSaleStatusMap(ids);

    // 2. Fetch health scores in batches to handle many IDs and the 1k result limit
    const scoreMap = new Map<string, number>();
    const ID_BATCH_SIZE = 500;
    for (let i = 0; i < ids.length; i += ID_BATCH_SIZE) {
        const chunk = ids.slice(i, i + ID_BATCH_SIZE);
        const { data: chunkScores } = await supabase
            .from("health_scores")
            .select("startup_id, score")
            .in("startup_id", chunk)
            .order("created_at", { ascending: false });
        
        for (const s of chunkScores ?? []) {
            if (!scoreMap.has(s.startup_id)) scoreMap.set(s.startup_id, s.score);
        }
    }

    const initialStartups: BrowseStartupNode[] = all.map(s => ({
        ...s,
        sale_status: (saleStatusMap.get(s.id) === "sold") ? "sold" : (s.is_listed_for_sale ? (saleStatusMap.get(s.id) ?? "sale") : null),
        snap: {
            mrr: Number(s.monthly_revenue || 0),
            arr: Number(s.monthly_revenue ? s.monthly_revenue * 12 : 0),
            growth_rate: Number(s.growth_rate || 0),
            all_time_revenue: Number(s.revenue_30d || 0)
        },
        score: scoreMap.get(s.id)
    }));

    if (filterQuery === 'growth') {
        initialStartups.sort((a, b) => (b.snap?.growth_rate || 0) - (a.snap?.growth_rate || 0));
    }

    return (
        <>
            <Navbar user={user} />

            <div className="page-container" style={{ paddingTop: 84, paddingBottom: 72 }}>
                <BrowseFeed 
                    initialStartups={initialStartups} 
                    initialQuery={searchQuery} 
                    initialCategory={categoryQuery}
                    initialCountry={countryQuery}
                    initialOnlyForSale={filterQuery === 'deals'}
                />
                
                <div style={{ marginTop: 80, paddingTop: 56, borderTop: "1px solid rgba(255,255,255,0.42)" }}>
                    <CategoryBrowser />
                </div>
            </div>
        </>
    );
}
