import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLS() {
    const { error } = await supabase.rpc("exec_sql", {
        query: `
            CREATE POLICY "Public Access for avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
            CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
            CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
            CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
        `
    });

    if (error) {
        console.error("Failed to inject RLS policies:", error);
    } else {
        console.log("Successfully injected RLS policies for avatars bucket.");
    }
}

applyRLS();
