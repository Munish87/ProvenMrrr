import { Navbar } from "@/components/layout/Navbar";
import { FounderCommunityPage } from "@/components/community/FounderCommunityPage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  const [{ data: profile }, { count: totalFounders }, { count: totalStartups }] = await Promise.all([
    user ? supabase.from("users").select("name, avatar_url").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
  ]);

  return (
    <>
      <Navbar user={user} />
      <FounderCommunityPage
        totalFounders={totalFounders ?? 0}
        totalStartups={totalStartups ?? 0}
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

