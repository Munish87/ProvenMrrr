import { NextResponse } from "next/server";
import { TrustMRRImporter } from "@/lib/services/trustmrrImporter";

export const maxDuration = 60; // Max allowed for Vercel Hobby tier

export async function GET(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Secure endpoint check
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("Starting daily full TrustMRR sync...");
        // false for skipTimeout (respects 50s Vercel limit)
        // false for fastSync (so it fetches full details)
        const result = await TrustMRRImporter.importStartups(false, false);
        
        return NextResponse.json({
            success: true,
            result
        });
    } catch (e: any) {
        console.error("Daily TrustMRR sync failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
