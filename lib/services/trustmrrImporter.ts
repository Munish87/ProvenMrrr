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

    static async importStartups() {
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

        try {
            while (hasMore) {
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

                for (const item of trustStartups) {
                    // Duplicate check by slug
                    const { data: existing } = await supabase
                        .from("startups")
                        .select("id, insights, tags")
                        .eq("slug", item.slug)
                        .maybeSingle();

                    // Detection of anonymous startups
                    const nameLower = item.name.toLowerCase();
                    const isAnonymous = nameLower.includes("anonymous") || nameLower === "saas" || nameLower === "stealth";

                    // Optional: Fetch details if missing tech stack/visitors
                    let detailData: Partial<TrustMRRStartup> = {};
                    const currentInsights = (existing?.insights as any) || {};
                    const hasInsights = existing && 
                        Object.keys(currentInsights).length > 2 && 
                        (currentInsights.visitors_30d > 0 || (existing.tags && existing.tags.length > 0) || (currentInsights.tech_stack && currentInsights.tech_stack.length > 0));

                    if (!isAnonymous && !processedSlugs.has(item.slug) && !hasInsights) {
                         try {
                            const detailRes = await fetch(`${this.BASE_URL}/startups/${item.slug}`, {
                                headers: { "Authorization": `Bearer ${this.API_KEY}`, "Accept": "application/json" }
                            });
                            if (detailRes.ok) {
                                const detailJson = await detailRes.json();
                                const d = detailJson.data || {};
                                detailData = {
                                    techStack: (d.techStack || item.techStack || []).map((t: string) => {
                                        const lower = t.toLowerCase();
                                        if (lower === "reactjs") return "React";
                                        if (lower === "nextjs") return "Next.js";
                                        if (lower === "nodejs") return "Node.js";
                                        if (lower === "postgresql" || lower === "postgres") return "PostgreSQL";
                                        if (lower === "mongodb") return "MongoDB";
                                        if (lower === "supabase") return "Supabase";
                                        if (lower === "firebase") return "Firebase";
                                        if (lower === "aws") return "AWS";
                                        if (lower === "stripe") return "Stripe";
                                        return t.charAt(0).toUpperCase() + t.slice(1);
                                    }),
                                    visitorsLast30Days: d.visitorsLast30Days || 0,
                                    description: d.description || item.description,
                                    ranking: d.revenueRanking || 0,
                                    socialMetrics: {
                                         xFollowers: d.socialMetrics?.xFollowers || 0,
                                         gscImpressions: d.gscData?.impressions || 0,
                                         xHandle: d.socialMetrics?.xHandle || item.xHandle
                                    },
                                    monthlyRevenue: d.monthlyRevenue || 0,
                                    revenueLast30Days: d.revenueLast30Days || 0,
                                    revenueTotal: d.revenueTotal || 0,
                                    growthRate: d.growthRate || 0,
                                    customerCount: d.customerCount || 0
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
                    
                    // Fallback: If mrr is 0 but revenueLast30Days is populated, use revenueLast30Days
                    const mrr = monthlyRevFromApi > 0 ? monthlyRevFromApi : revenue30d;
                    const growth = detailData.growthRate || item.growthMRR30d || 0;
                    const customers = detailData.customerCount || item.customers || 0;
                    const allTimeRevenue = detailData.revenueTotal || item.revenue?.total || 0;
                    const arr = mrr * 12;

                    // Calculate Health Score
                    const healthResult = calculateHealthScore({
                        mrr,
                        arr,
                        allTimeRevenue,
                        last30DaysRevenue: revenue30d,
                        momGrowthRate: growth,
                        churnRate: 0,
                        refundRate: 0,
                        customerCount: customers,
                        volatilityScore: 0,
                        revenueByMonth: []
                    });

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
                        asking_price: null, // Only ProvenMRR-listed startups should show price
                        is_listed_for_sale: false, // Only ProvenMRR-listed startups should be on sale
                        is_verified: true,
                        verified: true,
                        is_anonymous: isAnonymous,
                        tags: detailData.techStack || [],
                        insights: {
                            tech_stack: detailData.techStack || [],
                            visitors_30d: detailData.visitorsLast30Days || 0,
                            revenue_ranking: detailData.ranking || 0,
                            social: detailData.socialMetrics || {},
                            problem_solved: detailData.description || item.description,
                            value_proposition: item.description,
                            business_model: item.category || "Software/SaaS"
                        }
                    };

                    let startupId: string;

                    if (existing) {
                        // When updating, we EXCLUDE is_listed_for_sale and asking_price 
                        // so that local ProvenMRR listings aren't overwritten by the TrustMRR sync.
                        const { is_listed_for_sale, asking_price, ...updateData } = startupData;
                        
                        const { error: updateError } = await supabase
                            .from("startups")
                            .update(updateData)
                            .eq("id", existing.id);

                        if (updateError) {
                            console.error(`Error updating ${item.slug}:`, updateError);
                            skipped++;
                            continue;
                        }
                        startupId = existing.id;
                        updated++;
                    } else {
                        const { data: newItem, error: insertError } = await supabase
                            .from("startups")
                            .insert(startupData)
                            .select("id")
                            .single();

                        if (insertError) {
                            console.error(`Error inserting ${item.slug}:`, insertError);
                            skipped++;
                            continue;
                        }
                        startupId = newItem.id;
                        imported++;
                    }

                    // REVENUE SYNTHESIS: Create a trajectory if we have growth
                    const today = new Date().toISOString().split("T")[0];
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

                    // Snapshot 1: Current
                    const snapshotsToInsert = [];
                    snapshotsToInsert.push({
                        startup_id: startupId,
                        mrr: mrr,
                        arr: mrr > 0 ? mrr * 12 : revenue30d * 12,
                        growth_rate: growth,
                        customer_count: customers,
                        all_time_revenue: allTimeRevenue,
                        snapshot_date: today
                    });

                    // Synthesize 5 months of past history (total 6 months)
                    let currentMrr = mrr;
                    let currentCustomers = customers;
                    let currentAllTime = allTimeRevenue;
                    const growthMultiplier = growth !== 0 ? (1 + (growth / 100)) : 1;

                    for (let i = 1; i <= 5; i++) {
                        const pastDate = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                        currentMrr = growth !== 0 ? currentMrr / growthMultiplier : currentMrr;
                        currentCustomers = Math.max(0, currentCustomers - 1);
                        currentAllTime = Math.max(0, currentAllTime - revenue30d);
                        
                        snapshotsToInsert.push({
                            startup_id: startupId,
                            mrr: parseFloat(currentMrr.toFixed(2)),
                            arr: parseFloat((currentMrr * 12).toFixed(2)),
                            growth_rate: 0,
                            customer_count: currentCustomers,
                            all_time_revenue: currentAllTime,
                            snapshot_date: pastDate
                        });
                    }

                    // Upsert all snapshots
                    for (const snap of snapshotsToInsert) {
                        const { data: exSnap } = await supabase.from("revenue_snapshots").select("id").eq("startup_id", startupId).eq("snapshot_date", snap.snapshot_date).maybeSingle();
                        if (exSnap) {
                            await supabase.from("revenue_snapshots").update(snap).eq("id", exSnap.id);
                        } else {
                            await supabase.from("revenue_snapshots").insert(snap);
                        }
                    }

                    // UPSERT HEALTH SCORE
                    try {
                        const { data: exHealth } = await supabase.from("health_scores").select("id").eq("startup_id", startupId).maybeSingle();
                        const healthData = {
                            startup_id: startupId,
                            score: healthResult.score,
                            risk_level: healthResult.riskLevel,
                            ai_summary: healthResult.aiSummary || ""
                        };
                        if (exHealth) {
                            const { error: upErr } = await supabase.from("health_scores").update(healthData).eq("id", exHealth.id);
                            if (upErr) console.error(`[HealthUpdateErr] ${item.slug}:`, upErr);
                        } else {
                            const { error: insErr } = await supabase.from("health_scores").insert(healthData);
                            if (insErr) console.error(`[HealthInsertErr] ${item.slug}:`, insErr);
                        }
                    } catch (err) {
                        console.error(`[HealthScoreUpsertFailed] ${item.slug}:`, err);
                    }

                    processedSlugs.add(item.slug);
                }

                hasMore = data.meta?.hasMore === true;
                page++;
                
                if (hasMore) {
                    // Small delay between pages
                    await new Promise(r => setTimeout(r, 2000));
                }
                
                if (page > 100) break;
            }

            return { imported, updated, skipped };

        } catch (error: any) {
            console.error("Import failed:", error);
            return { error: error.message };
        }
    }

    static async enrichStartup(slug: string) {
        if (!this.API_KEY) {
            console.error("TRUSTMRR_API_KEY is not set");
            return { error: "TRUSTMRR_API_KEY is not set" };
        }

        const supabase = createAdminClient();
        
        try {
            // 1. Fetch startup details from API
            const response = await fetch(`${this.BASE_URL}/startups/${slug}`, {
                headers: {
                    "Authorization": `Bearer ${this.API_KEY}`,
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                console.warn(`TrustMRR API error for ${slug}: ${response.status}`);
                return { error: `API error: ${response.status}` };
            }

            const json = await response.json();
            const item = json.data;
            if (!item) return { error: "No data found for slug" };

            // 2. Map data (using similar logic to importStartups)
            const techStack = (item.techStack || []).map((t: string) => {
                const lower = t.toLowerCase();
                if (lower === "reactjs") return "React";
                if (lower === "nextjs") return "Next.js";
                if (lower === "nodejs") return "Node.js";
                return t.charAt(0).toUpperCase() + t.slice(1);
            });

            const revenue30d = item.revenue?.last30Days || 0;
            const mrr = item.revenue?.mrr || revenue30d;
            const growth = item.growthMRR30d || 0;
            const customers = item.customers || 0;
            
            const insights = {
                tech_stack: techStack,
                visitors_30d: item.visitorsLast30Days || 0,
                revenue_ranking: item.rank || 0,
                social: {
                    xFollowers: item.xFollowerCount || 0,
                    xHandle: item.xHandle
                },
                problem_solved: item.description,
                value_proposition: item.description,
                business_model: item.category || "Software/SaaS"
            };

            const updateData = {
                description: item.description,
                website_url: item.website,
                category: item.category,
                country: item.country,
                founded_date: item.foundedDate,
                x_handle: item.xHandle,
                monthly_revenue: mrr,
                growth_rate: growth,
                customer_count: customers,
                revenue_30d: revenue30d,
                insights,
                tags: techStack
            };

            // 3. Update database
            const { error: updateError } = await supabase
                .from("startups")
                .update(updateData)
                .eq("slug", slug);

            if (updateError) {
                console.error(`Error updating insights for ${slug}:`, updateError);
                return { error: updateError.message };
            }

            console.log(`Successfully enriched startup: ${slug}`);
            return { success: true, data: updateData };

        } catch (error: any) {
            console.error(`Enrichment failed for ${slug}:`, error);
            return { error: error.message };
        }
    }
}
