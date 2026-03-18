import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

const PRICES: Record<string, { unit_amount: number; name: string; days: number }> = {
    weekly: { unit_amount: 4900, name: "Vetra Ad Slot — Weekly", days: 7 },
    monthly: { unit_amount: 14900, name: "Vetra Ad Slot — Monthly", days: 30 },
};

export async function POST(req: Request) {
    try {
        const { advertiser_id, plan_type } = await req.json();

        if (!advertiser_id || !plan_type) {
            return NextResponse.json({ error: "advertiser_id and plan_type are required." }, { status: 400 });
        }

        const price = PRICES[plan_type as string];
        if (!price) {
            return NextResponse.json({ error: "Invalid plan_type. Use 'weekly' or 'monthly'." }, { status: 400 });
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: price.unit_amount,
                        product_data: {
                            name: price.name,
                            description: `Your sponsor ad will appear in rotation on Vetra for ${price.days} days.`,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                advertiser_id,
                plan_type,
                expires_days: String(price.days),
            },
            success_url: `${origin}/?ad_success=1`,
            cancel_url: `${origin}/?ad_cancel=1`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error("[ad-checkout]", err);
        return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
    }
}
