"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setDashboardRole(role: "buyer" | "seller") {
    const cookieStore = await cookies();
    cookieStore.set("dashboard_role", role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: "lax",
    });
    revalidatePath("/dashboard", "layout");
}

export async function sendOfferMessage(offerId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error: messageError } = await supabase
        .from("offer_messages")
        .insert({
            offer_id: offerId,
            sender_id: user.id,
            content: content
        });

    if (messageError) throw messageError;

    // Update the last reply timestamp on the offer itself
    await supabase
        .from("offers")
        .update({
            replied_at: new Date().toISOString()
        })
        .eq("id", offerId);

    revalidatePath("/dashboard/inbox");
}
