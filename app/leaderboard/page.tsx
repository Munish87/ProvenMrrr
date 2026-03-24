import { FullLeaderboard } from "@/components/startup/FullLeaderboard";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = { title: "Leaderboard — ProvenMRR" };

// Revalidate the leaderboard every 10 minutes
export const revalidate = 600;

export default async function LeaderboardPage() {
    const supabase = createAdminClient();

    // 1. Fetch only top 100 verified startups by MRR
    const { data: startups, error } = await supabase
        .from("startups")
        .select("id, name, slug, logo_url, category, description, x_handle, verified, is_verified, is_anonymous, owner_id, claimed_by_user_id, sale_status_override, is_listed_for_sale, asking_price, monthly_revenue, growth_rate")
        .filter("is_verified", "eq", true)
        .order("monthly_revenue", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Leaderboard fetch error:", error);
    }

    const founderIds = Array.from(
        new Set(
            (startups || [])
                .flatMap((s: any) => [s.claimed_by_user_id, s.owner_id])
                .filter(Boolean)
        )
    );

    // 2. Fetch required founder profiles in parallel
    const founderMap = new Map();
    if (founderIds.length > 0) {
        const { data: founderProfiles } = await supabase
            .from("users")
            .select("id, name, x_handle, avatar_url")
            .in("id", founderIds);
        
        for (const p of founderProfiles ?? []) {
            founderMap.set(p.id, p);
        }
    }

    const lbEntries = (startups || []).map((s) => {
        const founderProfile = founderMap.get(s.claimed_by_user_id || s.owner_id);
        return {
            startup_id: s.id,
            startups: {
                ...s,
                founder_name: founderProfile?.name || null,
                founder_handle: founderProfile?.x_handle || s.x_handle || null,
                founder_avatar_url: founderProfile?.avatar_url || null,
            },
            mrr: s.monthly_revenue || 0,
            arr: (s.monthly_revenue || 0) * 12,
            growth_rate: s.growth_rate || 0,
        };
    });

    return (
        <>
            <Navbar user={null} />

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
