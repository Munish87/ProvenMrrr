import { Navbar } from "@/components/layout/Navbar";
import { FounderCommunityPage } from "@/components/community/FounderCommunityPage";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Do NOT cache — we need fresh user auth state on every request
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founder Community - ProvenMRR",
  description:
    "Build in public, discuss tactics, and learn from other founders inside ProvenMRR.",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get authenticated user — never throws, returns null when logged out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Always fetch aggregate counts
  const [{ count: totalFounders }, { count: totalStartups }] = await Promise.all([
    adminSupabase.from("users").select("*", { count: "exact", head: true }),
    adminSupabase.from("startups").select("*", { count: "exact", head: true }),
  ]);

  // Only fetch user-specific data when logged in
  let currentUser: {
    id: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null = null;
  let userStartups: string[] = [];

  if (user) {
    const [profileRes, startupsRes] = await Promise.all([
      adminSupabase
        .from("users")
        .select("name, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      adminSupabase
        .from("startups")
        .select("name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    currentUser = {
      id: user.id,
      email: profileRes.data?.email ?? user.email ?? null,
      name: profileRes.data?.name ?? null,
      avatarUrl: profileRes.data?.avatar_url ?? null,
    };

    userStartups = (startupsRes.data ?? []).map(
      (s: { name: string }) => s.name
    );
  }

  return (
    <>
      <Navbar user={user} />
      <FounderCommunityPage
        totalFounders={totalFounders ?? 0}
        totalStartups={totalStartups ?? 0}
        userStartups={userStartups}
        currentUser={currentUser}
      />
    </>
  );
}
