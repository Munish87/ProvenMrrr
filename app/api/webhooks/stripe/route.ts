import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { computeMetrics } from "@/lib/stripe/metrics";
import { calculateHealthScore } from "@/lib/health-score/calculator";
import { decryptApiKey } from "@/lib/crypto";

// IMPORTANT: Raw body needed for signature verification
export const runtime = "nodejs";

// Use plain untyped admin client for webhook (bypasses RLS type constraints)
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    }

    let event: Stripe.Event;
    const rawBody = await request.text();

    try {
        const stripe = new Stripe(webhookSecret, {
            apiVersion: "2026-02-25.clover",
        });
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error("[webhook] Invalid signature:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const admin = getAdminClient();

    switch (event.type) {
        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            const { data: connections } = await admin
                .from("stripe_connections")
                .select("startup_id, encrypted_api_key");

            if (connections) {
                for (const conn of connections as { startup_id: string; encrypted_api_key: string }[]) {
                    try {
                        const apiKey = decryptApiKey(conn.encrypted_api_key);
                        const stripe = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" });

                        let subs: Stripe.Subscription[] = [];
                        let charges: Stripe.Charge[] = [];

                        try {
                            subs = await stripe.subscriptions.list({ limit: 100, status: "all", expand: ["data.items"] }).autoPagingToArray({ limit: 1000 });
                        } catch (err: any) {
                            console.warn(`[webhook] Skipping subscriptions fetch for ${conn.startup_id}:`, err.message);
                        }

                        try {
                            charges = await stripe.charges.list({ limit: 100 }).autoPagingToArray({ limit: 2000 });
                        } catch (err: any) {
                            console.warn(`[webhook] Skipping charges fetch for ${conn.startup_id}:`, err.message);
                        }

                        if (subs.length === 0 && charges.length === 0) {
                            try {
                                await stripe.products.list({ limit: 1 });
                            } catch {
                                break; // The API key is defunct entirely, so skip this iteration.
                            }
                        }

                        let name = "Stripe Startup";
                        let logo: string | null = null;
                        let founded_date: string | null = null;

                        try {
                            const account = await stripe.accounts.retrieve();
                            if (account.created) {
                                founded_date = new Date(account.created * 1000).toISOString();
                            }
                            if (account.business_profile?.name) {
                                name = account.business_profile.name;
                            } else if (account.settings?.dashboard?.display_name) {
                                name = account.settings.dashboard.display_name;
                            }
                        } catch {
                            if (subs.length > 0 || charges.length > 0) {
                                try {
                                    const products = (await stripe.products.list({ limit: 10, active: true })).data;
                                    if (products.length > 0) {
                                        name = products[0].name;
                                        logo = products[0].images?.[0] || null;
                                    }
                                } catch {
                                    // Skip fetching metadata on webhook edge cases missing product privileges
                                }
                            }
                        }

                        const metrics = computeMetrics({
                            subscriptions: subs,
                            charges,
                            name,
                            logo,
                            founded_date,
                        });
                        const healthResult = calculateHealthScore(metrics);

                        await admin.from("revenue_snapshots").insert({
                            startup_id: conn.startup_id,
                            mrr: metrics.mrr,
                            arr: metrics.arr,
                            all_time_revenue: metrics.allTimeRevenue,
                            churn_rate: metrics.churnRate,
                            growth_rate: metrics.momGrowthRate,
                            volatility_score: metrics.volatilityScore,
                            customer_count: metrics.customerCount,
                            refund_rate: metrics.refundRate,
                            snapshot_date: new Date().toISOString().split("T")[0],
                        });

                        await admin.from("health_scores").insert({
                            startup_id: conn.startup_id,
                            score: healthResult.score,
                            risk_level: healthResult.riskLevel,
                            ai_summary: healthResult.aiSummary,
                        });

                        break;
                    } catch {
                        // Key doesn't match this customer; continue
                    }
                }
            }
            break;
        }

        case "customer.subscription.deleted": {
            console.log("[webhook] Subscription deleted:", event.data.object.id);
            break;
        }

        default:
            console.log(`[webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
