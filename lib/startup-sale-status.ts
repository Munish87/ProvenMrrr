import { createAdminClient } from "@/lib/supabase/server";

export type StartupSaleStatus = "sale" | "offers" | "sold";

/**
 * Builds a sale status map for the given startup IDs.
 * 
 * @param startupIds - The IDs of the startups to check.
 * @param overrides - Optional pre-fetched map of startup_id → sale_status_override.
 *                    Pass this in to avoid a redundant DB round-trip when you already
 *                    have the startup rows (e.g. from the main page query).
 */
export async function getSaleStatusMap(
    startupIds: string[],
    overrides?: Record<string, string | null>
) {
    const uniqueIds = [...new Set(startupIds.filter(Boolean))];
    const statusMap = new Map<string, StartupSaleStatus>();

    if (uniqueIds.length === 0) {
        return statusMap;
    }

    const adminSupabase = createAdminClient();
    const CHUNK_SIZE = 500;

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);

        // Use pre-fetched overrides if provided, otherwise fetch from DB
        if (overrides) {
            for (const id of chunk) {
                if (overrides[id] === "sold") {
                    statusMap.set(id, "sold");
                }
            }
        } else {
            const { data: chunkStartups } = await adminSupabase
                .from("startups")
                .select("id, sale_status_override")
                .in("id", chunk);

            for (const startup of chunkStartups ?? []) {
                if (startup.sale_status_override === "sold") {
                    statusMap.set(startup.id, "sold");
                }
            }
        }

        // Only fetch offers (the part that isn't already in the startup row)
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
