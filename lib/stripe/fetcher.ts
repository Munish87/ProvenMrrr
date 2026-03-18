import Stripe from "stripe";

export interface RawStripeData {
    subscriptions: Stripe.Subscription[];
    charges: Stripe.Charge[];
    name: string;
    logo: string | null;
    founded_date: string | null;
    country: string | null;
    website_url: string | null;
}

/**
 * Validates a Stripe restricted API key and fetches all permitted revenue data.
 * Catch and gracefully skip any endpoints the key lacks read permissions for.
 */
export async function fetchStripeData(apiKey: string): Promise<RawStripeData> {
    const stripe = new Stripe(apiKey, { apiVersion: "2026-02-25.clover" });

    let subscriptions: Stripe.Subscription[] = [];
    let charges: Stripe.Charge[] = [];

    try {
        subscriptions = await stripe.subscriptions
            .list({ limit: 100, status: "all", expand: ["data.items"] })
            .autoPagingToArray({ limit: 1000 });
    } catch (err: any) {
        console.warn("[Stripe] Skipping subscriptions fetch. Permissions likely missing.", err.message);
    }

    try {
        charges = await stripe.charges
            .list({ limit: 100 })
            .autoPagingToArray({ limit: 2000 });
    } catch (err: any) {
        console.warn("[Stripe] Skipping charges fetch. Permissions likely missing.", err.message);
    }

    let name = "Stripe Startup";
    let logo: string | null = null;
    let founded_date: string | null = null;
    let country: string | null = null;
    let website_url: string | null = null;

    try {
        const account = await stripe.accounts.retrieve();
        if (account.created) {
            founded_date = new Date(account.created * 1000).toISOString();
        }
        if (account.business_profile?.name) {
            name = account.business_profile.name;
        } else if (account.settings?.dashboard?.display_name) {
            name = account.settings.dashboard.display_name;
        }
        if (account.business_profile?.url) {
            website_url = account.business_profile.url;
        }
        if (account.country) {
            country = account.country;
        }
    } catch {
        // Fallback to products if the account retrieve fails due to strict permission limitations
        let products: Stripe.Product[] = [];
        try {
            products = (await stripe.products.list({ limit: 10, active: true })).data;
            if (products.length > 0) {
                name = products[0].name;
                logo = products[0].images?.[0] || null;
                // Set founded date to the oldest connected product's creation date as a secure fallback
                const oldestProduct = products.reduce((oldest, p) => (p.created < oldest.created ? p : oldest), products[0]);
                founded_date = new Date(oldestProduct.created * 1000).toISOString();
            }
        } catch {
            if (subscriptions.length === 0 && charges.length === 0) {
                console.warn("[Stripe] Invalid API Key or absolutely no read permissions granted for revenue calculation. Falling back to zero-state.");
            }
        }
    }

    return {
        subscriptions,
        charges,
        name,
        logo,
        founded_date,
        country,
        website_url,
    };
}
