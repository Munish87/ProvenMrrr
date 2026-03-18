"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Service role bypass for public listings discovery
const getServiceRoleClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type BuyerPreferences = {
    min_budget: number | null;
    max_budget: number | null;
    categories: string[];
    min_mrr: number | null;
    min_growth_rate: number | null;
    min_profit_margin: number | null;
    requires_mobile_app: boolean;
    min_team_size: number | null;
};

export async function getBuyerPreferences() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("buyer_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    return { success: !error, preferences: data, error };
}

export async function saveBuyerPreferences(prefs: Partial<BuyerPreferences>) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
        .from("buyer_preferences")
        .upsert({
            user_id: user.id,
            ...prefs,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

    revalidatePath("/dashboard/matchmaking");
    return { success: !error, preferences: data, error };
}

export async function saveBuyerInteraction(startupId: string, type: 'interested' | 'skipped' | 'saved') {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("buyer_interactions")
        .upsert({
            user_id: user.id,
            startup_id: startupId,
            interaction_type: type,
            created_at: new Date().toISOString(),
        });

    revalidatePath("/dashboard/matchmaking");
    revalidatePath("/dashboard/interested");
    return { success: !error };
}

export async function removeBuyerInteraction(startupId: string) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("buyer_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("startup_id", startupId);

    revalidatePath("/dashboard/matchmaking");
    revalidatePath("/dashboard/interested");
    return { success: !error };
}

export async function getMatchedStartups() {
    try {
        const userClient = await createServerClient();
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const serviceClient = getServiceRoleClient();

        // 1. Get user preferences
        const { data: prefs } = await userClient
            .from("buyer_preferences")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        // 2. Get user interactions to filter out things they decided on
        const { data: interactions } = await userClient
            .from("buyer_interactions")
            .select("startup_id, interaction_type")
            .eq("user_id", user.id);

        const reviewHistory = new Set(interactions?.map((i: any) => i.startup_id) || []);

        // 3. Fetch all startups listed for sale (Service role ensures visibility)
        const { data: startups, error: startupsError } = await serviceClient
            .from("startups")
            .select("*, revenue_snapshots(*)")
            .eq("is_listed_for_sale", true);

        if (startupsError) throw startupsError;
        if (!startups || startups.length === 0) return { success: true, matches: [] };

        // 4. Transform and Score
        const matches = startups
            .filter((s: any) => !reviewHistory.has(s.id)) // Only show unreviewed
            .map((startup: any) => {
                let score = 100;
                
                const latestSnapshot = startup.revenue_snapshots && startup.revenue_snapshots.length > 0
                    ? startup.revenue_snapshots.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                    : null;

                if (prefs) {
                    const mrr = latestSnapshot?.mrr || 0;
                    const growth = latestSnapshot?.growth_rate || 0;
                    const price = startup.asking_price || 0;

                    if (prefs.min_budget && price < prefs.min_budget) score -= 20;
                    if (prefs.max_budget && price > prefs.max_budget) score -= 30;
                    if (prefs.min_mrr && mrr < prefs.min_mrr) score -= 20;
                    if (prefs.min_growth_rate && growth < prefs.min_growth_rate) score -= 15;
                    if (prefs.categories && prefs.categories.length > 0 && (!startup.category || !prefs.categories.includes(startup.category))) score -= 25;
                    
                    // Filter based on mobile app requirement
                    if (prefs.requires_mobile_app && !startup.has_mobile_app) score -= 50;
                }

                return {
                    startup,
                    score: Math.max(0, Math.round(score)),
                    latestSnapshot,
                    interaction: null
                };
            })
            // If no prefs set, show all. If prefs set, filter out bad matches
            .filter((m: any) => (!prefs) || m.score > 20)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 20); // Batch size for the stack

        return { success: true, matches };

    } catch (err) {
        console.error("Critical Matchmaking Error:", err);
        return { success: false, error: "Matchmaking engine unavailable" };
    }
}

export async function getInterestedStartups() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Unauthorized" };

        // 1. Fetch interested interactions
        const { data: interactions } = await supabase
            .from("buyer_interactions")
            .select("startup_id, interaction_type")
            .eq("user_id", user.id)
            .eq("interaction_type", "interested");

        if (!interactions || interactions.length === 0) return { success: true, matches: [] };

        const startupIds = interactions.map(i => i.startup_id);

        // 2. Fetch startup details
        const serviceClient = getServiceRoleClient();
        const { data: startups, error } = await serviceClient
            .from("startups")
            .select("*, revenue_snapshots(*), health_scores(*)")
            .in("id", startupIds);

        if (error) throw error;

        // 3. Transform
        const matches = startups.map((startup: any) => {
            const latestSnapshot = startup.revenue_snapshots && startup.revenue_snapshots.length > 0
                ? startup.revenue_snapshots.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                : null;
            
            const latestHealth = startup.health_scores && startup.health_scores.length > 0
                ? startup.health_scores.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                : null;

            return {
                startup,
                snapshot: latestSnapshot,
                score: latestHealth?.score || 100, // Fallback if no health score
            };
        });

        return { success: true, matches };
    } catch (err) {
        console.error("Match Fetching Error:", err);
        return { success: false, error: "Failed to load matches" };
    }
}
