
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oxzvikzvodrohjycfucj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94enZpa3p2b2Ryb2hqeWNmdWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDk5OTQsImV4cCI6MjA1NDA4NTk5NH0.ZJ2zJt_t-Tj2m_Lh_1lZ-PjL_b_lJ5_8_l_L_u-_v_I'; // Try to use anon key if possible, but actually service role is easiest. Wait, anon key is needed to test exactly what the browser does. Or I can just use my existing snippet.

// I will use anon key if I have it, else I will just parse it out of .env.local
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const anonKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);

const supabase = createClient(urlMatch[1], anonKeyMatch[1]);

async function run() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@test.com',
        password: 'password123',
    });
    if (error) {
        console.error("Login failed:", error.message);
    } else {
        console.log("Login succeeded:", data.user?.email);
    }
}
run();
