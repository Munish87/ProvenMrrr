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
