import { createAdminClient } from "@/lib/supabase/server";
import { calculateHealthScore } from "@/lib/health-score/calculator";

interface TrustMRRStartup {
    name: string;
    slug: string;
    description?: string;
    website?: string;
    icon?: string;
    category?: string;
    country?: string;
    foundedDate?: string;
    xHandle?: string;
    revenue?: {
        mrr: number;
        last30Days: number;
        total: number;
    };
    customers: number;
    growthMRR30d?: number;
    askingPrice?: number | null;
    onSale: boolean;
    // Detail fields
    ranking?: number;
    techStack?: string[];
    frontendStack?: string[];
    backendStack?: string[];
    visitorsLast30Days?: number;
    socialMetrics?: any;
    gscData?: any;
    monthlyRevenue?: number;
    revenueLast30Days?: number;
    revenueTotal?: number;
    growthRate?: number;
    customerCount?: number;
}

export class TrustMRRImporter {
    private static readonly BASE_URL = "https://trustmrr.com/api/v1";
    private static readonly API_KEY = process.env.TRUSTMRR_API_KEY || "";
    private static readonly RATE_LIMIT_DELAY = 3100; // 20 requests per minute = 1 every 3s

    static async importStartups(skipTimeout = false, fastSync = false) {
        if (!this.API_KEY) {
            console.error("TRUSTMRR_API_KEY is not set");
            return { error: "TRUSTMRR_API_KEY is not set" };
        }

        const supabase = createAdminClient();
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let page = 1;
        const limit = 100;
        let hasMore = true;
        const processedSlugs = new Set<string>();

        const startTime = Date.now();
        const MAX_EXECUTION_TIME = 50000; // 50 seconds max to prevent serverless timeout

        try {
            while (hasMore) {
                if (!skipTimeout && Date.now() - startTime > MAX_EXECUTION_TIME) {
                    console.log("Approaching Vercel execution limit. Stopping import early.");
                    break;
                }

                console.log(`Fetching page ${page} from TrustMRR...`);
                let response = await fetch(`${this.BASE_URL}/startups?page=${page}&limit=${limit}`, {
                    headers: {
                        "Authorization": `Bearer ${this.API_KEY}`,
                        "Accept": "application/json"
                    }
                });

                if (response.status === 429) {
                    console.warn("Rate limited on page fetch. Waiting 60s...");
                    await new Promise(r => setTimeout(r, 60000));
                    response = await fetch(`${this.BASE_URL}/startups?page=${page}&limit=${limit}`, {
                        headers: {
                            "Authorization": `Bearer ${this.API_KEY}`,
                            "Accept": "application/json"
                        }
                    });
                }

                if (!response.ok) {
                    throw new Error(`TrustMRR API error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                const trustStartups: TrustMRRStartup[] = data.data || [];

                console.log(`Found ${trustStartups.length} startups on page ${page}.`);

                if (trustStartups.length === 0) {
                    hasMore = false;
                    break;
                }

                const slugs = trustStartups.map(s => s.slug);
                const { data: existingStartups } = await supabase
                    .from("startups")
                    .select("id, slug, is_listed_for_sale, asking_price, insights, tags")
                    .in("slug", slugs);
                
                const existingMap = new Map((existingStartups || []).map((s: any) => [s.slug, s]));
                const pageStartupsToUpsert: any[] = [];

                for (const item of trustStartups) {
                    if (!skipTimeout && Date.now() - startTime > MAX_EXECUTION_TIME) {
                        console.log("Approaching Vercel execution limit mid-page. Breaking loop.");
                        break;
                    }

                    const existing = existingMap.get(item.slug);

                    // Detection of anonymous startups
                    const nameLower = (item.name || "").toLowerCase();
                    const isAnonymous = nameLower.includes("anonymous") || nameLower === "saas" || nameLower === "stealth";

                    // Optional: Fetch details if missing tech stack/visitors
                    let detailData: Partial<TrustMRRStartup> = {};
                    const currentInsights = (existing?.insights as any) || {};
                    const hasInsights = existing && 
                        Object.keys(currentInsights).length > 2 && 
                        (currentInsights.visitors_30d > 0 || (existing.tags && existing.tags.length > 0) || (currentInsights.tech_stack && currentInsights.tech_stack.length > 0));

                    if (!fastSync && !isAnonymous && !processedSlugs.has(item.slug) && !hasInsights) {
                         try {
                            const detailRes = await fetch(`${this.BASE_URL}/startups/${item.slug}`, {
                                headers: { "Authorization": `Bearer ${this.API_KEY}`, "Accept": "application/json" }
                            });
                            if (detailRes.ok) {
                                const detailJson = await detailRes.json();
                                const d = detailJson.data || {};
                                
                                const techItems = (d.techStack || item.techStack || []).map((t: any) => {
                                    let val = "";
                                    let category = "";
                                    if (typeof t === 'string') {
                                        val = t;
                                    } else if (t && typeof t === 'object') {
                                        val = t.slug || t.name || t.label || t.value || "";
                                        category = t.category || "";
                                    }
                                    
                                    if (!val || val === "[object Object]") return null;
                                    
                                    const lower = val.toLowerCase();
                                    let name = val;
                                    if (lower === "reactjs") name = "React";
                                    else if (lower === "nextjs") name = "Next.js";
                                    else if (lower === "nodejs") name = "Node.js";
                                    else if (lower === "postgresql" || lower === "postgres") name = "PostgreSQL";
                                    else if (lower === "mongodb") name = "MongoDB";
                                    else if (lower === "supabase") name = "Supabase";
                                    else if (lower === "firebase") name = "Firebase";
                                    else if (lower === "aws") name = "AWS";
                                    else if (lower === "stripe") name = "Stripe";
                                    else name = val.charAt(0).toUpperCase() + val.slice(1);

                                    return { name, category };
                                }).filter(Boolean);

                                detailData = {
                                    techStack: techItems.map((i: any) => i.name),
                                    visitorsLast30Days: d.visitorsLast30Days || 0,
                                    description: d.description || item.description,
                                    ranking: d.revenueRanking || 0,
                                    category: d.category || item.category,
                                    socialMetrics: {
                                        xFollowers: d.socialMetrics?.xFollowers || 0,
                                        gscImpressions: d.gscData?.impressions || 0,
                                        xHandle: d.socialMetrics?.xHandle || item.xHandle
                                    },
                                    monthlyRevenue: d.monthlyRevenue || 0,
                                    revenueLast30Days: d.revenueLast30Days || 0,
                                    revenueTotal: d.revenueTotal || 0,
                                    growthRate: d.growthRate || 0,
                                    customerCount: d.customerCount || 0,
                                    frontendStack: techItems.filter((i: any) => i.category === 'frontend').map((i: any) => i.name),
                                    backendStack: techItems.filter((i: any) => i.category === 'backend').map((i: any) => i.name)
                                };
                            }
                         } catch (e) {
                             console.error(`Failed to fetch details for ${item.slug}:`, e);
                         }
                         await new Promise(r => setTimeout(r, this.RATE_LIMIT_DELAY));
                    }

                    // REVENUE EXTRACTION with fallbacks
                    const revenue30d = detailData.revenueLast30Days || item.revenue?.last30Days || 0;
                    const monthlyRevFromApi = detailData.monthlyRevenue || item.revenue?.mrr || 0;
                    const mrr = monthlyRevFromApi > 0 ? monthlyRevFromApi : revenue30d;
                    const growth = detailData.growthRate || item.growthMRR30d || 0;
                    const customers = detailData.customerCount || item.customers || 0;
                    const allTimeRevenue = detailData.revenueTotal || item.revenue?.total || 0;

                    const startupData = {
                        name: item.name,
                        slug: item.slug,
                        description: detailData.description || item.description,
                        website_url: item.website,
                        logo_url: item.icon,
                        category: item.category,
                        country: item.country,
                        founded_date: item.foundedDate,
                        x_handle: detailData.socialMetrics?.xHandle || item.xHandle,
                        source: "trustmrr",
                        monthly_revenue: mrr,
                        growth_rate: growth,
                        customer_count: customers,
                        revenue_30d: revenue30d,
                        asking_price: null,
                        is_listed_for_sale: false,
                        is_verified: true,
                        verified: true,
                        is_anonymous: isAnonymous,
                        tags: detailData.techStack || [],
                        insights: {
                            ...currentInsights,
                            tech_stack: detailData.techStack || currentInsights.tech_stack || [],
                            frontend_stack: detailData.frontendStack || currentInsights.frontend_stack || [],
                            backend_stack: detailData.backendStack || currentInsights.backend_stack || [],
                            visitors_30d: detailData.visitorsLast30Days || currentInsights.visitors_30d || 0,
                            revenue_ranking: detailData.ranking || currentInsights.revenue_ranking || 0,
                            social: detailData.socialMetrics || currentInsights.social || {},
                            problem_solved: detailData.description || item.description || currentInsights.problem_solved,
                            value_proposition: item.description || currentInsights.value_proposition,
                            business_model: item.category || detailData.category || currentInsights.business_model || "Software/SaaS"
                        }
                    };

                    if (existing) {
                        startupData.is_listed_for_sale = existing.is_listed_for_sale;
                        startupData.asking_price = existing.asking_price;
                        updated++;
                    } else {
                        imported++;
                    }

                    pageStartupsToUpsert.push(startupData);
                }

                // Batch upsert
                if (pageStartupsToUpsert.length > 0) {
                    const { data: upsertedStartups, error: upsertError } = await supabase
                        .from("startups")
                        .upsert(pageStartupsToUpsert, { onConflict: "slug" })
                        .select("id, slug");

                    if (!upsertError && upsertedStartups) {
                        const idMap = new Map(upsertedStartups.map((s: any) => [s.slug, s.id]));
                        const snapshotsToUpsert: any[] = [];
                        const scoresToUpsert: any[] = [];
                        const todaySnapDate = new Date().toISOString().split("T")[0];

                        for (const item of trustStartups) {
                            const sid = idMap.get(item.slug);
                            if (!sid) continue;

                            const m = item.revenue?.mrr || item.revenue?.last30Days || 0;
                            snapshotsToUpsert.push({
                                startup_id: sid,
                                snapshot_date: todaySnapDate,
                                mrr: m, arr: m * 12, all_time_revenue: item.revenue?.total || 0,
                                growth_rate: item.growthMRR30d || 0, customer_count: item.customers || 0
                            });

                            const healthResult = calculateHealthScore({
                                mrr: m, arr: m * 12, allTimeRevenue: item.revenue?.total || 0,
                                last30DaysRevenue: item.revenue?.last30Days || 0,
                                momGrowthRate: item.growthMRR30d || 0, churnRate: 0, refundRate: 0,
                                customerCount: item.customers, volatilityScore: 0, revenueByMonth: []
                            });

                            scoresToUpsert.push({
                                startup_id: sid,
                                score: healthResult.score,
                                breakdown: healthResult.breakdown,
                                risk_level: healthResult.riskLevel
                            });
                        }

                        if (snapshotsToUpsert.length > 0) {
                            await supabase.from("revenue_snapshots").upsert(snapshotsToUpsert, { onConflict: "startup_id,snapshot_date" });
                        }
                        if (scoresToUpsert.length > 0) {
                            await supabase.from("health_scores").upsert(scoresToUpsert, { onConflict: "startup_id" });
                        }
                    }
                }

                slugs.forEach(s => processedSlugs.add(s));
                hasMore = data.meta?.hasMore === true;
                page++;
                if (hasMore) await new Promise(r => setTimeout(r, 2000));
            }

            return { imported, updated, skipped };
        } catch (error: any) {
            console.error("Import failed:", error);
            return { error: error.message };
        }
    }

    static async enrichStartup(slug: string) {
        if (!this.API_KEY) return { error: "TRUSTMRR_API_KEY is not set" };

        const supabase = createAdminClient();
        try {
            const response = await fetch(`${this.BASE_URL}/startups/${slug}`, {
                headers: { "Authorization": `Bearer ${this.API_KEY}`, "Accept": "application/json" }
            });

            if (!response.ok) return { error: `API error: ${response.status}` };

            const json = await response.json();
            const item = json.data;
            if (!item) return { error: "No data found for slug" };

            const techItems = (item.techStack || []).map((t: any) => {
                let val = "";
                let category = "";
                if (typeof t === 'string') {
                    val = t;
                } else if (t && typeof t === 'object') {
                    val = t.slug || t.name || t.label || t.value || "";
                    category = t.category || "";
                }
                if (!val || val === "[object Object]") return null;
                const lower = val.toLowerCase();
                let name = val;
                if (lower === "reactjs") name = "React";
                else if (lower === "nextjs") name = "Next.js";
                else if (lower === "nodejs") name = "Node.js";
                else name = val.charAt(0).toUpperCase() + val.slice(1);
                return { name, category };
            }).filter(Boolean);

            const mrr = item.revenue?.mrr || item.revenue?.last30Days || 0;
            const updateData = {
                description: item.description,
                website_url: item.website,
                category: item.category,
                country: item.country,
                founded_date: item.foundedDate,
                x_handle: item.xHandle,
                monthly_revenue: mrr,
                growth_rate: item.growthMRR30d || 0,
                customer_count: item.customers || 0,
                revenue_30d: item.revenue?.last30Days || 0,
                tags: techItems.map((i: any) => i.name),
                insights: {
                    tech_stack: techItems.map((i: any) => i.name),
                    frontend_stack: techItems.filter((i: any) => i.category === 'frontend').map((i: any) => i.name),
                    backend_stack: techItems.filter((i: any) => i.category === 'backend').map((i: any) => i.name),
                    visitors_30d: item.visitorsLast30Days || 0,
                    revenue_ranking: item.rank || 0,
                    social: { xFollowers: item.xFollowerCount || 0, xHandle: item.xHandle },
                    problem_solved: item.description,
                    value_proposition: item.description,
                    business_model: item.category || "Software/SaaS"
                }
            };

            const { data: updated, error: updateError } = await supabase.from("startups").update(updateData).eq("slug", slug).select("id").maybeSingle();
            if (updateError) return { error: updateError.message };

            if (updated?.id) {
                const healthResult = calculateHealthScore({
                    mrr: updateData.monthly_revenue,
                    arr: updateData.monthly_revenue * 12,
                    allTimeRevenue: updateData.revenue_30d * 6, // Estimate if total missing
                    last30DaysRevenue: updateData.revenue_30d,
                    momGrowthRate: updateData.growth_rate,
                    churnRate: 0,
                    refundRate: 0,
                    customerCount: updateData.customer_count,
                    volatilityScore: 0,
                    revenueByMonth: []
                });

                await supabase.from("health_scores").upsert({
                    startup_id: updated.id,
                    score: healthResult.score,
                    risk_level: healthResult.riskLevel,
                    ai_summary: healthResult.aiSummary,
                }, { onConflict: "startup_id" });
            }

            return { success: true, data: updateData };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}
