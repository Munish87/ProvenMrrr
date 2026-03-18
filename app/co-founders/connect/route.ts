import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const startupId = url.searchParams.get("startupId");

    if (!startupId) {
        return NextResponse.redirect(new URL("/co-founders", url.origin));
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(
            new URL(`/login?next=${encodeURIComponent(`/co-founders/connect?startupId=${startupId}`)}`, url.origin)
        );
    }

    const { data: startup } = await supabase
        .from("startups")
        .select("id, owner_id, name")
        .eq("id", startupId)
        .single();

    if (!startup || !startup.owner_id) {
        return NextResponse.redirect(new URL("/co-founders", url.origin));
    }

    if (startup.owner_id === user.id) {
        return NextResponse.redirect(new URL("/dashboard/startups", url.origin));
    }

    const { data: existingOffer } = await supabase
        .from("offers")
        .select("id")
        .eq("startup_id", startupId)
        .eq("buyer_id", user.id)
        .eq("status", "cofounder")
        .maybeSingle();

    let offerId = existingOffer?.id;

    if (!offerId) {
        const initialMessage = `Hi, I'm interested in connecting about ${startup.name} as a potential co-founder.`;

        const { data: createdOffer, error: createError } = await supabase
            .from("offers")
            .insert({
                startup_id: startupId,
                buyer_id: user.id,
                amount: 0,
                message: initialMessage,
                status: "cofounder",
            })
            .select("id")
            .single();

        if (createError || !createdOffer) {
            return NextResponse.redirect(new URL("/co-founders", url.origin));
        }

        offerId = createdOffer.id;

        await supabase.from("offer_messages").insert({
            offer_id: offerId,
            sender_id: user.id,
            content: initialMessage,
        });
    }

    const response = NextResponse.redirect(new URL(`/dashboard/inbox?id=${offerId}`, url.origin));
    response.cookies.set("dashboard_role", "buyer", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "lax",
    });
    return response;
}
