import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existingUser } = await adminSupabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    const payload = {
      id: user.id,
      email: user.email ?? `${user.id}@placeholder.local`,
      role: "founder",
      name: existingUser?.name || (user.user_metadata as { full_name?: string } | null)?.full_name || null,
    };

    const { error } = await adminSupabase.from("users").upsert(payload, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
