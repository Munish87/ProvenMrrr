import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Stripe from 'stripe';

const supabase = createClient(
    'https://oxzvikzvodrohjycfucj.supabase.co',
    'sb_secret_7bo7rsUrXng9CLVTRHSE-g_rrhGH1Lm',
    { auth: { persistSession: false, autoRefreshToken: false } }
);

function decryptApiKey(encryptedText) {
    const key = Buffer.from('e57242c6ccd7ba3cdd606fe146be4c2f496b9914580db7c7f8c5b2c3a273ea9e', 'hex');
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    const ciphertext = Buffer.from(parts[2], "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

async function main() {
    console.log("Fetching conn...");
    const { data: conn, error } = await supabase.from('stripe_connections').select('*').eq('startup_id', '820f957d-09be-41d1-ae2a-e62b96473837').single();
    if (error || !conn) {
        console.error("No conn found:", error);
        return;
    }

    console.log("Decrypting key...");
    const apiKey = decryptApiKey(conn.encrypted_api_key);
    
    console.log("Fetching Stripe...");
    const stripe = new Stripe(apiKey, { apiVersion: "2024-04-10" });
    
    try {
        const subs = await stripe.subscriptions.list({ limit: 10, status: "all", expand: ["data.items"] });
        console.log("Subscriptions:", JSON.stringify(subs.data, null, 2));
    } catch(e) {
        console.error("Sub error:", e.message);
    }
}
main();
