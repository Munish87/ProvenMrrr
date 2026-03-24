import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Search } from "lucide-react";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import { HomePageFeed } from "@/components/startup/HomePageFeed";
import { HomePageLeaderboard } from "@/components/startup/HomePageLeaderboard";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { Navbar } from "@/components/layout/Navbar";
import { getSaleStatusMap } from "@/lib/startup-sale-status";

export const metadata = {
  title: "ProvenMRR - The #1 Verified Startup Revenue Database & Marketplace",
  description: "Browse verified MRR data from real startups. Connect Stripe, verify your revenue, and securely connect with buyers and investors on the most trusted SaaS marketplace.",
};

// Revalidate the homepage every 10 minutes
export const revalidate = 600;

export default async function MobileHomePage() {
  const supabase = await createClient();
  const baseSelect = "id, name, slug, logo_url, category, description, x_handle, owner_id, claimed_by_user_id, is_listed_for_sale, asking_price, is_verified, is_anonymous, verified, created_at, sale_status_override, monthly_revenue, growth_rate, revenue_30d";

  // 1. Fetch targeted sections and user in parallel
  const [
    { data: { user } },
    { data: recentlyListedRaw },
    { data: bestDealsRaw },
    { data: fastestGrowingRaw },
    { data: leaderboardRaw }
  ] = await Promise.all([
    supabase.auth.getUser(),
    // Recently listed
    supabase.from("startups").select(baseSelect).order("created_at", { ascending: false }).limit(3),
    // Best deals (listed for sale)
    supabase.from("startups").select(baseSelect).filter("is_listed_for_sale", "eq", true).order("created_at", { ascending: false }).limit(3),
    // Fastest growing (verified) - using growth_rate column
    supabase.from("startups").select(baseSelect).filter("is_verified", "eq", true).order("growth_rate", { ascending: false }).limit(3),
    // Leaderboard (top verified MRR)
    supabase.from("startups").select(baseSelect).filter("is_verified", "eq", true).order("monthly_revenue", { ascending: false }).limit(10)
  ]);

  const allStartupsForStatus = [
    ...(recentlyListedRaw || []),
    ...(bestDealsRaw || []),
    ...(fastestGrowingRaw || []),
    ...(leaderboardRaw || [])
  ];

  // 2. Build overrides and fetch status
  const startupIds = Array.from(new Set(allStartupsForStatus.map((s: any) => s.id)));
  const overridesMap: Record<string, string | null> = {};
  for (const s of allStartupsForStatus) {
    overridesMap[(s as any).id] = (s as any).sale_status_override ?? null;
  }
  const saleStatusMap = await getSaleStatusMap(startupIds, overridesMap);

  const founderIds = Array.from(
    new Set(
      allStartupsForStatus
        .flatMap((s: any) => [s.claimed_by_user_id, s.owner_id])
        .filter(Boolean)
    )
  );

  // 3. Fetch only required founder profiles
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

  const recentlyListed = (recentlyListedRaw || []).map(prepareStartup);
  const bestDeals = (bestDealsRaw || []).map(prepareStartup);
  const fastestGrowing = (fastestGrowingRaw || []).map(prepareStartup);

  const discoverySections = [
    { title: "Recently listed", data: recentlyListed, link: "/browse?filter=recent" },
    { title: "Best deals this week", data: bestDeals, link: "/browse?filter=deals" },
    { title: "Fastest growing", data: fastestGrowing, link: "/browse?filter=growth" },
  ];

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
    <>
      {/* Navbar on mobile is typically fine as is if it's responsive, otherwise consider mobile Navbar */}
      <Navbar user={user} />

      {/* Main container optimized for mobile screens */}
      <section className="page-container" style={{ padding: "16px 12px 0 12px" }}>
        <div
          className="glass"
          style={{
            padding: "24px 16px",
            position: "relative",
            overflow: "hidden",
            borderRadius: "16px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(125,162,255,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(244,114,182,0.1), transparent 40%)",
            }}
          />
          <div style={{ position: "relative", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Top pill optimized for mobile width */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div className="glass-pill" style={{ gap: 6, padding: "8px 12px", fontSize: 10, maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <div className="site-logo-icon" style={{ height: 10 }}>
                  <img src="/logo-black.png" alt="" className="logo-dark" />
                  <img src="/logo-white.png" alt="" className="logo-light" />
                </div>
                The verified SaaS marketplace
              </div>
            </div>

            <h1
              style={{
                fontSize: "clamp(28px, 9vw, 36px)",
                fontWeight: 800,
                color: "var(--color-text)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                margin: "0",
              }}
            >
              Verified SaaS revenue.
            </h1>

            <p
              style={{
                color: "var(--color-secondary)",
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: 1.4,
                margin: "0",
              }}
            >
              A private marketplace for founders and investors to discover verified revenue businesses.
            </p>

            {/* Mobile optimized stacked actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
              <div className="search-box" style={{ width: "100%" }}>
                <Search size={16} color="var(--color-secondary)" />
                <input type="text" placeholder='e.g. "SaaS over $10K/mo"' style={{ width: "100%", fontSize: "14px" }} />
              </div>
              <div style={{ width: "100%" }}>
                <FrictionlessAddWrapper />
              </div>
            </div>

            {/* Tags wrapping nicely on mobile */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
              {[
                { label: "Buy/sell", href: "/browse?filter=deals" },
                { label: "Stats", href: "/stats" },
                { label: "New", href: "/recent" },
                { label: "Co-founders", href: "/co-founders" },
              ].map((tag) => (
                <Link key={tag.label} href={tag.href} className="glass-pill" style={{ textDecoration: "none", fontWeight: 600, padding: "8px 12px", fontSize: 11, flex: "1 1 auto", textAlign: "center", justifyContent: "center" }}>
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Discovery sections with optimized mobile padding */}
      <div className="page-content" style={{ paddingTop: 0, marginTop: "24px" }}>
        {discoverySections.map((section) => (
          <section key={section.title} style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "0 12px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
                {section.title}
              </h2>
              <Link
                href={section.link}
                className="glass-pill"
                style={{ fontSize: "12px", color: "var(--color-secondary)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px" }}
              >
                View all &rarr;
              </Link>
            </div>
            
            {/* To ensure native swipe on mobile, HomePageFeed usually works if it has a grid. On mobile it might just wrap or scroll horizontally mapping. */}
            <HomePageFeed
              sectionTitle={section.title}
              initialData={section.data}
            />
          </section>
        ))}

        <section style={{ marginTop: "40px" }}>
          <div style={{ marginBottom: "16px", padding: "0 12px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Verified Leaderboard
            </h2>
          </div>
          <HomePageLeaderboard initialEntries={lbEntries} />
        </section>

        <section style={{ marginTop: "40px", marginBottom: "40px" }}>
          <CategoryBrowser />
        </section>
      </div>
    </>
  );
}
