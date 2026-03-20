"use server";

import { createClient } from "@/lib/supabase/server";
import { getSaleStatusMap } from "@/lib/startup-sale-status";
import { BrowseStartupNode } from "@/components/browse/BrowseFeed";

export async function fetchMoreStartups({
    page,
    searchQuery,
    category,
    country,
    onlyForSale,
    minMrr,
    maxMrr,
    minPrice,
    maxPrice,
    sort
}: {
    page: number;
    searchQuery?: string;
    category?: string;
    country?: string;
    onlyForSale?: boolean;
    minMrr?: string;
    maxMrr?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
}) {
    const supabase = await createClient();
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = supabase
        .from("startups")
        .select(`
            id, name, slug, logo_url, description, category, country, website_url, 
            is_listed_for_sale, is_verified, is_anonymous, created_at, 
            asking_price, monthly_revenue, revenue_30d, growth_rate
        `)
        .eq("is_verified", true);

    if (category && category.toLowerCase() !== "all") query = query.eq("category", category);
    if (country && country.toLowerCase() !== "all") query = query.eq("country", country);
    if (onlyForSale) query = query.eq("is_listed_for_sale", true);

    if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    if (minMrr) query = query.gte("monthly_revenue", parseFloat(minMrr));
    if (maxMrr) query = query.lte("monthly_revenue", parseFloat(maxMrr));
    if (minPrice) query = query.gte("asking_price", parseFloat(minPrice));
    if (maxPrice) query = query.lte("asking_price", parseFloat(maxPrice));

    if (sort === "growth") {
        query = query.order("growth_rate", { ascending: false });
    } else {
        query = query.order("created_at", { ascending: false });
    }

    const { data: startups, error } = await query.range(offset, offset + limit - 1);
    
    if (error || !startups) return [];

    const ids = startups.map((s) => s.id);
    const saleStatusMap = await getSaleStatusMap(ids);
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

    return startups.map(s => ({
        ...s,
        sale_status: (saleStatusMap.get(s.id) === "sold") ? "sold" : (s.is_listed_for_sale ? (saleStatusMap.get(s.id) ?? "sale") : null),
        snap: {
            mrr: Number(s.monthly_revenue || 0),
            arr: (s.monthly_revenue !== null && s.monthly_revenue !== undefined) ? s.monthly_revenue * 12 : 0,
            growth_rate: Number(s.growth_rate || 0),
            all_time_revenue: Number(s.revenue_30d || 0)
        },
        score: scoreMap.get(s.id)
    })) as BrowseStartupNode[];
}
