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

async function checkStartup(slug: string) {
    loadEnv();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase credentials");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
        .from('startups')
        .select('name, tags, insights')
        .eq('slug', slug)
        .single();
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('--- Startup:', data.name, '---');
    console.log('Tags:', JSON.stringify(data.tags, null, 2));
    console.log('Insights:', JSON.stringify(data.insights, null, 2));
}

const slug = process.argv[2] || 'gluer';
checkStartup(slug);
