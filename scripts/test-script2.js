const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data: interactions } = await supabase.from('buyer_interactions').select('*');
    const { data: startups } = await supabase.from('startups').select('id, name, is_listed_for_sale');
    
    fs.writeFileSync('out3.json', JSON.stringify({interactions, startups}, null, 2), 'utf-8');
})();
