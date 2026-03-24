import { createAdminClient } from "@/lib/supabase/server";
import { HomePageLeaderboard } from "./HomePageLeaderboard";
import { getSaleStatusMap } from "@/lib/startup-sale-status";

export async function LeaderboardSection() {
  const supabase = createAdminClient();
  const baseSelect = "id, name, slug, logo_url, category, description, x_handle, owner_id, claimed_by_user_id, is_listed_for_sale, asking_price, is_verified, is_anonymous, verified, created_at, sale_status_override, monthly_revenue, growth_rate, revenue_30d";

  // Fetch leaderboard
  const { data: leaderboardRaw } = await supabase
    .from("startups")
    .select(baseSelect)
    .filter("is_verified", "eq", true)
    .order("monthly_revenue", { ascending: false })
    .limit(10);

  const startupIds = (leaderboardRaw || []).map((s: any) => s.id);
  const overridesMap: Record<string, string | null> = {};
  for (const s of leaderboardRaw || []) {
    overridesMap[(s as any).id] = (s as any).sale_status_override ?? null;
  }
  const saleStatusMap = await getSaleStatusMap(startupIds, overridesMap);

  const founderIds = Array.from(
    new Set(
      (leaderboardRaw || [])
        .flatMap((s: any) => [s.claimed_by_user_id, s.owner_id])
        .filter(Boolean)
    )
  );

  const founderMap = new Map();
  if (founderIds.length > 0) {
    const { data: founderProfiles } = await supabase
      .from("users")
      .select("id, name, x_handle, avatar_url")
      .in("id", founderIds);

    for (const p of founderProfiles || []) {
      founderMap.set(p.id, p);
    }
  }

  const prepareStartup = (s: any) => ({
    ...s,
    sale_status: s.sale_status_override === "sold" ? "sold" : (s.is_listed_for_sale ? (saleStatusMap.get(s.id) ?? "sale") : null),
    snap: {
      mrr: s.monthly_revenue || 0,
      arr: (s.monthly_revenue || 0) * 12 || (s.revenue_30d || 0) * 12,
      growth_rate: s.growth_rate || 0,
      all_time_revenue: s.revenue_30d || 0,
      snapshot_date: s.created_at
    }
  });

  const lbEntries = (leaderboardRaw || []).map((s) => {
    const p = prepareStartup(s);
    const founderProfile = founderMap.get(s.claimed_by_user_id || s.owner_id);
    return {
      startup_id: s.id,
      startups: {
        ...p,
        founder_name: founderProfile?.name || null,
        founder_handle: founderProfile?.x_handle || s.x_handle || null,
        founder_avatar_url: founderProfile?.avatar_url || null,
      },
      mrr: p.snap.mrr,
      arr: p.snap.arr,
      growth_rate: p.snap.growth_rate,
      all_time: p.snap.all_time_revenue,
      is_anonymous: s.is_anonymous,
      asking_price: s.asking_price
    };
  });

  return (
    <section style={{ marginTop: "56px" }}>
      <div style={{ marginBottom: "20px", padding: "0 4px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
          Verified Leaderboard
        </h2>
      </div>
      <HomePageLeaderboard initialEntries={lbEntries} />
    </section>
  );
}
