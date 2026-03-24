"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LBEntry {
    startup_id: string;
    startups: any;
    mrr: number;
    arr?: number;
    growth_rate: number;
}

export function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `$${Math.round(n)}`;
}

export function FullLeaderboard({ initialEntries }: { initialEntries: LBEntry[] }) {
    const [entries, setEntries] = useState<LBEntry[]>(initialEntries);
    const [visibleRows, setVisibleRows] = useState(50);
    const [view, setView] = useState<"mrr" | "arr">("arr"); // Default to ARR for leaderboards

    useEffect(() => {
        const supabase = createClient();

        // Subscribe to revenue_snapshots changes
        const channel = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'revenue_snapshots'
                },
                async (payload) => {
                    // Fetch updated data for the startup to ensure we have founder info etc.
                    // For simplicity, we can also just re-fetch the entire pool or update the specific entry
                    if (payload.new && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
                        const newSnap = payload.new as any;

                        // Check if this startup is in our list
                        setEntries(currentEntries => {
                            const index = currentEntries.findIndex(e => e.startup_id === newSnap.startup_id);
                            if (index !== -1) {
                                const updatedEntries = [...currentEntries];
                                updatedEntries[index] = {
                                    ...updatedEntries[index],
                                    mrr: newSnap.mrr,
                                    arr: newSnap.arr || (newSnap.mrr * 12),
                                    growth_rate: newSnap.growth_rate
                                };
                                return updatedEntries;
                            }
                            // If it's a new verified startup, we might need to fetch the startup details too.
                            // But for now, updating existing is the primary "real-time" need.
                            return currentEntries;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const sortedEntries = [...entries]
        .sort((a, b) => {
            const valA = view === "mrr" ? a.mrr : (a.arr ?? (a.mrr * 12));
            const valB = view === "mrr" ? b.mrr : (b.arr ?? (b.mrr * 12));
            return (valB || 0) - (valA || 0);
        });

    const visibleEntries = sortedEntries.slice(0, visibleRows);
    const hasMore = visibleRows < sortedEntries.length;

    return (
        <div>
            {/* Control Header - Consistent with Homepage style */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, opacity: 0.6 }}>Verified Rankings</h2>
                
                <div style={{ display: "flex", background: "var(--color-surface-strong)", padding: "4px", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                    <button
                        onClick={() => setView("mrr")}
                        style={{
                            padding: "6px 16px",
                            fontSize: "12px",
                            fontWeight: 700,
                            borderRadius: "8px",
                            border: "none",
                            background: view === "mrr" ? "var(--color-surface)" : "transparent",
                            color: view === "mrr" ? "var(--color-text)" : "var(--color-secondary)",
                            boxShadow: view === "mrr" ? "var(--shadow-card)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        MRR
                    </button>
                    <button
                        onClick={() => setView("arr")}
                        style={{
                            padding: "6px 16px",
                            fontSize: "12px",
                            fontWeight: 700,
                            borderRadius: "8px",
                            border: "none",
                            background: view === "arr" ? "var(--color-surface)" : "transparent",
                            color: view === "arr" ? "var(--color-text)" : "var(--color-secondary)",
                            boxShadow: view === "arr" ? "var(--shadow-card)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        ARR
                    </button>
                </div>
            </div>

            {/* Main Leaderboard Card */}
            <div
                className="glass"
                style={{
                    padding: "16px 32px 32px",
                    borderRadius: "32px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    backdropFilter: "blur(22px)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                {/* Table wrapper */}
                <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
                    <table style={{ width: "100%", minWidth: "850px", borderCollapse: "separate", borderSpacing: "0 10px" }}>
                    <thead>
                        <tr>
                            <th style={{ padding: "0 20px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6, width: 40 }}>#</th>
                            <th style={{ padding: "0 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>Startup</th>
                            <th style={{ padding: "0 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>Founder</th>
                            <th style={{ padding: "0 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>{view.toUpperCase()}</th>
                            <th style={{ padding: "0 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>MULTIPLE</th>
                            <th style={{ padding: "0 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>MoM Growth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "80px 20px" }}>
                                    <p style={{ color: "var(--color-secondary)", margin: 0, fontSize: 15 }}>No verified startups yet.</p>
                                </td>
                            </tr>
                        ) : (
                            visibleEntries.map((entry, i) => {
                                const startup = entry.startups;
                                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                                return (
                                    <tr
                                        key={entry.startup_id}
                                        className="card-hover"
                                        style={{
                                            transition: "transform 0.2s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.2s ease",
                                            position: "relative",
                                            zIndex: 1
                                        }}
                                    >
                                        <td style={{
                                            background: "var(--color-surface)",
                                            padding: "16px 20px",
                                            textAlign: "center",
                                            borderRadius: "12px 0 0 12px",
                                            border: "1px solid var(--color-border)",
                                            borderRight: "none"
                                        }}>
                                            {medal ? (
                                                <span style={{ fontSize: 20 }}>{medal}</span>
                                            ) : (
                                                <span style={{ fontWeight: 600, color: "var(--color-secondary)", fontSize: 14, opacity: 0.8 }}>{i + 1}</span>
                                            )}
                                        </td>
                                        <td style={{
                                            background: "var(--color-surface)",
                                            padding: "16px 20px",
                                            borderTop: "1px solid var(--color-border)",
                                            borderBottom: "1px solid var(--color-border)"
                                        }}>
                                            <Link href={`/startup/${startup.slug || entry.startup_id}`} style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        fontSize: 16,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 700,
                                                        flexShrink: 0,
                                                        filter: startup.is_anonymous ? "blur(5px)" : "none",
                                                        background: "var(--color-surface-strong)",
                                                        borderRadius: "10px",
                                                        border: "1px solid var(--color-border)",
                                                        position: "relative",
                                                        overflow: "hidden"
                                                    }}
                                                >
                                                    {startup.logo_url && !startup.is_anonymous ? (
                                                        <img
                                                            src={startup.logo_url}
                                                            alt={startup.name}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        startup.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <p style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)", margin: 0, filter: startup.is_anonymous ? "blur(5px)" : "none", letterSpacing: "-0.01em" }}>{startup.name}</p>
                                                        {startup.sale_status_override === "sold" && (
                                                            <span style={{
                                                                fontSize: 9,
                                                                fontWeight: 800,
                                                                padding: "2px 7px",
                                                                borderRadius: 999,
                                                                background: "#FEE2E2",
                                                                color: "#991B1B",
                                                                letterSpacing: "0.04em",
                                                                flexShrink: 0
                                                            }}>SOLD</span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: 13, color: "var(--color-secondary)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, opacity: 0.6 }}>
                                                        {startup.description || startup.category || "—"}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td style={{
                                            background: "var(--color-surface)",
                                            padding: "16px 20px",
                                            color: "var(--color-secondary)",
                                            fontSize: 14,
                                            fontWeight: 500,
                                            borderTop: "1px solid var(--color-border)",
                                            borderBottom: "1px solid var(--color-border)"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                                                {startup.founder_avatar_url && (
                                                    <img
                                                        src={startup.founder_avatar_url}
                                                        alt={startup.founder_name || "Founder"}
                                                        style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                                    />
                                                )}
                                                {startup.founder_name ? (
                                                    <span style={{ color: "var(--color-text)", opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {startup.founder_name}
                                                    </span>
                                                ) : startup.founder_handle ? (
                                                    <span style={{ opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{startup.founder_handle}</span>
                                                ) : "—"}
                                            </div>
                                        </td>
                                        <td style={{
                                            background: "var(--color-surface)",
                                            padding: "16px 20px",
                                            textAlign: "right",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: "var(--color-text)",
                                            borderTop: "1px solid var(--color-border)",
                                            borderBottom: "1px solid var(--color-border)"
                                        }}>
                                            {view === "mrr"
                                                ? (entry.mrr != null ? fmtMoney(entry.mrr) : "—")
                                                : (entry.arr != null ? fmtMoney(entry.arr) : (entry.mrr != null ? fmtMoney(entry.mrr * 12) : "—"))
                                            }
                                        </td>
                                        <td style={{
                                            background: "var(--color-surface)",
                                            padding: "16px 20px",
                                            textAlign: "right",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: "var(--color-text)",
                                            borderTop: "1px solid var(--color-border)",
                                            borderBottom: "1px solid var(--color-border)"
                                        }}>
                                            {(startup?.asking_price && (entry.arr || entry.mrr))
                                                ? `${(startup.asking_price / (entry.arr || (entry.mrr * 12))).toFixed(1)}x`
                                                : "—"}
                                        </td>
                                        <td style={{
                                            background: "var(--color-surface)",
                                            padding: "16px 20px",
                                            textAlign: "right",
                                            borderRadius: "0 12px 12px 0",
                                            border: "1px solid var(--color-border)",
                                            borderLeft: "none"
                                        }}>
                                            {entry.growth_rate != null ? (
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                                                    {entry.growth_rate >= 0 ? <ChevronUp size={14} className="g-up" /> : <ChevronDown size={14} className="g-down" />}
                                                    <span className={entry.growth_rate >= 0 ? "g-up" : "g-down"} style={{ fontWeight: 700, fontSize: 14 }}>
                                                        {Math.abs(entry.growth_rate).toFixed(1)}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: "var(--color-secondary)", fontSize: 14 }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        {/* End of glass card */}

            {hasMore && (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                    <button
                        onClick={() => setVisibleRows(prev => prev + 20)}
                        className="btn btn-secondary"
                        style={{ padding: "10px 32px", fontSize: 14, fontWeight: 600 }}
                    >
                        Load more startups
                    </button>
                </div>
            )}
        </div>
    );
}
