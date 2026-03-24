import { Navbar } from "@/components/layout/Navbar";
import { FounderCommunityPage } from "@/components/community/FounderCommunityPage";
import { createAdminClient } from "@/lib/supabase/server";

// Cache for 2 minutes — counts don't need to be real-time
export const revalidate = 120;

export const metadata = {
  title: "Founder Community - ProvenMRR",
  description: "Build in public, discuss tactics, and learn from other founders inside ProvenMRR.",
};

export default async function CommunityPage() {
  const supabase = createAdminClient();

  // Fetch real-time counts (user identity handled on client)
  const [{ count: totalFounders }, { count: totalStartups }] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
  ]);
  
  const userStartups: string[] = [];

  return (
    <>
      <Navbar user={null} />
      <FounderCommunityPage
        totalFounders={totalFounders ?? 0}
        totalStartups={totalStartups ?? 0}
        userStartups={[]}
        currentUser={null}
      />
    </>
  );
}

