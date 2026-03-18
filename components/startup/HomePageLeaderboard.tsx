"use client";

import { useState } from "react";
import Link from "next/link";

interface LBEntry {
    startup_id: string;
    startups: any;
    mrr: number;
    all_time: number;
    growth_rate: number;
}

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString("en-US")}k`;
    return `$${n.toLocaleString("en-US")}`;
}

export function HomePageLeaderboard({ initialEntries }: { initialEntries: LBEntry[] }) {
    const [sort, setSort] = useState<"all_time" | "mrr">("all_time");

    // Sort down the un-sliced entire verified pool based on active pill
    const sortedEntries = [...initialEntries]
        .sort((a, b) => {
            if (sort === "all_time") {
                return (b.all_time || 0) - (a.all_time || 0);
            }
            return (b.mrr || 0) - (a.mrr || 0);
        })
        .slice(0, 10);

    return (
        <section style={{ marginTop: 18, marginBottom: 10 }}>
            {/* Header & Toggles */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", margin: 0 }}>Leaderboard</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setSort("mrr")}
                        className="nav-pill"
                        style={{
                            fontSize: 12,
                            background: sort === "mrr" ? "#F3F4F6" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 10px",
                            color: "var(--color-text)",
                        }}
                    >
                        MRR
                    </button>
                    <button
                        onClick={() => setSort("all_time")}
                        className="nav-pill"
                        style={{
                            fontSize: 12,
                            background: sort === "all_time" ? "#F3F4F6" : "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 10px",
                            color: "var(--color-text)",
                        }}
                    >
                        All time
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="lb-container" style={{ padding: 0, height: "auto", overflow: "hidden" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: 40, textAlign: "center" }}>#</th>
                            <th>STARTUP</th>
                            <th>FOUNDER</th>
                            <th style={{ textAlign: "right" }}>ALL TIME</th>
                            <th style={{ textAlign: "right" }}>MRR</th>
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
                                    <tr key={entry.startup_id}>
                                        <td style={{ textAlign: "center" }}>
                                            {medal ? (
                                                <span style={{ fontSize: 18 }}>{medal}</span>
                                            ) : (
                                                <span style={{ fontWeight: 600, color: "var(--color-secondary)", fontSize: 13 }}>{i + 1}</span>
                                            )}
                                        </td>
                                        <td>
                                            <Link href={`/startup/${entry.startup_id}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                                                <div className="startup-card-logo" style={{ width: 36, height: 36, fontSize: 14, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>
                                                    {startup.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)", margin: 0, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</p>
                                                    <p style={{ fontSize: 13, color: "var(--color-secondary)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                                                        {startup.description || "—"}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td style={{ color: "var(--color-secondary)" }}>{startup.x_handle ? `@${startup.x_handle}` : "—"}</td>
                                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "var(--color-secondary)" }}>
                                            {entry.all_time != null ? fmtMoney(entry.all_time) : "—"}
                                        </td>
                                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: 14 }}>
                                            {entry.mrr != null ? fmtMoney(entry.mrr) : "—"}
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
