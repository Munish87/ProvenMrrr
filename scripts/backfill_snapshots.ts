import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillSnapshots() {
    console.log("Fetching TrustMRR startups...");
    const { data: startups, error } = await supabase
        .from("startups")
        .select("id, monthly_revenue, growth_rate, customer_count, revenue_30d")
        .eq("source", "trustmrr");

    if (error || !startups) {
        console.error("Failed to fetch startups", error);
        return;
    }

    console.log(`Found ${startups.length} startups. Backfilling...`);
    let inserted = 0;

    for (const startup of startups) {
        const mrr = startup.monthly_revenue || 0;
        const growth = startup.growth_rate || 0;
        const revenue30d = startup.revenue_30d || 0;
        const customers = startup.customer_count || 0;

        let currentMrr = mrr;
        let currentCustomers = customers;
        let currentAllTime = 0; // We don't have all-time on the row, so we just use 0 or something approximated
        const growthMultiplier = growth !== 0 ? (1 + (growth / 100)) : 1;
        
        // We know that month 0 (today) and month 1 (last month) are already generated.
        // We need to generate month 2, 3, 4, 5 (which is 2-5 months ago).
        
        // First, step back 1 month to get the state at 30 days ago
        currentMrr = growth !== 0 ? currentMrr / growthMultiplier : currentMrr;
        currentCustomers = Math.max(0, currentCustomers - 1);

        const snapshotsToInsert = [];

        // Now step back and insert 4 more months
        for (let i = 2; i <= 5; i++) {
            const pastDate = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            currentMrr = growth !== 0 ? currentMrr / growthMultiplier : currentMrr;
            currentCustomers = Math.max(0, currentCustomers - 1);
            
            snapshotsToInsert.push({
                startup_id: startup.id,
                mrr: parseFloat(currentMrr.toFixed(2)),
                arr: parseFloat((currentMrr * 12).toFixed(2)),
                growth_rate: 0,
                customer_count: currentCustomers,
                all_time_revenue: 0,
                snapshot_date: pastDate
            });
        }

        for (const snap of snapshotsToInsert) {
            const { data: exSnap } = await supabase.from("revenue_snapshots").select("id").eq("startup_id", startup.id).eq("snapshot_date", snap.snapshot_date).maybeSingle();
            if (!exSnap) {
                await supabase.from("revenue_snapshots").insert(snap);
                inserted++;
            }
        }
    }

    console.log(`Backfill complete. Inserted ${inserted} historical snapshots.`);
}

backfillSnapshots();
