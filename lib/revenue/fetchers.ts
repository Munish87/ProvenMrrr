import { fetchStripeData } from "@/lib/stripe/fetcher";
import { computeMetrics, type ComputedMetrics } from "@/lib/stripe/metrics";

export type ProviderType = "stripe" | "lemonsqueezy" | "polar" | "dodopayments" | "paddle" | "revenuecat";

export interface ProviderResult {
    metrics: ComputedMetrics;
    metadata: {
        name: string;
        logo: string | null;
        founded_date?: string | null;
        country?: string | null;
        website_url?: string | null;
    };
}

/**
 * Validates an API key and fetches/simulates revenue data for a given provider.
 * Throws an error if the key is invalid.
 */
export async function fetchProviderData(
    provider: ProviderType,
    apiKey: string
): Promise<ProviderResult> {
    if (provider === "stripe") {
        // Validate Stripe key format
        if (!apiKey.startsWith("rk_") && !apiKey.startsWith("sk_")) {
            throw new Error("Invalid Stripe key format. Use a Restricted Key (rk_...).");
        }

        // Fetch real data
        const rawData = await fetchStripeData(apiKey);
        const metrics = computeMetrics(rawData);
        return {
            metrics,
            metadata: {
                name: rawData.name,
                logo: rawData.logo,
                founded_date: rawData.founded_date,
                country: rawData.country,
                website_url: rawData.website_url,
            }
        };
    }

    // ── Simulate other providers ──

    // Basic validation format checks based on provider
    if (provider === "lemonsqueezy" && (!apiKey || apiKey.length < 20)) {
        throw new Error("Invalid LemonSqueezy API key format.");
    }
    if (provider === "polar" && !apiKey.startsWith("polar_")) {
        throw new Error("Invalid Polar API key format. Must start with polar_");
    }
    if (provider === "dodopayments" && !apiKey.startsWith("dp_")) {
        throw new Error("Invalid Dodo Payments API key format. Must start with dp_");
    }
    if (provider === "paddle" && !apiKey.startsWith("pad_")) {
        throw new Error("Invalid Paddle API key format. Must start with pad_");
    }
    if (provider === "revenuecat" && (!apiKey || apiKey.length < 20)) {
        throw new Error("Invalid RevenueCat API key.");
    }

    // Since these are not fully implemented with sandbox accounts yet, we generate
    // realistic, consistent metrics based on a hash of the API key to simulate
    // the integration for the frictionless submission showcase.
    const generatedName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} Verified Startup`;

    return {
        metrics: generateSimulatedMetrics(apiKey, provider),
        metadata: {
            name: generatedName,
            logo: null,
            founded_date: null,
            country: null,
            website_url: null,
        }
    };
}

/**
 * Deterministically generates realistic startup metrics based on an API key hash.
 * This simulates pulling data from providers where we don't have active sandbox integrations yet.
 */
function generateSimulatedMetrics(apiKey: string, provider: string): ComputedMetrics {
    // Simple fast string hash
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
        const char = apiKey.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }

    // Use hash to seed predictable values
    const seed = Math.abs(hash);

    // Base MRR between $500 and $55,000
    const mrr = 500 + (seed % 54500);
    const arr = mrr * 12;

    // Growth between -5% and +35%
    const momGrowthRate = -5 + ((seed % 400) / 10);

    // Churn between 1% and 15%
    const churnRate = 1 + ((seed % 140) / 10);

    // Customer Count based on an average ARPU of $15 to $150
    const arpu = 15 + (seed % 135);
    const customerCount = Math.floor(mrr / arpu);

    // Refunds
    const refundRate = (seed % 30) / 10; // 0 to 3%

    // Volatility score
    const volatilityScore = 5 + (seed % 40); // 5 to 45%

    // Revenue by month
    const revenueByMonth = [];
    let currentMrr = mrr;
    const now = new Date();

    // Generate 6 months of historical data backwards, adjusting by growth rate
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
        revenueByMonth.push({ month: label, revenue: currentMrr, date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01` });

        // Reverse engineer the previous month's MRR
        // mrr = prevMrr * (1 + growth/100) => prevMrr = mrr / (1 + growth/100)
        currentMrr = currentMrr / (1 + (momGrowthRate / 100));
    }

    // The metric function expects oldest -> newest, but we generated newest -> oldest. Reverse it.
    revenueByMonth.reverse();

    const allTimeRevenue = mrr * (12 + (seed % 36)); // Base simulated all-time multiplier

    return {
        mrr,
        arr,
        allTimeRevenue,
        momGrowthRate,
        churnRate,
        refundRate,
        customerCount,
        volatilityScore,
        revenueByMonth
    };
}
