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

async function forceEnrich(slug: string) {
    loadEnv();
    // Dynamic import after env is loaded
    const { TrustMRRImporter } = await import('../lib/services/trustmrrImporter');
    console.log(`Force enriching: ${slug}`);
    const result = await TrustMRRImporter.enrichStartup(slug);
    console.log('Result:', JSON.stringify(result, null, 2));
}

const slug = process.argv[2] || 'gluer';
forceEnrich(slug);
