"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { HealthScoreBadge } from "@/components/startup/HealthScoreBadge";
import { Heart, Building2, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { removeBuyerInteraction, getInterestedStartups } from "@/app/actions/matchmaking";

export default function InterestedPage() {
    const [startups, setStartups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMatches = async () => {
        try {
            const data = await getInterestedStartups();
            if (data.success) {
                setStartups(data.matches || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const handleRemove = async (e: React.MouseEvent, startupId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic update
        setStartups(prev => prev.filter(s => s.startup.id !== startupId));
        await removeBuyerInteraction(startupId);
    };

    if (isLoading) {
        return <div style={{ padding: 80, textAlign: "center", color: "var(--color-secondary)", fontWeight: 600 }}>Loading matches...</div>;
    }

    return (
        <div style={{ maxWidth: 900 }}>
            {/* Page header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.5px", marginBottom: 6 }}>
                    Your Matches
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 500 }}>Startups you swiped right on.</p>
            </div>

            {/* Startups list */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Heart size={16} color="var(--color-accent)" fill="var(--color-accent)" />
                        Matches
                    </h2>
                    <Link href="/dashboard/matchmaking" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
                        Swipe More <ChevronRight size={14} />
                    </Link>
                </div>

                {startups.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "56px 24px" }}>
                        <Heart size={40} color="var(--color-secondary)" style={{ opacity: 0.1, margin: "0 auto 16px" }} strokeWidth={1} />
                        <p style={{ color: "var(--color-secondary)", marginBottom: 24, fontSize: 15, fontWeight: 600 }}>You haven&apos;t matched with any startups yet.</p>
                        <Link href="/dashboard/matchmaking" className="btn btn-primary">
                            Discover Startups
                        </Link>
                    </div>
                ) : (
                    <div>
                        {startups.map((match) => {
                            const { startup, snapshot, score } = match;
                            return (
                                <Link key={startup.id} href={`/startup/${startup.id}`} style={{ textDecoration: "none", display: "block" }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "20px 24px",
                                        borderBottom: "1px solid rgba(0,0,0,0.05)",
                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <div className="startup-card-logo" style={{ width: 44, height: 44, fontSize: 18, borderRadius: 10, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>
                                                {startup.logo_url ? (
                                                    <img src={startup.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: startup.is_anonymous ? "blur(8px)" : "none" }} />
                                                ) : startup.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", filter: startup.is_anonymous ? "blur(6px)" : "none" }}>{startup.name}</p>
                                                    {startup.is_listed_for_sale && (
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent)", background: "rgba(99, 102, 241, 0.05)", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", border: "1px solid rgba(99, 102, 241, 0.1)" }}>For Sale</span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: 13, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                                                    {startup.category || "Software"}
                                                    {startup.is_verified && <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>· Verified</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                                            {/* MRR Column */}
                                            <div style={{ textAlign: "right", minWidth: 80 }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>MRR</p>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{snapshot ? formatCurrency(snapshot.mrr) : "—"}</p>
                                            </div>

                                            {/* Health Score Column */}
                                            <div style={{ textAlign: "right", width: 80, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Health</p>
                                                {score !== undefined ? (
                                                    <HealthScoreBadge score={score} size="sm" />
                                                ) : (
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)" }}>—</span>
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            <button 
                                                onClick={(e) => handleRemove(e, startup.id)}
                                                className="btn-icon-hover-red"
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    color: "var(--color-secondary)",
                                                    cursor: "pointer",
                                                    padding: 8,
                                                    borderRadius: "12px",
                                                    transition: "all 0.2s",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >
                                                <Trash2 size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
