import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchProviderData, type ProviderType } from "@/lib/revenue/fetchers";
import { calculateHealthScore } from "@/lib/health-score/calculator";
import { decryptApiKey } from "@/lib/crypto";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { startupId } = body as { startupId?: string };

        if (!startupId) {
            return NextResponse.json({ error: "startupId required" }, { status: 400 });
        }

        // Ownership check
        const { data: startup } = await supabase
            .from("startups")
            .select("id")
            .eq("id", startupId)
            .eq("owner_id", user.id)
            .single();

        if (!startup) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Retrieve encrypted key
        const { data: conn } = await adminSupabase
            .from("stripe_connections")
            .select("encrypted_api_key, provider")
            .eq("startup_id", startupId)
            .single();

        if (!conn) {
            return NextResponse.json(
                { error: "No revenue connection found. Please connect a provider first." },
                { status: 404 }
            );
        }

        const apiKey = decryptApiKey(conn.encrypted_api_key);
        const providerData = await fetchProviderData(conn.provider as ProviderType, apiKey);
        const metrics = providerData.metrics;
        const healthResult = calculateHealthScore(metrics);

        // Snapshot
        await adminSupabase.from("revenue_snapshots").insert({
            startup_id: startupId,
            mrr: metrics.mrr,
            arr: metrics.arr,
            churn_rate: metrics.churnRate,
            growth_rate: metrics.momGrowthRate,
            volatility_score: metrics.volatilityScore,
            customer_count: metrics.customerCount,
            refund_rate: metrics.refundRate,
            snapshot_date: new Date().toISOString().split("T")[0],
        });

        await adminSupabase.from("health_scores").insert({
            startup_id: startupId,
            score: healthResult.score,
            risk_level: healthResult.riskLevel,
            ai_summary: healthResult.aiSummary,
        });

        // Update last_synced_at
        await adminSupabase
            .from("stripe_connections")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("startup_id", startupId);

        return NextResponse.json({ success: true, score: healthResult.score });
    } catch (error) {
        console.error("[stripe/refresh]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
