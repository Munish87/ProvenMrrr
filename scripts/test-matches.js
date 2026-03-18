const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// We simulate the server action environment as much as possible
async function test() {
    console.log("Testing matches with Service Role...");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check startups
    const { data: startups } = await supabase.from('startups').select('id, name, is_listed_for_sale, is_anonymous').eq('is_listed_for_sale', true);
    console.log("Listed for sale (Service Role):", startups?.length || 0);

    // Check anon read
    console.log("Testing as ANON...");
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: anonStartups } = await anonClient.from('startups').select('id, name, is_listed_for_sale, is_anonymous').eq('is_listed_for_sale', true);
    console.log("Listed for sale (ANON):", anonStartups?.length || 0);
}

test();
