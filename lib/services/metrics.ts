import { createAdminClient } from '../supabase/server';
import { decryptApiKey } from '../crypto';
import { fetchProviderData } from '../revenue/fetchers';

export async function syncStripeMetrics(startupId: string, conn: any) {
    const adminSupabase = createAdminClient();
    try {
        const apiKey = decryptApiKey(conn.encrypted_api_key);
        const providerData = await fetchProviderData(conn.provider as any, apiKey);
        const m = providerData.metrics;

        if (m && m.mrr !== undefined && m.mrr !== null) {
            // Update startup record
            await adminSupabase.from("startups").update({
                monthly_revenue: m.mrr,
                revenue_30d: m.last30DaysRevenue || m.mrr,
                growth_rate: m.momGrowthRate
            }).eq("id", startupId);

            // Upsert snapshot
            const todaySnapDate = new Date().toISOString().split("T")[0];
            const snapData = {
                startup_id: startupId,
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

            const { error: upsertError } = await adminSupabase.from("revenue_snapshots")
                .upsert(snapData, { onConflict: "startup_id,snapshot_date" });
            
            if (upsertError) {
                console.error(`Failed to upsert snapshot for ${startupId}:`, upsertError);
            }
        }
        return { success: true };
    } catch (e) {
        console.error(`Failed to sync metrics for startup ${startupId}:`, e);
        return { success: false, error: e };
    }
}
