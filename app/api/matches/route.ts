import { createClient } from "@/lib/supabase/server";
import { getInterestedStartups } from "@/app/actions/matchmaking";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await getInterestedStartups();
        return NextResponse.json(res);
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch matches" }, { status: 500 });
    }
}
