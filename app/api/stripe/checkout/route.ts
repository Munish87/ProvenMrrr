import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV !== "production";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover" as any,
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
            .select("id, name")
            .eq("id", startupId)
            .eq("owner_id", user.id)
            .single();

        if (error || !startup) {
            return NextResponse.json({ error: "Startup not found or unauthorized" }, { status: 404 });
        }

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Listing Fee for ${startup.name}`,
                            description: "One-time payment to list your startup for sale on ProvenMRR.",
                        },
                        unit_amount: 10, // $0.10
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/startups?id=${startupId}&payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/startups?id=${startupId}&payment=cancel`,
            metadata: {
                startup_id: startupId,
                user_id: user.id,
            },
            customer_email: user.email,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        if (process.env.NODE_ENV !== "production") console.error("[Stripe Checkout Error]:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
