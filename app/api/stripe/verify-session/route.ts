import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

function getAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * GET /api/stripe/verify-session?session_id=cs_xxx&startup_id=yyy
 *
 * Called client-side when the user lands back on the success URL.
 * Verifies the Stripe session and, if paid, marks the startup as listed.
 * This is a webhook-independent fallback so payment is never lost.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const startupId = searchParams.get("startup_id");

    if (!sessionId || !startupId) {
        return NextResponse.json({ error: "Missing session_id or startup_id" }, { status: 400 });
    }

    // Authenticate the caller
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership before doing anything
    const { data: startup, error: ownershipError } = await supabase
        .from("startups")
        .select("id, listing_paid, owner_id")
        .eq("id", startupId)
        .eq("owner_id", user.id)
        .single();

    if (ownershipError || !startup) {
        return NextResponse.json({ error: "Startup not found or permission denied" }, { status: 404 });
    }

    // Already paid — nothing to do
    if ((startup as any).listing_paid) {
        return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // Retrieve the Stripe session and confirm it's actually paid
    const stripe = getStripe();
    let session: Stripe.Checkout.Session;
    try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err: any) {
        console.error("[verify-session] Failed to retrieve session:", err.message);
        return NextResponse.json({ error: "Could not retrieve Stripe session" }, { status: 502 });
    }

    if (session.payment_status !== "paid") {
        return NextResponse.json({ success: false, status: session.payment_status });
    }

    // Double-check the session belongs to this startup (metadata guard)
    const metaStartupId = session.metadata?.startup_id;
    if (metaStartupId && metaStartupId !== startupId) {
        console.error("[verify-session] startup_id mismatch", { metaStartupId, startupId });
        return NextResponse.json({ error: "Session/startup mismatch" }, { status: 400 });
    }

    // Mark as paid using the service-role client (bypasses RLS)
    const admin = getAdmin();
    const { error: updateError } = await admin
        .from("startups")
        .update({
            listing_paid: true,
            listing_paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
            is_listed_for_sale: true,
        })
        .eq("id", startupId);

    if (updateError) {
        console.error("[verify-session] DB update failed:", updateError.message);
        return NextResponse.json({ error: "Failed to activate listing" }, { status: 500 });
    }

    console.log(`[verify-session] Listing activated for startup ${startupId} via session ${sessionId}`);
    return NextResponse.json({ success: true, activated: true });
}
