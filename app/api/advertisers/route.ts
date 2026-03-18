import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type Advertiser = {
    id: string;
    company_name: string;
    logo_url: string | null;
    title: string;
    description: string | null;
    website_url: string;
    status: string;
};

// GET — fetch active advertisers
export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ advertisers: data ?? [] });
}

// POST — submit a new advertiser (starts as pending)
export async function POST(req: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check slot count
    const { count } = await supabase
        .from("advertisers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

    if ((count ?? 0) >= 30) {
        return NextResponse.json(
            { error: "All 9 advertiser slots are currently filled." },
            { status: 409 }
        );
    }

    const body = await req.json();
    const { company_name, website_url, logo_url, title, description, plan_type } = body;

    if (!company_name || !website_url || !title) {
        return NextResponse.json(
            { error: "company_name, website_url, and title are required." },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("advertisers")
        .insert({
            company_name,
            website_url,
            logo_url: logo_url || null,
            title,
            description: description || null,
            plan_type: plan_type || "monthly",
            status: "pending",
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ advertiser: data }, { status: 201 });
}
