import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Search, Plus } from "lucide-react";
import { FrictionlessAddWrapper } from "@/components/startup/FrictionlessAddWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Find a Co-founder — Vetra",
    description: "Discover founders actively searching for a co-founder.",
};

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString('en-US')}k`;
    return `$${n.toLocaleString('en-US')}`;
}

export default async function CoFoundersPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams;
    const query = searchParams.q?.toLowerCase() || "";

    const supabase = await createClient();

    // Fetch startups looking for a co-founder
    const { data: allStartups } = await supabase
        .from("startups")
        .select("id, name, description, category, is_verified, verified, looking_for_cofounder, claimed_by_user_id, x_handle")
        .eq("looking_for_cofounder", true)
        .eq("is_anonymous", false)
        .order("created_at", { ascending: false })
        .returns<{ id: string; name: string; description: string | null; category: string | null; is_verified: boolean; verified: boolean; looking_for_cofounder: boolean; claimed_by_user_id: string | null; x_handle: string | null }[]>();

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
    const userIds = [...new Set(startups.map(s => s.claimed_by_user_id).filter(Boolean))];
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

    // Fetch X Data in parallel
    const enhancedStartups = await Promise.all(startups.map(async (startup) => {
        const ownerProfile = startup.claimed_by_user_id ? userMap.get(startup.claimed_by_user_id) : null;
        const resolvedXHandle = ownerProfile?.x_handle || startup.x_handle;
        const resolvedFounderName = ownerProfile?.name;

        let xData: { name?: string; avatar_url?: string } | null = null;
        if (resolvedXHandle) {
            const cleanXHandle = resolvedXHandle.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//, "").replace("@", "");
            try {
                const res = await fetch(`https://api.fxtwitter.com/${cleanXHandle}`, { next: { revalidate: 3600 } });
                if (res.ok) {
                    const json = await res.json();
                    if (json.code === 200 && json.user) {
                        xData = {
                            name: json.user.name,
                            avatar_url: json.user.avatar_url,
                        };
                    }
                }
            } catch (e) {
                // Ignore silent fetch failures
            }
        }

        const snap = snapMap.get(startup.id);

        return {
            ...startup,
            founderName: resolvedFounderName || xData?.name || (resolvedXHandle ? `@${resolvedXHandle.replace(/^https?:\/\/(www\.)?(x\.com|twitter\.com)\//, "").replace("@", "")}` : "Founder"),
            founderAvatar: xData?.avatar_url,
            mrr: snap?.mrr ?? 0,
            totalRevenue: snap?.all_time_revenue ?? 0,
        };
    }));

    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
            {/* Header Area */}
            <div style={{ padding: "80px 24px 64px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
                    <Link href="/" className="site-logo" style={{ textDecoration: "none" }}>
                        <span className="site-logo-dot" />
                        Vetra
                    </Link>
                </div>

                <h1 style={{ fontSize: 42, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-1px", marginBottom: 24, lineHeight: 1.2 }}>
                    Startups Looking for a Co-founder
                </h1>

                <p style={{ fontSize: 16, color: "var(--color-secondary)", lineHeight: 1.6, marginBottom: 40, maxWidth: 640, margin: "0 auto 40px auto" }}>
                    Discover founders actively searching for a co-founder. Outreach is moderated by AI, then relayed directly by email. It's 100% free to use.
                </p>

                <p style={{ fontSize: 14, color: "var(--color-secondary)", marginBottom: 32, fontStyle: "italic" }}>
                    Looking for a co-founder? Go to your startup <Link href="/dashboard/startups" style={{ color: "var(--color-text)", textDecoration: "underline", fontWeight: 600 }}>dashboard</Link> to activate this option.
                </p>

                {/* Search Bar */}
                <div style={{ display: "flex", gap: 16, justifyContent: "center", maxWidth: 600, margin: "0 auto" }}>
                    <form style={{ flex: 1, position: "relative" }} method="GET" action="/co-founders">
                        <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--color-secondary)" }} />
                        <input
                            name="q"
                            type="text"
                            defaultValue={query}
                            placeholder="&quot;SaaS over $10K/mo&quot;"
                            style={{
                                width: "100%",
                                padding: "14px 16px 14px 44px",
                                borderRadius: 12,
                                border: "1px solid var(--color-border)",
                                fontSize: 15,
                                outline: "none",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                            }}
                        />
                    </form>
                    <FrictionlessAddWrapper
                        text="Add startup"
                        className=""
                        style={{
                            backgroundColor: "#111827",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            padding: "12px 24px",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            textDecoration: "none",
                            whiteSpace: "nowrap"
                        }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="page-container" style={{ paddingBottom: 100 }}>
                {enhancedStartups.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-secondary)" }}>
                        No startups found looking for a co-founder.
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24, maxWidth: 900, margin: "0 auto" }}>
                        {enhancedStartups.map(s => (
                            <Link key={s.id} href={`/startup/${s.id}`} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
                                <div style={{
                                    background: "white",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 16,
                                    padding: 24,
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "box-shadow 0.2s, transform 0.2s",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                                }}>
                                    {/* Top Half */}
                                    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                                        <div className="startup-card-logo" style={{ width: 44, height: 44, fontSize: 18, flexShrink: 0, borderRadius: 10 }}>
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.3px", marginBottom: 6 }}>
                                                {s.name}
                                            </h3>
                                            <p style={{ fontSize: 13, color: "var(--color-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                {s.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }} />

                                    {/* Bottom Half */}
                                    <div style={{ display: "flex", alignItems: "flex-end", borderTop: "1px solid var(--color-border)", paddingTop: 16, gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-secondary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>Total revenue</p>
                                            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{fmtMoney(s.totalRevenue)}</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-secondary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>MRR</p>
                                            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{fmtMoney(s.mrr)}</p>
                                        </div>
                                        <div style={{ flex: 1.5 }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-secondary)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>Founder</p>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                {s.founderAvatar ? (
                                                    <img src={s.founderAvatar} alt="Avatar" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-border)" }} />
                                                )}
                                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {s.founderName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
