import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    return new Stripe(key, {
        apiVersion: "2025-01-27.acacia" as any,
    });
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { startupId } = await req.json();

        if (!startupId) {
            return NextResponse.json({ error: "Startup ID is required" }, { status: 400 });
        }

        // Verify ownership
        const { data: startup, error } = await supabase
            .from("startups")
            .select("id, name, listing_paid")
            .eq("id", startupId)
            .eq("owner_id", user.id)
            .single();

        if (error || !startup) {
            return NextResponse.json({ error: "Startup not found or unauthorized" }, { status: 404 });
        }

        const startupData = startup as any;

        if (startupData.listing_paid) {
            return NextResponse.json({ error: "Listing fee already paid for this startup" }, { status: 400 });
        }

        const stripe = getStripe();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `ProvenMRR Listing Fee`,
                            description: `List "${startupData.name}" in the marketplace for sale. Priority placement for 30 days.`,
                            images: [],
                        },
                        unit_amount: 50, // $0.50
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${appUrl}/dashboard/startups?id=${startupId}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/dashboard/startups?id=${startupId}&payment=cancel`,
            customer_email: user.email,
            metadata: {
                startup_id: startupId,
                user_id: user.id,
                type: "listing_fee",
            },
        });

        return NextResponse.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
        console.error("[Stripe Checkout Error]:", err?.message, err?.code, err?.type);
        return NextResponse.json({
            error: err.message,
            code: err?.code,
            type: err?.type,
        }, { status: 500 });
    }
}
