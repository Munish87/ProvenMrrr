import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export type AdvertiserRow = {
    id: string;
    company_name: string;
    title: string;
    description: string | null;
    website_url: string;
    logo_url: string | null;
    plan_type: string;
    status: "active" | "pending" | "expired";
    created_at: string;
    expires_at: string | null;
};

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function approveAdvertiser(id: string): Promise<void> {
    "use server";
    const admin = getAdmin();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await admin.from("advertisers").update({ status: "active", expires_at: expiresAt.toISOString() }).eq("id", id);
    revalidatePath("/dashboard/admin/advertisers");
}

export async function disableAdvertiser(id: string): Promise<void> {
    "use server";
    const admin = getAdmin();
    await admin.from("advertisers").update({ status: "pending" }).eq("id", id);
    revalidatePath("/dashboard/admin/advertisers");
}

export async function deleteAdvertiser(id: string): Promise<void> {
    "use server";
    const admin = getAdmin();
    await admin.from("advertisers").delete().eq("id", id);
    revalidatePath("/dashboard/admin/advertisers");
}

export async function fetchAllAdvertisers(): Promise<AdvertiserRow[]> {
    const admin = getAdmin();
    const { data } = await admin
        .from("advertisers")
        .select("*")
        .order("created_at", { ascending: false });
    return (data ?? []) as AdvertiserRow[];
}
