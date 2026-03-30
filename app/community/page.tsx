import { Navbar } from "@/components/layout/Navbar";
import { FounderCommunityPage } from "@/components/community/FounderCommunityPage";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// Do NOT cache — we need fresh user auth state on every request
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founder Community - ProvenMRR",
  description: "Build in public, discuss tactics, and learn from other founders inside ProvenMRR.",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get authenticated user (returns null if not logged in — no redirect)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch real-time counts and user profile in parallel
  const [{ count: totalFounders }, { count: totalStartups }, userProfileRes, userStartupsRes] = await Promise.all([
    adminSupabase.from("users").select("*", { count: "exact", head: true }),
    adminSupabase.from("startups").select("*", { count: "exact", head: true }),
    user
      ? adminSupabase.from("users").select("name, email, avatar_url").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? adminSupabase.from("startups").select("name").eq("owner_id", user.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const userProfile = userProfileRes.data;
  const userStartups = (userStartupsRes.data ?? []).map((s: { name: string }) => s.name);

  const currentUser = user
    ? {
        id: user.id,
        email: userProfile?.email ?? user.email ?? null,
        name: userProfile?.name ?? null,
        avatarUrl: userProfile?.avatar_url ?? null,
      }
    : null;

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

