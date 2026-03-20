import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oxzvikzvodrohjycfucj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94enZpa3p2b2Ryb2hqeWNmdWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODY5MDQsImV4cCI6MjA4ODE2MjkwNH0.4w7NWyO_XnUSJQiSBwtunVEUs1sY6zGz-nT2PoDn11A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: startup, error } = await supabase
        .from('startups')
        .select('*')
        .eq('id', '820f957d-09be-41d1-ae2a-e62b96473837')
        .single();
    
    console.log("Startup:", startup);
    console.log("Error:", error);

    const { data: snaps, error: snapErr } = await supabase
        .from('revenue_snapshots')
        .select('*')
        .eq('startup_id', '820f957d-09be-41d1-ae2a-e62b96473837')
        .order('snapshot_date', { ascending: false })
        .limit(3);

    console.log("Snaps:", snaps);
}

main();
