import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map(c => c.name);

    return NextResponse.json({
        authenticated: !!user,
        user: user ? { id: user.id, email: user.email } : null,
        userError,
        session: !!session,
        sessionError,
        cookiesFound: allCookies,
    });
}
