import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Search } from "lucide-react";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import { CategoryBrowser } from "@/components/startup/CategoryBrowser";
import { HomePageSearch } from "@/components/startup/HomePageSearch";
import { Navbar } from "@/components/layout/Navbar";
import { DiscoverySections } from "@/components/startup/DiscoverySections";
import { LeaderboardSection } from "@/components/startup/LeaderboardSection";

export const metadata = {
  title: "ProvenMRR - The #1 Verified Startup Revenue Database & Marketplace",
  description: "Browse verified MRR data from real startups. Connect Stripe, verify your revenue, and securely connect with buyers and investors on the most trusted SaaS marketplace.",
};

// Revalidate the homepage every 10 minutes to serve it instantly from cache
export const revalidate = 600;

function DiscoverySkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <section key={i} style={{ marginTop: "12px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", padding: "0 4px" }}>
            <div style={{ width: 150, height: 24, background: "rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <div style={{ width: 80, height: 32, background: "rgba(255,255,255,0.1)", borderRadius: 8 }} />
          </div>
          <div className="startups-grid">
            {[1, 2, 3].map((j) => (
              <div key={j} style={{ width: "100%", height: 160, background: "rgba(255,255,255,0.05)", borderRadius: 16 }} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function LeaderboardSkeleton() {
  return (
    <section style={{ marginTop: "56px" }}>
      <div style={{ marginBottom: "20px", padding: "0 4px" }}>
        <div style={{ width: 200, height: 24, background: "rgba(255,255,255,0.1)", borderRadius: 8 }} />
      </div>
      <div style={{ height: 400, background: "rgba(255,255,255,0.05)", borderRadius: 16 }} />
    </section>
  );
}

function CategoryBrowserSkeleton() {
  return (
    <section style={{ marginTop: "56px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 250, height: 28, background: "rgba(255,255,255,0.1)", borderRadius: 8, margin: "0 auto 12px" }} />
        <div style={{ width: 600, height: 16, background: "rgba(255,255,255,0.06)", borderRadius: 8, margin: "0 auto" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: 1120, margin: "0 auto", padding: "28px 24px" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} style={{ width: 140, height: 46, background: "rgba(255,255,255,0.08)", borderRadius: 100 }} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Navbar user={user} />

      <section className="page-container" style={{ paddingTop: 6 }}>
        <div
          className="glass"
          style={{
            padding: "14px 22px",
            position: "relative",
            overflow: "visible",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              background:
                "radial-gradient(circle at top left, rgba(125,162,255,0.18), transparent 22%), radial-gradient(circle at 78% 22%, rgba(244,114,182,0.12), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.2), transparent 56%)",
            }}
          />
          <div style={{ position: "relative", textAlign: "center", padding: "8px 6px 2px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div className="glass-pill" style={{ gap: 8, padding: "7px 13px", fontSize: 11 }}>
                <div className="site-logo-icon" style={{ height: 12 }}>
                  <img src="/logo-black.png" alt="" className="logo-dark" loading="lazy" />
                  <img src="/logo-white.png" alt="" className="logo-light" loading="lazy" />
                </div>
                Verified startup revenue, in one premium marketplace
              </div>
            </div>

            <h1
              style={{
                fontSize: "clamp(26px, 4.1vw, 46px)",
                fontWeight: 800,
                color: "var(--color-text)",
                letterSpacing: "-0.06em",
                lineHeight: 0.94,
                maxWidth: "1100px",
                margin: "0 auto 10px",
              }}
            >
              The marketplace for verified SaaS revenue.
            </h1>

            <p
              style={{
                color: "var(--color-secondary)",
                fontSize: "13px",
                fontWeight: 500,
                maxWidth: "520px",
                margin: "0 auto 14px",
                lineHeight: 1.35,
              }}
            >
              A private marketplace for founders and investors to discover verified revenue businesses with transparent metrics.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                maxWidth: "560px",
                margin: "0 auto 10px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <HomePageSearch />
              <FrictionlessAddWrapper />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
              {[
                { label: "Buy/sell", href: "/browse?filter=deals" },
                { label: "Stats", href: "/stats" },
                { label: "New", href: "/recent" },
                { label: "Co-founders", href: "/co-founders" },
              ].map((tag) => (
                <Link key={tag.label} href={tag.href} className="glass-pill" style={{ textDecoration: "none", fontWeight: 600, padding: "8px 14px", fontSize: 11 }}>
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="page-content" style={{ paddingTop: 0, marginTop: "-4px" }}>
        <Suspense fallback={<DiscoverySkeleton />}>
          <DiscoverySections />
        </Suspense>

        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardSection />
        </Suspense>

        <Suspense fallback={<CategoryBrowserSkeleton />}>
          <section style={{ marginTop: "56px" }}>
            <CategoryBrowser />
          </section>
        </Suspense>
      </div>
    </>
  );
}

// Separate component for data fetching to allow streaming (Suspense)
async function HomePageData() {
  const supabase = await createClient();
  const baseSelect = "id, name, slug, logo_url, category, description, x_handle, owner_id, claimed_by_user_id, is_listed_for_sale, asking_price, is_verified, is_anonymous, verified, created_at, sale_status_override, monthly_revenue, growth_rate, revenue_30d";

  const [
    { data: recentlyListedRaw },
    { data: bestDealsRaw },
    { data: fastestGrowingRaw },
    { data: leaderboardRaw }
  ] = await Promise.all([
    supabase.from("startups").select(baseSelect).order("created_at", { ascending: false }).limit(3),
    supabase.from("startups").select(baseSelect).filter("is_listed_for_sale", "eq", true).order("created_at", { ascending: false }).limit(3),
    supabase.from("startups").select(baseSelect).filter("is_verified", "eq", true).order("growth_rate", { ascending: false }).limit(3),
    supabase.from("startups").select(baseSelect).filter("is_verified", "eq", true).order("monthly_revenue", { ascending: false }).limit(10)
  ]);

  const allStartupsForStatus = [
    ...(recentlyListedRaw || []),
    ...(bestDealsRaw || []),
    ...(fastestGrowingRaw || []),
    ...(leaderboardRaw || [])
  ];

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

      <section style={{ marginTop: "56px" }}>
        <div style={{ marginBottom: "20px", padding: "0 4px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em" }}>
            Verified Leaderboard
          </h2>
        </div>
        <HomePageLeaderboard initialEntries={lbEntries} />
      </section>
    </>
  );
}
