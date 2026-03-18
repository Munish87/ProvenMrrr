import { createAdminClient } from "@/lib/supabase/server";

export type StartupSaleStatus = "sale" | "offers" | "sold";

export async function getSaleStatusMap(startupIds: string[]) {
    const uniqueIds = [...new Set(startupIds.filter(Boolean))];
    const statusMap = new Map<string, StartupSaleStatus>();

    if (uniqueIds.length === 0) {
        return statusMap;
    }

    const adminSupabase = createAdminClient();
    
    // Batch requests to handle Supabase's 1,000 record limit and URL length constraints
    const CHUNK_SIZE = 500;
    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
        
        // Fetch startup overrides
        const { data: chunkStartups } = await adminSupabase
            .from("startups")
            .select("id, sale_status_override")
            .in("id", chunk);

        for (const startup of chunkStartups ?? []) {
            if (startup.sale_status_override === "sold") {
                statusMap.set(startup.id, "sold");
            }
        }

        // Fetch offers
        const { data: chunkOffers, error } = await adminSupabase
            .from("offers")
            .select("startup_id, status")
            .in("startup_id", chunk);

        if (error || !chunkOffers) {
            continue;
        }

        for (const offer of chunkOffers) {
            if (statusMap.get(offer.startup_id) === "sold") {
                continue;
            }

            if (offer.status === "accepted") {
                statusMap.set(offer.startup_id, "sold");
                continue;
            }

            if (offer.status === "pending") {
                statusMap.set(offer.startup_id, "offers");
            }
        }
    }

    return statusMap;
}
