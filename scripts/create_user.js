
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = urlMatch[1];
const serviceKey = serviceKeyMatch[1];

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const email = 'demo@provenmrr.com';
    const password = 'password123';

    // Create User via Admin API (bypasses rate limits and auto-confirms)
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (createError && !createError.message.includes('already registered')) {
        console.error("Admin Create Error:", createError.message);
        process.exit(1);
    } else if (user) {
        console.log("Admin Create Success. User ID:", user.user.id);
    } else {
        console.log("User might already exist.");
    }

    // Now test login using regular sign in (need anon key for this)
    const anonKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
    const supabaseClient = createClient(supabaseUrl, anonKeyMatch[1]);

    const loginRes = await supabaseClient.auth.signInWithPassword({ email, password });

    if (loginRes.error) {
        console.error("Login verification failed:", loginRes.error.message);
    } else {
        console.log("Login verified successfully!");
    }
}
run();
