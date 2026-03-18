import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover" as any,
    });
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
            .select("id, name")
            .eq("id", startupId)
            .eq("owner_id", user.id)
            .single();

        if (error || !startup) {
            return NextResponse.json({ error: "Startup not found or unauthorized" }, { status: 404 });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 50, // $0.50
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                startup_id: startupId,
                user_id: user.id,
                type: "listing_fee"
            },
            description: `Listing Fee for ${startup.name}`,
            receipt_email: user.email,
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err: any) {
        if (isDev) console.error("[Stripe PaymentIntent Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
