import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Search } from "lucide-react";
import { StartupDiscoveryCard } from "@/components/startup/StartupDiscoveryCard";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import { HomePageFeed } from "@/components/startup/HomePageFeed";
import { HomePageLeaderboard } from "@/components/startup/HomePageLeaderboard";

export const metadata = {
  title: "Vetra — The database of verified startup revenues",
  description: "Connect Stripe. Verify MRR. Get an AI Health Score.",
};

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString("en-US")}k`;
  return `$${n.toLocaleString("en-US")}`;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: allStartups } = await supabase
    .from("startups")
    .select("id, name, logo_url, category, description, is_listed_for_sale, is_verified, is_anonymous, verified, created_at");

  const { data: snaps } = await supabase
    .from("revenue_snapshots")
    .select("startup_id, mrr, growth_rate, all_time_revenue")
    .order("snapshot_date", { ascending: false });

  const snapList: any[] = snaps || [];
  const snapMap = new Map();
  for (const s of snapList) {
    if (!snapMap.has(s.startup_id)) {
      snapMap.set(s.startup_id, s);
    }
  }

  const startups: any[] = allStartups || [];

  const recentlyListed = [...startups]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  const bestDeals = [...startups]
    .filter((s) => s.is_listed_for_sale && snapMap.get(s.id))
    .sort((a, b) => {
      const snapA = snapMap.get(a.id);
      const snapB = snapMap.get(b.id);
      const valA = snapA ? snapA.mrr : 0;
      const valB = snapB ? snapB.mrr : 0;
      return valB - valA; // Standard sort by highest MRR to stabilize view
    })
    .slice(0, 4);

  const fastestGrowing = [...startups]
    .filter((s) => s.verified && snapMap.get(s.id))
    .sort((a, b) => {
      const snapA = snapMap.get(a.id);
      const snapB = snapMap.get(b.id);
      return (snapB?.growth_rate || 0) - (snapA?.growth_rate || 0);
    })
    .slice(0, 4);

  const discoverySections = [
    { title: "Recently listed", data: recentlyListed, link: "/browse?filter=recent" },
    { title: "Best deals this week", data: bestDeals, link: "/browse?filter=deals" },
    { title: "Fastest growing", data: fastestGrowing, link: "/browse?filter=growth" },
  ];

  const lbEntries = startups
    .filter((s) => s.verified && snapMap.get(s.id))
    .map((s) => ({
      startup_id: s.id,
      startups: s,
      mrr: snapMap.get(s.id).mrr,
      growth_rate: snapMap.get(s.id).growth_rate,
      all_time: snapMap.get(s.id).all_time_revenue,
      is_anonymous: s.is_anonymous,
    }));

  return (
    <>
      <header className="page-header">
        <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: "var(--color-text)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: "#6366F1", borderRadius: "50%" }} />
              Vetra
            </Link>
            <nav style={{ display: "flex", gap: 24 }}>
              <Link href="/browse" className="nav-link">Browse</Link>
              <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
              <Link href="/co-founders" className="nav-link">Co-founders</Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!user ? (
              <>
                <Link href="/login" className="nav-link">Sign in</Link>
                <Link href="/login" className="btn btn-secondary btn-sm">Sign up</Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="nav-link">Dashboard</Link>
                <form action="/auth/signout" method="POST">
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ background: "transparent", border: "1px solid var(--color-border)", cursor: "pointer" }}>
                    Sign out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ textAlign: "center", padding: "72px 24px 24px" }}>
        <h1 style={{
          fontSize: 34,
          fontWeight: 800,
          color: "var(--color-text)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          maxWidth: 800,
          margin: "0 auto 16px"
        }}>
          The database of verified startup revenues
        </h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 16, maxWidth: 460, margin: "0 auto 32px" }}>
          Browse verified MRR data from real startups. Connect Stripe, get your AI Health Score.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 540, margin: "0 auto 24px" }}>
          <form action="/browse" method="GET" className="search-box" style={{ flex: 1, display: "flex", alignItems: "center", background: "white", padding: "0 12px", borderRadius: 8, border: "1px solid var(--color-border)" }}>
            <Search size={16} color="var(--color-secondary)" />
            <input name="q" placeholder='e.g. "SaaS over $10K/mo"' style={{ border: "none", outline: "none", padding: "10px", width: "100%", fontSize: 14 }} />
          </form>
          <FrictionlessAddWrapper />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {["Buy/sell", "Stats", "New", "Co-founders"].map((pill) => {
            let targetPath = "/browse";
            if (pill === "Stats") targetPath = "/stats";
            if (pill === "New") targetPath = "/recent";
            if (pill === "Buy/sell") targetPath = "/browse?filter=deals";

            return (
              <Link key={pill} href={targetPath} className="nav-pill" style={{ fontSize: 13 }}>{pill}</Link>
            )
          })}
        </div>
      </section>

      {/* ── DISCOVERY SECTIONS ── */}
      <div className="page-content" style={{ paddingTop: 0 }}>
        {discoverySections.map((section) => (
          <section key={section.title} style={{ marginTop: 18, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", margin: 0 }}>{section.title}</h2>
              <Link href={section.link} style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, textDecoration: "none" }}>
                View all →
              </Link>
            </div>
            <HomePageFeed
              sectionTitle={section.title}
              initialData={section.data}
              snapMapData={Object.fromEntries(snapMap)}
            />
          </section>
        ))}

        {/* ── LEADERBOARD PREVIEW ── */}
        <HomePageLeaderboard initialEntries={lbEntries} />
      </div>
    </>
  );
}
