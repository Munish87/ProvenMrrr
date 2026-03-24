import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Search, Plus, MapPin, Calendar, Building2 } from "lucide-react";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";
import { Navbar } from "@/components/layout/Navbar";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Find a Co-founder — ProvenMRR",
    description: "Discover founders actively searching for a co-founder.",
};

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString('en-US')}k`;
    return `$${n.toLocaleString('en-US')}`;
}

export default async function CoFoundersPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams;
    const rawQ = searchParams.q;
    const query = (typeof rawQ === "string" ? rawQ : (Array.isArray(rawQ) ? rawQ[0] : "")).toLowerCase();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch startups looking for a co-founder
    const { data: allStartups } = await supabase
        .from("startups")
        .select("id, name, description, category, is_verified, verified, looking_for_cofounder, claimed_by_user_id, x_handle, logo_url")
        .eq("looking_for_cofounder", true)
        .eq("is_anonymous", false)
        .order("created_at", { ascending: false })
        .returns<{ id: string; name: string; description: string | null; category: string | null; is_verified: boolean; verified: boolean; looking_for_cofounder: boolean; claimed_by_user_id: string | null; x_handle: string | null; logo_url: string | null }[]>();

    // Filter by search query if exists
    let startups = allStartups || [];
    if (query) {
        startups = startups.filter(s =>
            s.name.toLowerCase().includes(query) ||
            (s.description?.toLowerCase().includes(query)) ||
            (s.category?.toLowerCase().includes(query))
        );
    }

    // Get Revenue Data
    const startupIds = startups.map(s => s.id);
    let snapMap = new Map();
    if (startupIds.length > 0) {
        const { data: snaps } = await supabase
            .from("revenue_snapshots")
            .select("startup_id, mrr, all_time_revenue")
            .in("startup_id", startupIds)
            .order("snapshot_date", { ascending: false })
            .returns<{ startup_id: string; mrr: number; all_time_revenue: number }[]>();

        if (snaps) {
            for (const s of snaps) {
                if (!snapMap.has(s.startup_id)) {
                    snapMap.set(s.startup_id, s);
                }
            }
        }
    }

    // Get Founder Users
    const userIds = [...new Set(startups.map(s => s.claimed_by_user_id).filter(Boolean))] as string[];
    let userMap = new Map();
    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from("users")
            .select("id, name, x_handle")
            .in("id", userIds)
            .returns<{ id: string; name: string | null; x_handle: string | null }[]>();

        if (users) {
            for (const u of users) {
                userMap.set(u.id, u);
            }
        }
    }

    // 3. (OPTIMIZED) Merge local data without external fetches
    const enhancedStartups = startups.map((startup) => {
        const ownerProfile = startup.claimed_by_user_id ? userMap.get(startup.claimed_by_user_id) : null;
        const resolvedXHandle = ownerProfile?.x_handle || startup.x_handle;
        const resolvedFounderName = ownerProfile?.name;

        const snap = snapMap.get(startup.id);

        return {
            ...startup,
            founderName: resolvedFounderName || (resolvedXHandle ? `@${resolvedXHandle.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//, "").replace("@", "")}` : "Founder"),
            founderAvatar: null, // We could add a system-avatar logic here if needed
            mrr: snap?.mrr ?? 0,
            totalRevenue: snap?.all_time_revenue ?? 0,
        };
    });

    return (
        <>
            <Navbar user={user} />

            <div style={{ padding: "84px 24px 72px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 48, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.03em", marginBottom: 24, lineHeight: 1.1 }}>
                        Find the Right Co-Founder for Your Startup
                    </h1>

                    <p style={{ fontSize: 18, color: "var(--color-secondary)", lineHeight: 1.6, marginBottom: 24, maxWidth: 700, margin: "0 auto 24px auto", fontWeight: 500 }}>
                        Explore startups actively searching for partners. Connect with builders, collaborate on ideas and launch something great together.
                    </p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: 13, color: "var(--color-secondary)", fontWeight: 500, border: "1px solid var(--color-border)", background: "var(--color-surface)", borderRadius: 999, backdropFilter: "blur(22px)", boxShadow: "var(--shadow-card)" }}>
                        Looking to find a co-founder? Access your <Link href="/dashboard/startups" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 700 }}>dashboard</Link> to enable this.
                    </div>
                </div>

                {/* Search Bar Section */}
                <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "stretch", maxWidth: 660, margin: "0 auto 44px" }}>
                    <form style={{ flex: 1, position: "relative" }} method="GET" action="/co-founders">
                        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 56, background: "var(--search-box-bg)", border: "1px solid var(--search-box-border)", borderRadius: 999, backdropFilter: "blur(22px)", boxShadow: "var(--search-box-shadow)" }}>
                            <Search size={20} color="var(--color-secondary)" style={{ flexShrink: 0, opacity: 0.7 }} />
                            <input
                                name="q"
                                type="text"
                                defaultValue={query}
                                placeholder="Search by niche, revenue, or tech stack..."
                                style={{
                                    width: "100%",
                                    padding: "0 16px",
                                    background: "none",
                                    border: "none",
                                    fontSize: 16,
                                    outline: "none",
                                    color: "var(--color-text)",
                                    fontWeight: 500
                                }}
                            />
                        </div>
                    </form>
                    <FrictionlessAddWrapper
                        text="Add startup"
                        className="btn btn-primary"
                        style={{ height: 56, padding: "0 28px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    />
                </div>

                {/* Grid */}
                {enhancedStartups.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "80px 40px", background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ background: "var(--color-surface-strong)", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "1px solid var(--color-border)" }}>
                            <Search size={32} color="var(--color-secondary)" style={{ opacity: 0.55 }} />
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>No startups found yet</h3>
                        <p style={{ color: "var(--color-secondary)", fontSize: 16, opacity: 0.72 }}>Try another search or check back soon as new founders join the network.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24, textAlign: "left" }}>
                        {enhancedStartups.map(s => {
                            const isOwnStartup = s.claimed_by_user_id === user?.id;
                            return (
                                <div key={s.id} className="card card-hover" style={{ padding: 32, display: "flex", flexDirection: "column", height: "100%", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                                    {/* Top Header */}
                                    <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
                                        <div style={{ width: 56, height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
                                            {s.logo_url ? (
                                                <img 
                                                    src={s.logo_url} 
                                                    alt={s.name} 
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                                />
                                            ) : (
                                                <span style={{ fontSize: 24, fontWeight: 700 }}>{s.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <Link href={`/startup/${s.id}`} style={{ textDecoration: "none" }}>
                                                <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.01em", marginBottom: 6 }}>
                                                    {s.name}
                                                </h3>
                                            </Link>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", color: "var(--color-secondary)", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", borderRadius: "6px" }}>{s.category || "SaaS"}</span>
                                                {s.verified && <span style={{ color: "#10B981", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                                                    VERIFIED
                                                </span>}
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: 15, color: "var(--color-secondary)", lineHeight: 1.6, marginBottom: 32, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", fontWeight: 500 }}>
                                        {s.description || "Building the future of digital commerce. Join us as a co-founder to lead growth and operations."}
                                    </p>

                                    <div style={{ flex: 1 }} />

                                    {/* Metrics & Founder */}
                                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 24 }}>
                                        <div style={{ display: "flex", marginBottom: 24 }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Total Revenue</p>
                                                <p style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{fmtMoney(s.totalRevenue)}</p>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Verified MRR</p>
                                                <p style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{fmtMoney(s.mrr)}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                {s.founderAvatar ? (
                                                    <img src={s.founderAvatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-border)" }} />
                                                ) : (
                                                    <div style={{ width: 32, height: 32, fontSize: 14, background: "var(--color-surface-strong)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--color-secondary)" }}>
                                                        {s.founderName.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Founder</p>
                                                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{s.founderName}</p>
                                                </div>
                                            </div>
                                            {isOwnStartup ? (
                                                <span style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", border: "1px solid var(--color-border)", background: "var(--color-surface)", borderRadius: "20px" }}>
                                                    Your startup
                                                </span>
                                            ) : (
                                                <Link
                                                    href={`/co-founders/connect?startupId=${s.id}`}
                                                    style={{ 
                                                        padding: "8px 18px", 
                                                        fontSize: 12, 
                                                        fontWeight: 800, 
                                                        color: "#FFFFFF", 
                                                        background: "var(--color-accent)", 
                                                        borderRadius: "20px", 
                                                        textDecoration: "none",
                                                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                    className="btn-hover"
                                                >
                                                    Connect
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
