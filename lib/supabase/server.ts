import { createServerClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client (uses anon key + user session from cookies).
 * Use inside Server Components and Route Handlers.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Component — cookies cannot be set in read pass
                    }
                },
            },
        }
    );
}

/**
 * Admin Supabase client (uses service role key — bypasses RLS).
 * Uses the plain supabase-js client without type constraints on insert policies.
 * ONLY use inside secure API routes, never expose to client.
 */
export function createAdminClient() {
    return createRawClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}
