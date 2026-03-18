import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const query = fs.readFileSync(path.join(process.cwd(), "supabase", "migrations", "006_cofounder_flag.sql"), "utf8");

    // In Supabase, the postgrest API doesn't support raw DDL by default unless via RPC or direct connection.
    // Wait, I can't run raw SQL easily via the JS client without an RPC function.
    // Let me try to see if there's a pre-existing RPC function like `run_sql` or similar from previous migrations.
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { query_string: query });

    if (rpcError) {
        // If there's no exec_sql, I will just prompt the user to apply the migration manually in the Supabase UI.
        return NextResponse.json({ success: false, error: rpcError, instructions: "Please ask the user to run the migration manually." });
    }

    return NextResponse.json({ success: true, data: rpcData });
}
