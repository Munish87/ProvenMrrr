import * as fs from 'fs';
import * as path from 'path';

// Simple .env.local parser to load env vars for local script execution
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
        console.log("Loaded .env.local");
    }
}

async function run() {
    loadEnv();
    
    // Dynamic imports after loading env
    const { createAdminClient } = await import('../lib/supabase/server');
    const { TrustMRRImporter } = await import('../lib/services/trustmrrImporter');
    const { syncStripeMetrics } = await import('../lib/services/metrics');
    
    const adminSupabase = createAdminClient();
    
    console.log("Starting hourly metrics refresh...");
    
    // 1. Sync TrustMRR Startups (Fast Mode: Metrics only, all pages)
    console.log("Syncing TrustMRR metrics (all pages, fast mode)...");
    const trustResult = await TrustMRRImporter.importStartups(true, true); // skipTimeout, fastSync
    console.log("TrustMRR sync result:", trustResult);
    
    // 2. Sync Native Stripe Startups
    console.log("Syncing native Stripe startups...");
    const { data: connections, error } = await adminSupabase
        .from("stripe_connections")
        .select(`
            *,
            startups!inner(*)
        `);
        
    if (error) {
        console.error("Failed to fetch stripe connections:", error);
    } else if (connections) {
        console.log(`Found ${connections.length} stripe connections to sync.`);
        for (const conn of connections) {
            console.log(`Syncing metrics for startup: ${conn.startups.name} (${conn.startup_id})`);
            const result = await syncStripeMetrics(conn.startup_id, conn);
            if (result.success) {
                console.log(`Successfully synced ${conn.startups.name}`);
            } else {
                console.error(`Failed to sync ${conn.startups.name}`);
            }
        }
    }
    
    console.log("Hourly refresh complete.");
}

run().catch(console.error);
