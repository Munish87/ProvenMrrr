"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { decryptApiKey } from "@/lib/crypto";

export async function claimStartup(token: string) {
    if (!token) return { success: false, error: "Invalid claim token." };

    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be logged in to claim a startup." };
        }

        const adminSupabase = createAdminClient();

        // Find the startup with this claim token
        const { data: startup, error: findError } = await adminSupabase
            .from("startups")
            .select("id, owner_id")
            .eq("claim_token", token)
            .single();

        if (findError || !startup) {
            return { success: false, error: "Startup not found or already claimed." };
        }

        if (startup.owner_id) {
            return { success: false, error: "This startup is already claimed." };
        }

        // Update the owner and remove the claim token
        const { error: updateError } = await adminSupabase
            .from("startups")
            .update({
                owner_id: user.id,
                claim_token: null,
            })
            .eq("id", startup.id);

        if (updateError) {
            console.error("Failed to claim startup:", updateError);
            return { success: false, error: "Failed to claim startup." };
        }

        revalidatePath("/dashboard");
        revalidatePath(`/startup/${startup.id}`);

        return { success: true, startupId: startup.id };

    } catch (error) {
        console.error("Claim startup error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
export async function claimStartupWithApiKey(startupId: string, apiKey: string) {
    if (!startupId || !apiKey) return { success: false, error: "Missing required information." };

    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: "You must be logged in to claim a startup." };
        }

        const adminSupabase = createAdminClient();

        // 1. Fetch the stored connection to verify the API key
        const { data: conn, error: connError } = await adminSupabase
            .from("stripe_connections")
            .select("encrypted_api_key")
            .eq("startup_id", startupId)
            .single();

        if (connError || !conn) {
            return { success: false, error: "No Stripe connection found for this startup. Please contact support." };
        }

        // 2. Decrypt and compare
        const storedApiKey = decryptApiKey(conn.encrypted_api_key);
        if (apiKey.trim() !== storedApiKey.trim()) {
            return { success: false, error: "Invalid API key. Please use the same Stripe Restricted API key used during submission." };
        }

        // 3. Mark as claimed and verified
        const { error: updateError } = await adminSupabase
            .from("startups")
            .update({
                claimed_by_user_id: user.id,
                owner_id: user.id, // Also update owner_id for dashboard compatibility
                verified: true,
                is_verified: true // Update legacy column too
            })
            .eq("id", startupId);

        if (updateError) {
            console.error("Failed to update startup claim:", updateError);
            return { success: false, error: "Database update failed." };
        }

        revalidatePath("/dashboard");
        revalidatePath(`/startup/${startupId}`);

        return { success: true };

    } catch (error) {
        console.error("Claim with API key error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
