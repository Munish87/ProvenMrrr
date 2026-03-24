import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomePageFeed } from "./HomePageFeed";
import { getSaleStatusMap } from "@/lib/startup-sale-status";

export async function DiscoverySections() {
  const supabase = await createClient();
  const baseSelect = "id, name, slug, logo_url, category, description, x_handle, owner_id, claimed_by_user_id, is_listed_for_sale, asking_price, is_verified, is_anonymous, verified, created_at, sale_status_override, monthly_revenue, growth_rate, revenue_30d";

  // Fetch targeted sections
  const [
    { data: recentlyListedRaw },
    { data: bestDealsRaw },
    { data: fastestGrowingRaw }
  ] = await Promise.all([
    supabase.from("startups").select(baseSelect).order("created_at", { ascending: false }).limit(3),
    supabase.from("startups").select(baseSelect).filter("is_listed_for_sale", "eq", true).order("created_at", { ascending: false }).limit(3),
    supabase.from("startups").select(baseSelect).filter("is_verified", "eq", true).order("growth_rate", { ascending: false }).limit(3),
  ]);

  const allStartupsForStatus = [
    ...(recentlyListedRaw || []),
    ...(bestDealsRaw || []),
    ...(fastestGrowingRaw || [])
  ];

  const startupIds = Array.from(new Set(allStartupsForStatus.map((s: any) => s.id)));
  const overridesMap: Record<string, string | null> = {};
  for (const s of allStartupsForStatus) {
    overridesMap[(s as any).id] = (s as any).sale_status_override ?? null;
  }
  const saleStatusMap = await getSaleStatusMap(startupIds, overridesMap);

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

  const recentlyListed = (recentlyListedRaw || []).map(prepareStartup);
  const bestDeals = (bestDealsRaw || []).map(prepareStartup);
  const fastestGrowing = (fastestGrowingRaw || []).map(prepareStartup);

  const discoverySections = [
    { title: "Recently listed", data: recentlyListed, link: "/browse?filter=recent" },
    { title: "Best deals this week", data: bestDeals, link: "/browse?filter=deals" },
    { title: "Fastest growing", data: fastestGrowing, link: "/browse?filter=growth" },
  ];

  return (
    <>
      {discoverySections.map((section) => (
        <section key={section.title} style={{ marginTop: "12px", marginBottom: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "0 4px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              {section.title}
            </h2>
            <Link
              href={section.link}
              className="glass-pill"
              style={{ fontSize: "13px", color: "var(--color-secondary)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", padding: "8px 14px" }}
            >
              View all &rarr;
            </Link>
          </div>
          <HomePageFeed
            sectionTitle={section.title}
            initialData={section.data}
          />
        </section>
      ))}
    </>
  );
}
