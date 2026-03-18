import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchProviderData, type ProviderType } from "@/lib/revenue/fetchers";
import { calculateHealthScore } from "@/lib/health-score/calculator";
import { decryptApiKey } from "@/lib/crypto";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { startupId } = await request.json() as { startupId?: string };
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

        const { data: conn } = await adminSupabase
            .from("stripe_connections")
            .select("encrypted_api_key, provider")
            .eq("startup_id", startupId)
            .single();

        if (!conn) {
            return NextResponse.json({ error: "No revenue connection" }, { status: 404 });
        }

        const apiKey = decryptApiKey(conn.encrypted_api_key);
        const providerData = await fetchProviderData(conn.provider as ProviderType, apiKey);
        const metrics = providerData.metrics;
        const healthResult = calculateHealthScore(metrics);

        const { data: newScore, error } = await adminSupabase
            .from("health_scores")
            .insert({
                startup_id: startupId,
                score: healthResult.score,
                risk_level: healthResult.riskLevel,
                ai_summary: healthResult.aiSummary,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            score: newScore.score,
            riskLevel: newScore.risk_level,
            aiSummary: newScore.ai_summary,
            breakdown: healthResult.breakdown,
        });
    } catch (error) {
        console.error("[health-score/recalculate]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
