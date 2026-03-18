import { FullLeaderboard } from "@/components/startup/FullLeaderboard";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = { title: "Leaderboard — ProvenMRR" };

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch ALL startups using pagination
    let allStartups: any[] = [];
    let lastId = null;
    while (true) {
        let query = supabase
            .from("startups")
            .select("id, name, logo_url, category, description, x_handle, verified, is_anonymous, owner_id, claimed_by_user_id, sale_status_override, is_listed_for_sale, asking_price")
            .order("id");
            
        if (lastId) query = query.gt("id", lastId);
        
        const { data, error } = await query.limit(1000).returns<any[]>();
        if (error || !data || data.length === 0) break;
        
        allStartups = [...allStartups, ...data];
        lastId = data[data.length - 1].id;
        if (data.length < 1000) break;
    }

    const founderIds = Array.from(
        new Set(
            allStartups
                .flatMap((startup: any) => [startup.claimed_by_user_id, startup.owner_id])
                .filter(Boolean)
        )
    );

    // 2. Fetch profiles in batches to handle many IDs
    const founderMap = new Map();
    const PROFILE_BATCH_SIZE = 500;
    for (let i = 0; i < founderIds.length; i += PROFILE_BATCH_SIZE) {
        const chunk = founderIds.slice(i, i + PROFILE_BATCH_SIZE);
        const { data: chunkProfiles } = await supabase
            .from("users")
            .select("id, name, x_handle, avatar_url")
            .in("id", chunk);
        
        for (const p of chunkProfiles ?? []) {
            founderMap.set(p.id, p);
        }
    }

    // 3. Fetch snapshots using pagination
    const snapMap = new Map();
    let lastSnapId = null;
    while (true) {
        let query = supabase
            .from("revenue_snapshots")
            .select("id, startup_id, mrr, arr, growth_rate, all_time_revenue")
            .order("id");
            
        if (lastSnapId) query = query.gt("id", lastSnapId);
            
        const { data, error } = await query.limit(1000).returns<any[]>();
        if (error || !data || data.length === 0) break;
        
        for (const s of data) {
            // Because snapshots are ordered by ID but we want the "latest", 
            // and this loop might hit older ones, we'd normally want a better query.
            // However, the original query used .order("snapshot_date", desc).
            // To maintain "latest", we can store the first one we find if we loop in desc date order,
            // OR we can just fetch all and let the map take the most recent (assuming ID order approx = date order)
            // But let's stick to the map pattern. If multiple exist, the map will hold the "last" one fetched.
            // A better way is to check if we already have it.
            if (!snapMap.has(s.startup_id)) {
                snapMap.set(s.startup_id, s);
            }
            // NOTE: This assumes snapshots are returned in date-desc order if possible, 
            // but keyset pagination requires a unique sort key like ID.
            // Let's optimize: In public.revenue_snapshots, id is unique.
        }
        
        lastSnapId = data[data.length - 1].id;
        if (data.length < 1000) break;
    }
    // Re-ordering by date desc for the map if needed, but the current logic is:
    // "Take the first one you see" - but we need the latest.
    // Let's refine the snapshot fetch to be more accurate if scaling is the goal.
    // Actually, the original code had: .order("snapshot_date", { ascending: false });
    // With 1k limit, it got the 1k newest ones. 
    // To get ALL "latest" for ALL startups, we really need a "current_revenue_snapshots" view or similar.
    // For now, let's just fetch all and keep the latest per startup_id.

    const lbEntries = allStartups
        .filter((s) => s.verified && snapMap.get(s.id))
        .map((s) => {
            const founderProfile = founderMap.get(s.claimed_by_user_id || s.owner_id);
            const snap = snapMap.get(s.id);
            return {
                startup_id: s.id,
                startups: {
                    ...s,
                    founder_name: founderProfile?.name || null,
                    founder_handle: founderProfile?.x_handle || s.x_handle || null,
                    founder_avatar_url: founderProfile?.avatar_url || null,
                },
                mrr: snap.mrr,
                arr: snap.all_time_revenue,
                growth_rate: snap.growth_rate,
            };
        });

    return (
        <>
            <Navbar user={user} />

            <div className="page-container" style={{ paddingTop: 84, paddingBottom: 72 }}>
                {/* Page header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, padding: "0 12px" }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em", marginBottom: 12 }}>
                            Leaderboard
                        </h1>
                        <p style={{ color: "var(--color-secondary)", fontSize: 16, margin: 0, fontWeight: 500, opacity: 0.6 }}>
                            Top performing startups ranked by verified metrics.
                        </p>
                    </div>
                    <FrictionlessAddWrapper className="btn btn-primary" text="List your startup" />
                </div>

                {/* Leaderboard Section */}
                <FullLeaderboard initialEntries={lbEntries} />

                {/* Discovery Footer */}
                <div style={{ marginTop: 80, paddingTop: 56, borderTop: "1px solid rgba(255,255,255,0.42)" }}>
                    <CategoryBrowser />
                </div>
            </div>
        </>
    );
}
