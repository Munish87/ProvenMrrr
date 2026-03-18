"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fetchProviderData, type ProviderType } from "@/lib/revenue/fetchers";
import { encryptApiKey } from "@/lib/crypto";
import { calculateHealthScore } from "@/lib/health-score/calculator";
import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";

export interface FrictionlessSubmissionParams {
    name: string;
    category: string;
    description: string;
    websiteUrl: string;
    provider: ProviderType;
    apiKey: string;
    xHandle?: string;
    isAnonymous: boolean;
    isListedForSale: boolean;
    askingPrice?: number;
    profitMargin?: number;
    contactEmail?: string;
    providerMetadata?: Record<string, any>;
}

export async function submitFrictionlessStartup(params: FrictionlessSubmissionParams) {
    try {
        const { provider, apiKey, name, category, description, websiteUrl, xHandle, isAnonymous, isListedForSale, askingPrice, profitMargin, contactEmail } = params;

        // 0. Duplicate API Key Check
        const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");
        const adminSupabase = createAdminClient();

        const { data: existingConn } = await adminSupabase
            .from("stripe_connections")
            .select("startup_id")
            .eq("api_key_hash", apiKeyHash)
            .maybeSingle();

        if (existingConn) {
            return {
                success: false,
                isDuplicate: true,
                existingStartupId: existingConn.startup_id,
                error: "This Stripe API key is already linked to a listed ProvenMRR startup."
            };
        }

        // 1. Validate API Key & Fetch Revenue Data
        let providerData;
        try {
            providerData = await fetchProviderData(provider, apiKey);
        } catch (err: unknown) {
            console.warn(`[API] Failed to parse provider data for ${name}:`, err);
            // Fallback to exactly $0 for all metrics to allow the listing to proceed natively as UNVERIFIED
            providerData = {
                metrics: {
                    mrr: 0,
                    arr: 0,
                    allTimeRevenue: 0,
                    momGrowthRate: 0,
                    churnRate: 0,
                    refundRate: 0,
                    customerCount: 0,
                    volatilityScore: 0,
                    revenueByMonth: [],
                },
                metadata: {
                    name,
                    logo: null,
                    founded_date: null,
                    country: null,
                }
            };
        }

        const metrics = providerData.metrics;

        // 2. Determine Verification Status
        // If MRR stringency isn't met (revenue == 0), allow listing but mark as UNVERIFIED.
        const isVerified = metrics.mrr > 0;

        // 2. Health Score Calculation
        const healthResult = calculateHealthScore(metrics as any);

        // 3. Generate Secure Claim Token
        const claimToken = randomBytes(16).toString("hex");

        // Check if an authenticated user is submitting it, if so, we can just assign owner_id directly
        // and bypass the claim token need for that specific user.
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();

        const ownerId = user ? user.id : null;

        const startupName = providerData?.metadata?.name || name || "Unclaimed Startup";
        const logoUrl = providerData?.metadata?.logo || null;
        const foundedDate = providerData?.metadata?.founded_date || null;
        const country = providerData?.metadata?.country || null;

        // 4. Create the Startup Record
        const { data: startup, error: startupError } = await adminSupabase
            .from("startups")
            .insert({
                owner_id: ownerId,
                name: startupName,
                logo_url: logoUrl,
                founded_date: foundedDate,
                country,
                category,
                description,
                website_url: websiteUrl || providerData?.metadata?.website_url || null,
                x_handle: xHandle || null,
                is_anonymous: isAnonymous,
                is_listed_for_sale: isListedForSale,
                is_verified: isVerified,
                provider: provider,
                claim_token: ownerId ? null : claimToken, // Only need token if not logged in
                asking_price: askingPrice,
                profit_margin_30d: profitMargin,
                contact_email: contactEmail
            })
            .select("id")
            .single();

        if (startupError || !startup) {
            console.error("Startup Insert Error:", startupError);
            return { success: false, error: "Failed to create startup listing" };
        }

        const startupId = startup.id;

        // 5. Store Encrypted API Key
        const encryptedKey = encryptApiKey(apiKey);
        const { error: connError } = await adminSupabase
            .from("stripe_connections")
            .insert({
                startup_id: startupId,
                encrypted_api_key: encryptedKey,
                api_key_hash: apiKeyHash,
                provider: provider,
                last_synced_at: new Date().toISOString(),
            });

        if (connError) {
            console.error("Connection Insert Error:", connError);
        }

        // 6. Store Revenue Snapshots (Historical + Current)
        const snapshotsData = metrics.revenueByMonth.map((point, index) => {
            const isCurrentMonth = index === metrics.revenueByMonth.length - 1;
            return {
                startup_id: startupId,
                mrr: isCurrentMonth ? metrics.mrr : 0,
                arr: isCurrentMonth ? metrics.arr : 0,
                all_time_revenue: isCurrentMonth ? metrics.allTimeRevenue : point.revenue,
                churn_rate: isCurrentMonth ? metrics.churnRate : 0,
                growth_rate: isCurrentMonth ? metrics.momGrowthRate : 0,
                volatility_score: isCurrentMonth ? metrics.volatilityScore : 0,
                customer_count: isCurrentMonth ? metrics.customerCount : 0,
                refund_rate: isCurrentMonth ? metrics.refundRate : 0,
                snapshot_date: point.date || new Date().toISOString().split("T")[0],
            };
        });

        const { error: snapshotError } = await adminSupabase
            .from("revenue_snapshots")
            .insert(snapshotsData);

        if (snapshotError) {
            console.error("Snapshot Insert Error:", snapshotError);
        }

        // 7. Store Health Score
        const { error: healthError } = await adminSupabase
            .from("health_scores")
            .insert({
                startup_id: startupId,
                score: healthResult.score,
                risk_level: healthResult.riskLevel,
                ai_summary: healthResult.aiSummary,
            });

        if (healthError) {
            console.error("Health Score Insert Error:", healthError);
        }

        // Successfully created the frictionless listing
        revalidatePath("/dashboard/startups");

        return {
            success: true,
            startupId,
            claimToken: ownerId ? null : claimToken,
            mrr: metrics.mrr,
            startup: {
                id: startupId,
                name: startupName,
                logo_url: logoUrl,
                mrr: metrics.mrr,
                growth_rate: metrics.momGrowthRate,
                score: healthResult.score,
                risk_level: healthResult.riskLevel,
                category: category || "Software",
                is_listed_for_sale: isListedForSale,
                is_verified: isVerified,
                created_at: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error("[submitFrictionlessStartup] Error:", error);
        return { success: false, error: "An unexpected error occurred during submission." };
    }
}

export async function toggleWatchlist(startupId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "You must be signed in to save startups.", saved: false };
    }

    try {
        // Check if already in watchlist
        const { data: existing } = await supabase
            .from("watchlists")
            .select("id")
            .eq("startup_id", startupId)
            .eq("user_id", user.id)
            .returns<{ id: string }[]>()
            .maybeSingle();

        if (existing) {
            // Remove it
            const { error } = await supabase
                .from("watchlists")
                .delete()
                .eq("id", existing.id);

            if (error) throw error;
            revalidatePath("/dashboard/interested");
            revalidatePath(`/startup/${startupId}`);
            return { success: true, saved: false };
        } else {
            // Add it
            const { error } = await supabase
                .from("watchlists")
                .insert({
                    startup_id: startupId,
                    user_id: user.id
                } as any);

            if (error) throw error;
            revalidatePath("/dashboard/interested");
            revalidatePath(`/startup/${startupId}`);
            return { success: true, saved: true };
        }
    } catch (e) {
        console.error("Failed to toggle watchlist:", e);
        return { success: false, error: "Failed to update watchlist.", saved: false };
    }
}
