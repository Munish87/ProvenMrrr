import * as fs from 'fs';
import * as path from 'path';

// Simple .env.local parser
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
    } else {
        console.warn(".env.local not found");
    }
}

async function run() {
    loadEnv();
    
    // Dynamically import AFTER loading env
    const { TrustMRRImporter } = await import('../lib/services/trustmrrImporter');
    
    console.log("Starting manual TrustMRR refresh...");
    console.log("API Key present:", !!process.env.TRUSTMRR_API_KEY);
    
    try {
        const isFast = process.argv.includes('--fast');
        console.log(`Sync mode: ${isFast ? 'FAST (Metrics only)' : 'FULL (With Enrichment)'}`);
        const result = await TrustMRRImporter.importStartups(true, isFast); // skipTimeout, isFast
        console.log("Refresh result:", result);
    } catch (error) {
        console.error("Refresh failed:", error);
    }
}

run();
