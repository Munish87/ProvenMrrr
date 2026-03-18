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
  title: "ProvenMRR - The database of verified startup revenues",
  description: "Connect Stripe. Verify MRR. Get an AI Health Score.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch ALL startups using pagination to exceed Supabase's 1,000 limit
  let allStartups: any[] = [];
  let lastId = null;
  while (true) {
    let query = supabase
      .from("startups")
      .select("id, name, logo_url, category, description, x_handle, owner_id, claimed_by_user_id, is_listed_for_sale, asking_price, is_verified, is_anonymous, verified, created_at, sale_status_override")
      .order("id");

    if (lastId) query = query.gt("id", lastId);

    const { data, error } = await query.limit(1000).returns<any[]>();
    if (error || !data || data.length === 0) break;

    allStartups = [...allStartups, ...data];
    lastId = data[data.length - 1].id;
    if (data.length < 1000) break;
  }

  const founderIds = Array.from(
    new Set(
      allStartups
        .flatMap((startup: any) => [startup.claimed_by_user_id, startup.owner_id])
        .filter(Boolean)
    )
  );

  // 2. Fetch profiles in batches to handle many IDs
  const founderMap = new Map();
  const PROFILE_BATCH_SIZE = 500;
  for (let i = 0; i < founderIds.length; i += PROFILE_BATCH_SIZE) {
    const chunk = founderIds.slice(i, i + PROFILE_BATCH_SIZE);
    const { data: founderProfiles } = await supabase
      .from("users")
      .select("id, name, x_handle, avatar_url")
      .in("id", chunk);

    for (const p of founderProfiles || []) {
      founderMap.set(p.id, p);
    }
  }

  // 3. Fetch snapshots using pagination
  const snapMap = new Map();
  let lastSnapId = null;
  while (true) {
    let query = supabase
      .from("revenue_snapshots")
      .select("id, startup_id, mrr, arr, growth_rate, all_time_revenue, snapshot_date")
      .order("id");

    if (lastSnapId) query = query.gt("id", lastSnapId);

    const { data, error } = await query.limit(1000).returns<any[]>();
    if (error || !data || data.length === 0) break;

    for (const s of data) {
      if (!snapMap.has(s.startup_id)) {
        snapMap.set(s.startup_id, s);
      }
    }

    lastSnapId = data[data.length - 1].id;
    if (data.length < 1000) break;
  }

  const startups: any[] = allStartups;
  const saleStatusMap = await getSaleStatusMap(startups.map(s => s.id));

  const startupsWithSaleStatus = startups.map((startup) => ({
    ...startup,
    sale_status: startup.sale_status_override === "sold" ? "sold" : (startup.is_listed_for_sale ? (saleStatusMap.get(startup.id) ?? "sale") : null),
  }));

  const recentlyListed = [...startupsWithSaleStatus]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const bestDeals = [...startupsWithSaleStatus]
    .filter((s) => s.is_listed_for_sale && snapMap.get(s.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const fastestGrowing = [...startupsWithSaleStatus]
    .filter((s) => s.verified && snapMap.get(s.id))
    .sort((a, b) => {
      const snapA = snapMap.get(a.id);
      const snapB = snapMap.get(b.id);
      return (snapB?.growth_rate || 0) - (snapA?.growth_rate || 0);
    })
    .slice(0, 3);

  const discoverySections = [
    { title: "Recently listed", data: recentlyListed, link: "/browse?filter=recent" },
    { title: "Best deals this week", data: bestDeals, link: "/browse?filter=deals" },
    { title: "Fastest growing", data: fastestGrowing, link: "/browse?filter=growth" },
  ];

  const lbEntries = startupsWithSaleStatus
    .filter((s) => s.verified && snapMap.get(s.id))
    .map((s) => {
      const founderProfile = founderMap.get(s.claimed_by_user_id || s.owner_id);
      return {
        startup_id: s.id,
        startups: {
          ...s,
          founder_name: founderProfile?.name || null,
          founder_handle: founderProfile?.x_handle || s.x_handle || null,
          founder_avatar_url: founderProfile?.avatar_url || null,
        },
        mrr: snapMap.get(s.id).mrr,
        arr: snapMap.get(s.id).all_time_revenue,
        growth_rate: snapMap.get(s.id).growth_rate,
        all_time: snapMap.get(s.id).all_time_revenue,
        is_anonymous: s.is_anonymous,
        asking_price: s.asking_price
      };
    });

  return (
    <>
      <Navbar user={user} />

      <section className="page-container" style={{ paddingTop: 6 }}>
        <div
          className="glass"
          style={{
            padding: "14px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top left, rgba(125,162,255,0.18), transparent 22%), radial-gradient(circle at 78% 22%, rgba(244,114,182,0.12), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.2), transparent 56%)",
            }}
          />
          <div style={{ position: "relative", textAlign: "center", padding: "8px 6px 2px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div className="glass-pill" style={{ gap: 8, padding: "7px 13px", fontSize: 11 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#7da2ff",
                    boxShadow: "0 0 0 5px rgba(125,162,255,0.12)",
                  }}
                />
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
              <div className="search-box" style={{ flex: "1 1 340px", minWidth: 260 }}>
                <Search size={16} color="var(--color-secondary)" />
                <input type="text" placeholder='e.g. "SaaS over $10K/mo"' />
              </div>
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
              snapMapData={Object.fromEntries(snapMap)}
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

        <section style={{ marginTop: "56px" }}>
          <CategoryBrowser />
        </section>
      </div>
    </>
  );
}
