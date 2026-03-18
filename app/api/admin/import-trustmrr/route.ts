import { NextResponse } from "next/server";
import { TrustMRRImporter } from "@/lib/services/trustmrrImporter";

export const maxDuration = 60; // Max allowed for Vercel Hobby

const isDev = process.env.NODE_ENV !== "production";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Secure endpoint with secret check
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (isDev) console.log("Starting manual TrustMRR import...");
        const result = await TrustMRRImporter.importStartups();

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            imported: result.imported,
            updated: result.updated,
            skipped: result.skipped
        });

    } catch (e: any) {
        console.error("Manual TrustMRR import failed:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
