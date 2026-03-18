"use client";

import { TrendingUp, Building2, MapPin, Calendar, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { HealthScoreBadge } from "@/components/startup/HealthScoreBadge";

interface SwipeCardProps {
    startup: any;
    score: number;
    latestSnapshot: any;
    style?: React.CSSProperties;
    opacityRight?: number;
    opacityLeft?: number;
}

export function SwipeCard({ startup, score, latestSnapshot, style, opacityRight = 0, opacityLeft = 0 }: SwipeCardProps) {
    return (
        <div 
            className="card"
            style={{
                width: "100%",
                maxWidth: 420,
                height: 620,
                padding: 0,
                position: "absolute",
                overflow: "hidden",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                ...style
            }}
        >
            {/* Visual Indicators for Swipe */}
            {opacityRight > 0 && (
                <div style={{
                    position: "absolute", top: 40, left: 40,
                    border: "3px solid #10B981", color: "#10B981",
                    padding: "8px 20px", borderRadius: 16,
                    fontSize: 28, fontWeight: 800, transform: "rotate(-12deg)",
                    zIndex: 20, opacity: opacityRight,
                    textTransform: "uppercase",
                    background: "rgba(16, 185, 129, 0.05)",
                }}>
                    Interested
                </div>
            )}
            {opacityLeft > 0 && (
                <div style={{
                    position: "absolute", top: 40, right: 40,
                    border: "3px solid #EF4444", color: "#EF4444",
                    padding: "8px 20px", borderRadius: 16,
                    fontSize: 28, fontWeight: 800, transform: "rotate(12deg)",
                    zIndex: 20, opacity: opacityLeft,
                    textTransform: "uppercase",
                    background: "rgba(239, 68, 68, 0.05)",
                }}>
                    Pass
                </div>
            )}

            {/* Header / Logo Section */}
            <div style={{ padding: "32px 32px 24px", background: "rgba(0,0,0,0.01)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    <div style={{ 
                        width: 80, height: 80, borderRadius: 24, 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--color-bg)", border: "1px solid rgba(0,0,0,0.08)"
                    }}>
                        {startup.logo_url ? (
                            <img src={startup.logo_url} alt={startup.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 24, filter: startup.is_anonymous ? "blur(8px)" : "none" }} />
                        ) : (
                            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)", filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name.charAt(0)}</div>
                        )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{
                            background: score >= 85 ? "rgba(16, 185, 129, 0.05)" : score >= 70 ? "rgba(234, 179, 8, 0.05)" : "rgba(0,0,0,0.03)",
                            color: score >= 85 ? "#10B981" : score >= 70 ? "#EAB308" : "var(--color-secondary)",
                            padding: "6px 16px", fontSize: 13, fontWeight: 700, borderRadius: 100
                        }}>
                            {score}% Match
                        </div>
                    </div>
                </div>

                <h2 style={{ fontSize: 30, fontWeight: 700, color: "var(--color-text)", marginBottom: 8, letterSpacing: "-0.01em", filter: startup.is_anonymous ? "blur(5px)" : "none" }}>
                    {startup.name}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 700, padding: "4px 12px", background: "rgba(99, 102, 241, 0.05)", borderRadius: 100, textTransform: "uppercase", border: "1px solid rgba(99, 102, 241, 0.08)", filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.category || "SaaS"}</span>
                    {startup.country && (
                        <span style={{ fontSize: 13, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                            <MapPin size={14} /> {startup.country}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: "32px", flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 15, color: "var(--color-secondary)", marginBottom: 28, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden", fontWeight: 500, filter: startup.is_anonymous ? "blur(6px)" : "none" }}>
                    {startup.description || "Verified startup with proven revenue and growth potential. Connect for more details."}
                </p>

                {/* Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "auto" }}>
                    <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)" }}>
                        <p style={{ fontSize: 10, color: "var(--color-secondary)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>Asking Price</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>
                            {startup.asking_price ? formatCurrency(startup.asking_price) : "Open"}
                        </p>
                    </div>
                    <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)" }}>
                        <p style={{ fontSize: 10, color: "var(--color-secondary)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>Annual Rev</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{formatCurrency((latestSnapshot?.mrr || 0) * 12)}</p>
                    </div>
                    <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)" }}>
                        <p style={{ fontSize: 10, color: "var(--color-secondary)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>Growth</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <TrendingUp size={14} className="g-up" />
                            <p className="g-up" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{latestSnapshot?.growth_rate || 0}%</p>
                        </div>
                    </div>
                    <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.03)" }}>
                        <p style={{ fontSize: 10, color: "var(--color-secondary)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>Profit</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{startup.profit_margin_30d || 0}%</p>
                    </div>
                </div>

                {/* Footer Badges */}
                <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                        {startup.is_verified && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3B82F6", padding: "4px 12px", fontSize: 11, fontWeight: 700, background: "rgba(59, 130, 246, 0.05)", borderRadius: 100 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} />
                                VERIFIED
                            </div>
                        )}
                        {startup.founded_date && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-secondary)", fontSize: 13, fontWeight: 500 }}>
                                <Calendar size={14} /> {new Date(startup.founded_date).getFullYear()}
                            </div>
                        )}
                    </div>
                    {score !== undefined && <HealthScoreBadge score={score} size="sm" />}
                </div>
            </div>
        </div>
    );
}
