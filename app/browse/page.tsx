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
    const categoryQuery = typeof searchParams?.category === "string" ? searchParams.category : "All";
    const countryQuery = typeof searchParams?.country === "string" ? searchParams.country : "All";
    const filterQuery = typeof searchParams?.filter === "string" ? searchParams.filter : "all";
    const searchQuery = typeof searchParams?.q === "string" ? searchParams.q : "";
    
    // Additional filters from the sidebar
    const minMrr = typeof searchParams?.minMrr === "string" ? Number(searchParams.minMrr) : null;
    const maxMrr = typeof searchParams?.maxMrr === "string" ? Number(searchParams.maxMrr) : null;
    const minPrice = typeof searchParams?.minPrice === "string" ? Number(searchParams.minPrice) : null;
    const maxPrice = typeof searchParams?.maxPrice === "string" ? Number(searchParams.maxPrice) : null;
    const minGrowth = typeof searchParams?.minGrowth === "string" ? Number(searchParams.minGrowth) : null;
    const maxGrowth = typeof searchParams?.maxGrowth === "string" ? Number(searchParams.maxGrowth) : null;
    const maxMultiple = typeof searchParams?.maxMultiple === "string" ? searchParams.maxMultiple : "Any";
    
    const page = typeof searchParams?.page === "string" ? parseInt(searchParams.page) : 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Build dynamic Supabase query
    let query = supabase
        .from("startups")
        .select(`
            id, name, slug, logo_url, description, category, country, website_url, 
            is_listed_for_sale, is_verified, is_anonymous, created_at, 
            asking_price, monthly_revenue, revenue_30d, growth_rate
        `, { count: "exact" })
        .eq("is_verified", true);

    if (categoryQuery.toLowerCase() !== "all") {
        query = query.eq("category", categoryQuery);
    }
    
    if (countryQuery.toLowerCase() !== "all") {
        query = query.eq("country", countryQuery);
    }
    
    if (filterQuery === "deals") {
        query = query.eq("is_listed_for_sale", true);
    }

    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    if (minMrr !== null) query = query.gte("monthly_revenue", minMrr);
    if (maxMrr !== null) query = query.lte("monthly_revenue", maxMrr);
    if (minPrice !== null) query = query.gte("asking_price", minPrice);
    if (maxPrice !== null) query = query.lte("asking_price", maxPrice);
    if (minGrowth !== null) query = query.gte("growth_rate", minGrowth);
    if (maxGrowth !== null) query = query.lte("growth_rate", maxGrowth);
    
    if (maxMultiple !== "Any") {
        const multipleLimit = parseFloat(maxMultiple.replace("x", ""));
        // Since price multiple = asking_price / (monthly_revenue * 12),
        // we can filter for asking_price <= multipleLimit * monthly_revenue * 12.
        // Postgrest doesn't support col / col math easily, so we filter in-memory for now 
        // as the list is naturally capped by verification.
    }

    // Sorting
    if (filterQuery === "growth") {
        query = query.order("growth_rate", { ascending: false });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    // Pagination
    const { data: startups, error, count } = await query.range(offset, offset + limit - 1);
    
    if (error) {
        console.error("Browse query error:", error);
    }

    const ids = (startups || []).map((s) => s.id);
    const saleStatusMap = await getSaleStatusMap(ids);

    // 2. Fetch health scores for ONLY this page
    const scoreMap = new Map<string, number>();
    if (ids.length > 0) {
        const { data: scores } = await supabase
            .from("health_scores")
            .select("startup_id, score")
            .in("startup_id", ids)
            .order("created_at", { ascending: false });
        
        for (const s of scores ?? []) {
            if (!scoreMap.has(s.startup_id)) scoreMap.set(s.startup_id, s.score);
        }
    }

    let initialStartups: BrowseStartupNode[] = (startups || []).map(s => ({
        ...s,
        sale_status: (saleStatusMap.get(s.id) === "sold") ? "sold" : (s.is_listed_for_sale ? (saleStatusMap.get(s.id) ?? "sale") : null),
        snap: {
            mrr: Number(s.monthly_revenue || 0),
            arr: (s.monthly_revenue !== null && s.monthly_revenue !== undefined) ? s.monthly_revenue * 12 : 0,
            growth_rate: Number(s.growth_rate || 0),
            all_time_revenue: Number(s.revenue_30d || 0)
        },
        score: scoreMap.get(s.id)
    }));

    if (maxMultiple !== "Any") {
        const multipleLimit = parseFloat(maxMultiple.replace("x", ""));
        initialStartups = initialStartups.filter(s => {
            const arr = s.snap?.arr || (s.monthly_revenue ? s.monthly_revenue * 12 : 0);
            if (!arr || !s.asking_price) return true; // Show others
            return (s.asking_price / arr) <= multipleLimit;
        });
    }

    return (
        <>
            <Navbar user={user} />

            <div className="page-container" style={{ paddingTop: 84, paddingBottom: 72 }}>
                <BrowseFeed 
                    initialStartups={initialStartups} 
                    totalCount={count || 0}
                    initialQuery={searchQuery} 
                    initialCategory={categoryQuery}
                    initialCountry={countryQuery}
                    initialOnlyForSale={filterQuery === "deals"}
                    initialMinMrr={searchParams?.minMrr as string || ""}
                    initialMaxMrr={searchParams?.maxMrr as string || ""}
                    initialMinGrowth={searchParams?.minGrowth as string || ""}
                    initialMaxGrowth={searchParams?.maxGrowth as string || ""}
                    initialMinPrice={searchParams?.minPrice as string || ""}
                    initialMaxPrice={searchParams?.maxPrice as string || ""}
                    initialMaxMultiple={searchParams?.maxMultiple as string || "Any"}
                />
                
                <div style={{ marginTop: 80, paddingTop: 56, borderTop: "1px solid rgba(255,255,255,0.42)" }}>
                    <CategoryBrowser />
                </div>
            </div>
        </>
    );
}
