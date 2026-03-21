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

        const { startupId, currency: requestedCurrency = "usd" } = await req.json();
        console.log(`[Stripe Checkout] Requested currency: ${requestedCurrency} for startup: ${startupId}`);

        if (!startupId) {
            return NextResponse.json({ error: "Startup ID is required" }, { status: 400 });
        }

        // Pricing logic: Match frontend detection
        const currency = (requestedCurrency as string).toLowerCase();
        let unitAmount = 100; // Default $1.00 (100 cents)
        let stripeCurrency = "usd";

        if (currency === "inr") {
            unitAmount = 10000; // ₹100.00 (10000 paise)
            stripeCurrency = "inr";
        } else if (currency === "cad") {
            unitAmount = 140; // $1.40 CAD
            stripeCurrency = "cad";
        } else if (currency === "eur") {
            unitAmount = 95; // €0.95
            stripeCurrency = "eur";
        } else if (currency === "gbp") {
            unitAmount = 80; // £0.80
            stripeCurrency = "gbp";
        }

        // Verify ownership
        const { data: startup, error } = await supabase
            .from("startups")
            .select("id, name, listing_paid")
            .eq("id", startupId)
            .eq("owner_id", user.id)
            .single();

        if (error || !startup) {
            return NextResponse.json({ error: "Startup not found or you do not have permission to list it" }, { status: 404 });
        }

        const startupData = startup as any;

        if (startupData.listing_paid) {
            return NextResponse.json({ error: "Listing fee already paid for this startup" }, { status: 400 });
        }

        const stripe = getStripe();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            billing_address_collection: "required",
            customer_email: user.email ?? undefined,
            line_items: [
                {
                    price_data: {
                        currency: stripeCurrency,
                        product_data: {
                            name: `ProvenMRR Listing Fee`,
                            description: `List "${startupData.name}" in the marketplace for sale. Priority placement for 30 days.`,
                            images: [],
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${appUrl}/startup/${startupId}?payment=success&id=${startupId}`,
            cancel_url: `${appUrl}/dashboard/startups?id=${startupId}`,
            metadata: {
                startupId: startupId,
                type: "listing_fee",
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("[Stripe Checkout Error]:", err);
        return NextResponse.json({ error: err.message || "A processing error occurred" }, { status: 500 });
    }
}
