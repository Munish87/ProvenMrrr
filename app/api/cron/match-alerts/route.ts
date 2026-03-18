import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: Request) {
    try {
        // Enforce authorization via trigger key if hosted on Vercel
        const authHeader = req.headers.get("Authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const supabase = createAdminClient();

        // 1. Fetch all buyer preferences
        const { data: preferences, error: prefError } = await supabase
            .from("buyer_preferences")
            .select("*, users(email)");

        if (prefError || !preferences) {
            if (isDev) console.error("Failed to fetch preferences:", prefError);
            return NextResponse.json({ error: "Failed to fetch buyer preferences" }, { status: 500 });
        }

        // 2. Fetch recently listed startups (e.g. within last 24 hours). 
        // For testing/mocking, fetching top 50 listed for sale.
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentStartups, error: startupError } = await supabase
            .from("startups")
            .select("*, revenue_snapshots(*)")
            .eq("is_listed_for_sale", true)
            .gte("created_at", twentyFourHoursAgo);

        if (startupError || !recentStartups) {
            if (isDev) console.error("Failed to fetch recent startups:", startupError);
            return NextResponse.json({ error: "Failed to fetch startups" }, { status: 500 });
        }

        if (recentStartups.length === 0) {
            return NextResponse.json({ message: "No new startups to match today." });
        }

        let emailsSent = 0;

        // 3. Match logic (simplified version of getMatchedStartups)
        for (const pref of preferences) {
            const matchedForUser = recentStartups.filter(startup => {
                let isMatch = true;

                // Budget Math
                if (pref.min_budget || pref.max_budget) {
                    const price = startup.asking_price || 0;
                    if (price <= 0 || (pref.min_budget && price < pref.min_budget) || (pref.max_budget && price > pref.max_budget)) {
                        isMatch = false;
                    }
                }

                // Category Match
                if (isMatch && pref.categories && pref.categories.length > 0) {
                    if (!startup.category || !pref.categories.includes(startup.category)) {
                        isMatch = false;
                    }
                }

                return isMatch;
            });

            if (matchedForUser.length > 0 && pref.users && pref.users.email) {
                // TODO: Integrate an email service like Resend here
                // await resend.emails.send({...})
                if (isDev) console.log(`[MAIL MOCK] Sending Match Alert to ${pref.users.email}. Found ${matchedForUser.length} new matches.`);
                emailsSent++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${preferences.length} buyers against ${recentStartups.length} new startups. Sent ${emailsSent} alerts.`,
        });

    } catch (err) {
        if (isDev) console.error("Match alerts error:", err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
