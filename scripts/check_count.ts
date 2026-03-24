import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local'); // Correct path
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (key.trim()) process.env[key.trim()] = value;
            }
        });
    }
}

async function run() {
    loadEnv();
    const API_KEY = process.env.TRUSTMRR_API_KEY;
    if (!API_KEY) {
        console.error("API KEY NOT FOUND");
        return;
    }
    try {
        const res = await fetch(`https://trustmrr.com/api/v1/startups?page=1&limit=1`, {
            headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
        });
        const json = await res.json();
        console.log("TRUSTMRR META:", JSON.stringify(json.meta || json.pagination || json, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

run();
