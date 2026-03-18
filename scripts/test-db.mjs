import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('startups').select('id, name, tech_stack').eq('id', 'f212ea97-c7c7-4936-8525-4b492541628a');
  console.log('CURRENT DB STATE:', data);
  console.log('ERROR:', error);
}

check();
