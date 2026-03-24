"use client";

import { useState } from "react";
import Link from "next/link";

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
export function HomePageLeaderboard({ initialEntries }: { initialEntries: LBEntry[] }) {
    const [view, setView] = useState<"mrr" | "arr">("arr");

    // Sort down the un-sliced entire verified pool
    const sortedEntries = [...initialEntries]
        .sort((a, b) => {
            const valA = view === "mrr" ? a.mrr : (a.arr ?? (a.mrr * 12));
            const valB = view === "mrr" ? b.mrr : (b.arr ?? (b.mrr * 12));
            return (valB || 0) - (valA || 0);
        })
        .slice(0, 10);

    return (
        <section style={{ marginTop: 18, marginBottom: 10 }}>
            {/* Header Area */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, opacity: 0.6 }}>Verified Leaderboard</h2>
                
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

            {/* Table Area */}
            <div className="lb-container" style={{ padding: 0, height: "auto", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: "6px" }}>
                <table className="data-table" style={{ minWidth: "650px" }}>
                    <thead>
                        <tr>
                            <th style={{ width: 40, textAlign: "center" }}>#</th>
                            <th>STARTUP</th>
                            <th>FOUNDER</th>
                            <th style={{ textAlign: "right" }}>{view.toUpperCase()}</th>
                            <th style={{ textAlign: "right" }}>MULTIPLE</th>
                            <th style={{ textAlign: "right" }}>MOM GROWTH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--color-secondary)" }}>
                                    No verified startups found.
                                </td>
                            </tr>
                        ) : (
                            sortedEntries.map((entry, i) => {
                                const startup = entry.startups;
                                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                                return (
                                    <tr
                                        key={entry.startup_id}
                                        style={{
                                            position: "relative",
                                            zIndex: 1
                                        }}
                                    >
                                        <td style={{ textAlign: "center" }}>
                                            {medal ? (
                                                <span style={{ fontSize: 18 }}>{medal}</span>
                                            ) : (
                                                <span style={{ fontWeight: 600, color: "var(--color-secondary)", fontSize: 13 }}>{i + 1}</span>
                                            )}
                                        </td>
                                        <td>
                                            <Link href={`/startup/${startup.slug || entry.startup_id}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                                                <div
                                                    className="startup-card-logo"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        fontSize: 14,
                                                        filter: startup.is_anonymous ? "blur(5px)" : "none",
                                                        position: "relative",
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: "rgba(255, 255, 255, 0.03)",
                                                        border: "1px solid rgba(255, 255, 255, 0.08)",
                                                        borderRadius: "10px"
                                                    }}
                                                >
                                                    {startup.logo_url && !startup.is_anonymous ? (
                                                        <img
                                                            src={startup.logo_url}
                                                            alt={startup.name}
                                                            loading="lazy"
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        startup.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)", margin: 0, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</p>
                                                    <p style={{ fontSize: 13, color: "var(--color-secondary)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                                                        {startup.description || startup.category || "—"}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-secondary)", overflow: "hidden" }}>
                                                {startup.founder_avatar_url && !startup.is_anonymous && (
                                                    <img
                                                        src={startup.founder_avatar_url}
                                                        alt={startup.founder_name || "Founder"}
                                                        loading="lazy"
                                                        style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                                                    />
                                                )}
                                                {startup.founder_name ? (
                                                    <span style={{ color: "var(--color-text)", filter: startup.is_anonymous ? "blur(5px)" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {startup.founder_name}
                                                    </span>
                                                ) : startup.founder_handle ? (
                                                    <span style={{ filter: startup.is_anonymous ? "blur(5px)" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{startup.founder_handle}</span>
                                                ) : "—"}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                                            {view === "mrr" 
                                                ? (entry.mrr != null ? fmtMoney(entry.mrr) : "—")
                                                : (entry.arr != null ? fmtMoney(entry.arr) : (entry.mrr != null ? fmtMoney(entry.mrr * 12) : "—"))
                                            }
                                        </td>
                                        <td style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                                            {(entry.startups?.asking_price && entry.mrr) 
                                                ? `${(entry.startups.asking_price / (entry.mrr * 12)).toFixed(1)}x` 
                                                : "—"}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {entry.growth_rate != null ? (
                                                <span className={entry.growth_rate >= 0 ? "g-up" : "g-down"}>
                                                    {entry.growth_rate >= 0 ? "↑" : "↓"} {Math.abs(entry.growth_rate).toFixed(1)}%
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
