import { NextResponse } from "next/server";
import { TrustMRRImporter } from "@/lib/services/trustmrrImporter";
import { syncStripeMetrics } from "@/lib/services/metrics";
import { createAdminClient } from "@/lib/supabase/server";

export const maxDuration = 60; // Max allowed for Vercel Hobby tier

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Secure endpoint check
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const results: any[] = [];

    try {
        console.log("Starting hourly comprehensive sync...");

        // 1. TrustMRR Sync (Fast mode: MRR/Growth only)
        console.log("Syncing TrustMRR metrics...");
        const trustResult = await TrustMRRImporter.importStartups(false, true);
        results.push({ service: "TrustMRR", result: trustResult });

        // 2. Native Stripe Connections Sync
        console.log("Syncing native Stripe metric...");
        const { data: connections, error: connError } = await adminSupabase
            .from("revenue_connections")
            .select("startup_id, provider, encrypted_api_key, id")
            .eq("is_active", true);

        if (connError) {
            console.error("Failed to fetch native connections:", connError);
        } else if (connections) {
            for (const conn of connections) {
                console.log(`Updating Native Stripe for startup: ${conn.startup_id}`);
                const res = await syncStripeMetrics(conn.startup_id, conn);
                results.push({ service: `Stripe-Startup-${conn.startup_id}`, success: res.success });
            }
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (e: any) {
        console.error("Hourly sync failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
