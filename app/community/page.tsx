import { Navbar } from "@/components/layout/Navbar";
import { FounderCommunityPage } from "@/components/community/FounderCommunityPage";
import { createClient } from "@/lib/supabase/server";

// Cache for 2 minutes — counts don't need to be real-time
export const revalidate = 120;

export const metadata = {
  title: "Founder Community - ProvenMRR",
  description: "Build in public, discuss tactics, and learn from other founders inside ProvenMRR.",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile and real-time counts
  const [{ data: profile }, { count: totalFounders }, { count: totalStartups }, userStartupsData] = await Promise.all([
    user ? supabase.from("users").select("name, avatar_url").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    user ? supabase.from("startups").select("name").eq("owner_id", user.id) : Promise.resolve({ data: [] }),
  ]);
  
  const userStartups = userStartupsData?.data?.map(s => s.name) || [];

  return (
    <>
      <Navbar user={user} />
      <FounderCommunityPage
        totalFounders={totalFounders ?? 0}
        totalStartups={totalStartups ?? 0}
        userStartups={userStartups}
        currentUser={
          user
            ? {
                id: user.id,
                email: user.email ?? null,
                name: (profile as { name?: string } | null)?.name ?? (user.user_metadata as { full_name?: string } | null)?.full_name ?? null,
                avatarUrl: (profile as { avatar_url?: string } | null)?.avatar_url ?? (user.user_metadata as { avatar_url?: string } | null)?.avatar_url ?? null,
              }
            : null
        }
      />
    </>
  );
}

