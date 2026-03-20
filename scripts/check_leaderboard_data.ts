import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: snaps, error } = await supabase
        .from("revenue_snapshots")
        .select("startup_id, mrr, arr, all_time_revenue, snapshot_date")
        .order("snapshot_date", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching snapshots:", error);
        return;
    }

    console.log("Latest Snapshots:", JSON.stringify(snaps, null, 2));

    const { data: startups, error: sError } = await supabase
        .from("startups")
        .select("id, name, asking_price, verified, is_verified")
        .limit(10);

    if (sError) {
        console.error("Error fetching startups:", sError);
        return;
    }

    console.log("Verified Startups:", JSON.stringify(startups, null, 2));
}

checkData();
