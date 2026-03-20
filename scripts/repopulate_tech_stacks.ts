import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
    }
}

async function run() {
    loadEnv();
    
    // Import TrustMRRImporter AFTER env load
    const { TrustMRRImporter } = await import('../lib/services/trustmrrImporter');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase credentials");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let count = 0;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (true) {
        console.log("Fetching batch of startups needing enrichment...");
        const { data: batch, error } = await supabase
            .from('startups')
            .select('slug, name, monthly_revenue')
            .or('tags.is.null,tags.eq.{}')
            .order('monthly_revenue', { ascending: false })
            .limit(1000);

        if (error) {
            console.error("Error fetching startups:", error);
            break;
        }

        if (!batch || batch.length === 0) {
            console.log("No more startups needing enrichment found.");
            break;
        }

        console.log(`Processing batch of ${batch.length} startups.`);

        for (const startup of batch) {
            count++;
            console.log(`[Total: ${count}] Enriching ${startup.name} (${startup.slug}) - MRR: ${startup.monthly_revenue}...`);
            
            try {
                await TrustMRRImporter.enrichStartup(startup.slug);
                // Wait 3.1s to respect API rate limits
                await delay(3100);
            } catch (e) {
                console.error(`Failed to enrich ${startup.slug}:`, e);
            }
        }
    }

    console.log(`Repopulation complete. Processed ${count} startups.`);
}

run();
