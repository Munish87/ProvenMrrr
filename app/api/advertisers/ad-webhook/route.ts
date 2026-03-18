import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_AD_WEBHOOK_SECRET ?? process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_AD_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        console.error("[ad-webhook] Missing signature or secret");
        return NextResponse.json({ error: "Not configured" }, { status: 400 });
    }

    const rawBody = await request.text();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
        console.error("[ad-webhook] Invalid signature:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const { advertiser_id, plan_type, expires_days } = session.metadata ?? {};

        if (!advertiser_id) {
            console.warn("[ad-webhook] No advertiser_id in metadata — ignored");
            return NextResponse.json({ received: true });
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Number(expires_days ?? 7));

        const admin = getAdminClient();
        const { error } = await admin
            .from("advertisers")
            .update({
                status: "active",
                plan_type: plan_type ?? "weekly",
                stripe_session_id: session.id,
                expires_at: expiresAt.toISOString(),
            })
            .eq("id", advertiser_id);

        if (error) {
            console.error("[ad-webhook] DB update failed:", error.message);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }

        console.log(`[ad-webhook] Advertiser ${advertiser_id} activated (${plan_type}, expires ${expiresAt.toDateString()})`);
    }

    return NextResponse.json({ received: true });
}
