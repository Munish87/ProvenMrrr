const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data: interactions, error: iErr } = await supabase.from('buyer_interactions').select('*');
    console.log("interactions", JSON.stringify(interactions, null, 2));

    const { data, error } = await supabase.from('startups').select('*');
    console.log("startups", JSON.stringify(data, null, 2));
})();
