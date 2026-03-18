import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: startups, error: startupError } = await supabase.from('startups').select('*').eq('is_verified', true);
    console.log('STARTUPS ERROR:', startupError);
    console.log('IS_VERIFIED STARTUPS:', startups?.length);

    const { data: vStartups, error: vStartupError } = await supabase.from('startups').select('*').eq('verified', true);
    console.log('VERIFIED STARTUPS ERROR:', vStartupError);
    console.log('VERIFIED STARTUPS:', vStartups?.length);
    console.log('VSTARTUPS DATA:', vStartups);

    const sList = vStartups || [];
    if (sList.length > 0) {
        const { data: snaps, error: snapError } = await supabase.from('revenue_snapshots').select('*').in('startup_id', sList.map(s => s.id));
        console.log('SNAPS ERROR:', snapError);
        console.log('SNAPS:', snaps);
    }
}
run();
