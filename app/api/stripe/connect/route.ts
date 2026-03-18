import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { fetchStripeData } from "@/lib/stripe/fetcher";
import { computeMetrics } from "@/lib/stripe/metrics";
import { calculateHealthScore } from "@/lib/health-score/calculator";
import { encryptApiKey } from "@/lib/crypto";
import Stripe from "stripe";

const isDev = process.env.NODE_ENV !== "production";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminSupabase = createAdminClient();

        // ── Auth check ────────────────────────────────────────────────────────────
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Validate body ─────────────────────────────────────────────────────────
        const body = await request.json();
        const { startupId, apiKey } = body as {
            startupId?: string;
            apiKey?: string;
        };

        if (!startupId || !apiKey) {
            return NextResponse.json(
                { error: "startupId and apiKey are required" },
                { status: 400 }
            );
        }

        // Basic format check — Stripe restricted keys start with rk_
        if (!apiKey.startsWith("rk_") && !apiKey.startsWith("sk_")) {
            return NextResponse.json(
                {
                    error:
                        "Invalid Stripe key format. Use a Restricted Key (rk_...) for security.",
                },
                { status: 400 }
            );
        }

        // ── Ownership check ───────────────────────────────────────────────────────
        const { data: startup, error: startupError } = await supabase
            .from("startups")
            .select("id, owner_id")
            .eq("id", startupId)
            .eq("owner_id", user.id)
            .single();

        if (startupError || !startup) {
            return NextResponse.json(
                { error: "Startup not found or access denied" },
                { status: 403 }
            );
        }

        // ── Validate Stripe key + fetch data ──────────────────────────────────────
        let rawData;
        try {
            rawData = await fetchStripeData(apiKey);
        } catch (err: unknown) {
            const stripeErr = err as { type?: string; message?: string };
            if (stripeErr.type === "StripeAuthenticationError") {
                return NextResponse.json(
                    { error: "Invalid Stripe API key" },
                    { status: 400 }
                );
            }
            throw err;
        }

        // ── Compute metrics ───────────────────────────────────────────────────────
        const metrics = computeMetrics(rawData);
        const healthResult = calculateHealthScore(metrics);

        // ── Retrieve Stripe account ID for webhook filtering ──────────────────────
        let stripeAccountId: string | null = null;
        try {
            const stripe = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as any });
            const account = await stripe.accounts.retrieve();
            stripeAccountId = account.id ?? null;
        } catch {
            // Non-fatal: account ID just won't be stored
        }

        // ── Encrypt and store Stripe key (upsert) ─────────────────────────────────
        const encryptedKey = encryptApiKey(apiKey);

        const { error: connError } = await adminSupabase
            .from("stripe_connections")
            .upsert(
                {
                    startup_id: startupId,
                    encrypted_api_key: encryptedKey,
                    last_synced_at: new Date().toISOString(),
                    ...(stripeAccountId ? { stripe_account_id: stripeAccountId } : {}),
                },
                { onConflict: "startup_id" }
            );

        if (connError) throw connError;

        // ── Store revenue snapshot ────────────────────────────────────────────────
        const { error: snapshotError } = await adminSupabase
            .from("revenue_snapshots")
            .insert({
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

        if (snapshotError) throw snapshotError;

        // ── Store health score ────────────────────────────────────────────────────
        const { error: healthError } = await adminSupabase
            .from("health_scores")
            .insert({
                startup_id: startupId,
                score: healthResult.score,
                risk_level: healthResult.riskLevel,
                ai_summary: healthResult.aiSummary,
            });

        if (healthError) throw healthError;

        // ── Mark startup as verified ──────────────────────────────────────────────
        await adminSupabase
            .from("startups")
            .update({ is_verified: true })
            .eq("id", startupId);

        // ── Return sanitized summary (never return the raw key) ───────────────────
        return NextResponse.json({
            success: true,
            metrics: {
                mrr: metrics.mrr,
                arr: metrics.arr,
                momGrowthRate: metrics.momGrowthRate,
                churnRate: metrics.churnRate,
                customerCount: metrics.customerCount,
                revenueByMonth: metrics.revenueByMonth,
            },
            healthScore: {
                score: healthResult.score,
                riskLevel: healthResult.riskLevel,
                breakdown: healthResult.breakdown,
                aiSummary: healthResult.aiSummary,
            },
        });
    } catch (error) {
        if (isDev) console.error("[stripe/connect] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
