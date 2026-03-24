import { NextResponse } from "next/server";
import { syncStripeMetrics } from "@/lib/services/metrics";
import { createAdminClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const results: any[] = [];

    try {
        console.log("Starting hourly native Stripe metrics sync...");
        const { data: connections, error: connError } = await adminSupabase
            .from("revenue_connections")
            .select("startup_id, provider, encrypted_api_key, id")
            .eq("is_active", true);

        if (connError) {
            console.error("Failed to fetch native connections:", connError);
            return NextResponse.json({ error: "Failed to fetch native connections" }, { status: 500 });
        } else if (connections) {
            for (const conn of connections) {
                console.log(`Updating Native Stripe for startup: ${conn.startup_id}`);
                const res = await syncStripeMetrics(conn.startup_id, conn);
                results.push({ service: `Stripe-Startup-${conn.startup_id}`, success: res.success });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error("Hourly Stripe sync failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
