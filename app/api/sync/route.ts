import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchProviderData } from "@/lib/revenue/fetchers";
import { decryptApiKey } from "@/lib/crypto";

export async function GET(req: Request) {
    try {
        const adminSupabase = createAdminClient();
        const url = new URL(req.url);
        const forceId = url.searchParams.get("id");

        let query = adminSupabase.from("stripe_connections").select("encrypted_api_key, provider, startup_id");
        if (forceId) {
            query = query.eq("startup_id", forceId);
        }

        const { data: conns } = await query;
        if (!conns || conns.length === 0) return NextResponse.json({ error: "No connections found" });

        let syncedCount = 0;

        for (const conn of conns) {
            try {
                const apiKey = decryptApiKey(conn.encrypted_api_key);
                const providerData = await fetchProviderData(conn.provider as any, apiKey);

                if (providerData.metadata.country) {
                    await adminSupabase.from("startups").update({ country: providerData.metadata.country }).eq("id", conn.startup_id);
                }

                const metrics = providerData.metrics;
                await adminSupabase.from("revenue_snapshots").delete().eq("startup_id", conn.startup_id);

                const snapshotsData = metrics.revenueByMonth.map((point, index) => {
                    const isCurrentMonth = index === metrics.revenueByMonth.length - 1;
                    return {
                        startup_id: conn.startup_id,
                        mrr: isCurrentMonth ? metrics.mrr : 0,
                        arr: isCurrentMonth ? metrics.arr : 0,
                        all_time_revenue: isCurrentMonth ? metrics.allTimeRevenue : point.revenue,
                        churn_rate: isCurrentMonth ? metrics.churnRate : 0,
                        growth_rate: isCurrentMonth ? metrics.momGrowthRate : 0,
                        volatility_score: isCurrentMonth ? metrics.volatilityScore : 0,
                        customer_count: isCurrentMonth ? metrics.customerCount : 0,
                        refund_rate: isCurrentMonth ? metrics.refundRate : 0,
                        snapshot_date: point.date || new Date().toISOString().split("T")[0],
                    };
                });

                await adminSupabase.from("revenue_snapshots").insert(snapshotsData);
                syncedCount++;
            } catch (err: any) {
                console.error(`Failed to sync ${conn.startup_id}:`, err);
            }
        }

        return NextResponse.json({ success: true, syncedCount });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
