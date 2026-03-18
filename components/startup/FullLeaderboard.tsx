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

export function FullLeaderboard({ initialEntries }: { initialEntries: LBEntry[] }) {
    const [sort, setSort] = useState<"all_time" | "mrr">("mrr");
    const [visibleRows, setVisibleRows] = useState(50);

    const sortedEntries = [...initialEntries]
        .sort((a, b) => {
            if (sort === "all_time") {
                return (b.all_time || 0) - (a.all_time || 0);
            }
            return (b.mrr || 0) - (a.mrr || 0);
        });

    const visibleEntries = sortedEntries.slice(0, visibleRows);
    const hasMore = visibleRows < sortedEntries.length;

    return (
        <div>
            {/* Sort toggle */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 4, background: "white", border: "1px solid var(--color-border)", borderRadius: 8, padding: 4 }}>
                    <button
                        onClick={() => { setSort("mrr"); setVisibleRows(50); }}
                        style={{
                            fontSize: 12,
                            fontWeight: sort === "mrr" ? 600 : 500,
                            padding: "4px 12px",
                            background: sort === "mrr" ? "#EEF2FF" : "transparent",
                            borderRadius: 6,
                            border: "none",
                            cursor: "pointer",
                            color: sort === "mrr" ? "var(--color-accent)" : "var(--color-secondary)"
                        }}
                    >
                        MRR
                    </button>
                    <button
                        onClick={() => { setSort("all_time"); setVisibleRows(50); }}
                        style={{
                            fontSize: 12,
                            fontWeight: sort === "all_time" ? 600 : 500,
                            padding: "4px 12px",
                            background: sort === "all_time" ? "#EEF2FF" : "transparent",
                            borderRadius: 6,
                            border: "none",
                            cursor: "pointer",
                            color: sort === "all_time" ? "var(--color-accent)" : "var(--color-secondary)"
                        }}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <table className="lb-table data-table">
                    <thead>
                        <tr>
                            <th style={{ width: 56, textAlign: "center" }}>#</th>
                            <th>STARTUP</th>
                            <th>FOUNDER</th>
                            <th style={{ textAlign: "right" }}>ALL TIME</th>
                            <th style={{ textAlign: "right" }}>MRR</th>
                            <th style={{ textAlign: "right" }}>MOM GROWTH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "56px 20px", color: "var(--color-secondary)" }}>
                                    No verified startups yet.
                                </td>
                            </tr>
                        ) : (
                            visibleEntries.map((entry, i) => {
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
                                                    <p style={{ fontSize: 13, color: "var(--color-secondary)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                                                        {startup.description || startup.category || "—"}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td style={{ color: "var(--color-secondary)", fontSize: 13 }}>
                                            {startup.x_handle ? `@${startup.x_handle}` : "—"}
                                        </td>
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
                                                <span style={{ color: "var(--color-secondary)" }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <button
                        onClick={() => setVisibleRows(prev => prev + 20)}
                        className="btn btn-secondary"
                        style={{ padding: "8px 24px", fontSize: 13 }}
                    >
                        Load more
                    </button>
                </div>
            )}
        </div>
    );
}
