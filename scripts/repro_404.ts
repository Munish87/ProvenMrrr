import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Manually load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test(id: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    console.log(`Testing ID: ${id}, isUUID: ${isUUID}`);
    
    const { data, error } = await supabase.from("startups").select("*")
        .or(isUUID ? `id.eq.${id},slug.eq.${id}` : `slug.eq.${id}`)
        .maybeSingle();

    if (error) {
        console.error("Query Error:", error);
    } else if (!data) {
        console.log("Result: NOT FOUND (404)");
    } else {
        console.log("Result: FOUND", { id: data.id, name: data.name, slug: data.slug, is_anonymous: data.is_anonymous });
    }
}

async function run() {
    console.log("--- Test with slug 'renoassist' ---");
    await test("renoassist");
    
    console.log("\n--- Test with UUID 'f22bed18-34ac-485e-b4ce-736ffd10dfa8' ---");
    await test("f22bed18-34ac-485e-b4ce-736ffd10dfa8");

    console.log("\n--- Test with anonymous slug 'ai-enhancer-and-video' ---");
    await test("ai-enhancer-and-video");
}

run();
