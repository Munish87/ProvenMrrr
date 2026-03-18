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

const isDev = process.env.NODE_ENV !== "production";

export async function POST(request: NextRequest) {
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!signature || !webhookSecret) {
        return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    }

    // ── Use STRIPE_SECRET_KEY for the Stripe client (not the webhook secret) ──
    const stripe = new Stripe(stripeSecretKey!, {
        apiVersion: "2025-01-27.acacia" as any,
    });

    let event: Stripe.Event;
    const rawBody = await request.text();

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        if (isDev) console.error("[webhook] Invalid signature:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const admin = getAdminClient();

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const startupId = session.metadata?.startup_id;

            if (startupId && session.payment_status === "paid") {
                console.log(`[webhook] Listing fee paid for startup: ${startupId}`);
                const { error } = await admin
                    .from("startups")
                    .update({
                        listing_paid: true,
                        listing_paid_at: new Date().toISOString(),
                        stripe_session_id: session.id,
                        is_listed_for_sale: true,
                    })
                    .eq("id", startupId);

                if (error) {
                    console.error(`[webhook] Error updating startup ${startupId}:`, error.message);
                }
            }
            break;
        }

        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;

            // Get the Stripe account ID from the event (present in Connect events)
            const accountId: string | null = (event as any).account ?? null;

            // Fetch only the matching connection if we have an account ID,
            // otherwise fall back to syncing all — guarded by max 50 to cap blast radius.
            let query = admin
                .from("stripe_connections")
                .select("startup_id, encrypted_api_key, stripe_account_id");

            if (accountId) {
                query = query.eq("stripe_account_id", accountId) as any;
            } else {
                query = query.limit(50) as any;
            }

            const { data: connections, error: connError } = await query;

            if (connError || !connections || connections.length === 0) {
                if (isDev) console.warn("[webhook] No connections found for invoice.paid");
                return NextResponse.json({ received: true });
            }

            for (const connection of connections) {
                try {
                    const apiKey = decryptApiKey(connection.encrypted_api_key);
                    const connStripe = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" as any });

                    let subs: Stripe.Subscription[] = [];
                    let charges: Stripe.Charge[] = [];

                    try {
                        subs = await connStripe.subscriptions
                            .list({ limit: 100, status: "all", expand: ["data.items"] })
                            .autoPagingToArray({ limit: 1000 });
                    } catch (err: any) {
                        if (isDev) console.warn(`[webhook] Skipping subscriptions for ${connection.startup_id}:`, err.message);
                        continue;
                    }

                    try {
                        charges = await connStripe.charges
                            .list({ limit: 100 })
                            .autoPagingToArray({ limit: 2000 });
                    } catch (err: any) {
                        if (isDev) console.warn(`[webhook] Skipping charges for ${connection.startup_id}:`, err.message);
                    }

                    const metrics = computeMetrics({
                        subscriptions: subs,
                        charges,
                        name: "Syncing...",
                        logo: null,
                        founded_date: null,
                        country: null,
                        website_url: null,
                    });
                    const healthResult = calculateHealthScore(metrics as any);

                    // Upsert snapshot for today (prevents duplicate rows)
                    await admin.from("revenue_snapshots").upsert(
                        {
                            startup_id: connection.startup_id,
                            mrr: metrics.mrr,
                            arr: metrics.arr,
                            all_time_revenue: metrics.allTimeRevenue,
                            churn_rate: metrics.churnRate,
                            growth_rate: metrics.momGrowthRate,
                            volatility_score: metrics.volatilityScore,
                            customer_count: metrics.customerCount,
                            refund_rate: metrics.refundRate,
                            snapshot_date: new Date().toISOString().split("T")[0],
                        },
                        { onConflict: "startup_id,snapshot_date", ignoreDuplicates: false }
                    );

                    await admin.from("health_scores").insert({
                        startup_id: connection.startup_id,
                        score: healthResult.score,
                        risk_level: healthResult.riskLevel,
                        ai_summary: healthResult.aiSummary,
                    });
                } catch (err) {
                    if (isDev) console.error(`[webhook] Error processing sync for ${connection.startup_id}:`, err);
                }
            }
            break;
        }

        case "payment_intent.succeeded": {
            // Handled via checkout.session.completed for listing fees
            // Legacy support: only process if it has a startup_id metadata and listing_paid isn't set
            const pi = event.data.object as Stripe.PaymentIntent;
            const startupId = pi.metadata?.startup_id;

            if (startupId && pi.metadata?.type === "listing_fee") {
                console.log(`[webhook] PaymentIntent succeeded for startup: ${startupId}`);
                const { error } = await admin
                    .from("startups")
                    .update({
                        listing_paid: true,
                        listing_paid_at: new Date().toISOString(),
                        is_listed_for_sale: true,
                    })
                    .eq("id", startupId)
                    .eq("listing_paid", false);

                if (error) {
                    console.error(`[webhook] Error updating startup ${startupId}:`, error.message);
                }
            }
            break;
        }

        case "customer.subscription.deleted": {
            if (isDev) console.log("[webhook] Subscription deleted:", event.data.object.id);
            break;
        }

        default:
            console.log(`[webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
