"use client";

import { Activity, BarChart3, TrendingUp, Users, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { useState } from "react";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface RealRevenueDashboardProps {
    latestSnap: any;
    chartData: { month: string; mrr: number; arr: number }[];
    healthScore: any;
    isStripeConnected: boolean;
}

export function RealRevenueDashboard({ latestSnap, chartData, healthScore, isStripeConnected }: RealRevenueDashboardProps) {
    const [view, setView] = useState<"mrr" | "arr">("mrr");

    const formattedChartData = chartData.map(d => ({
        month: d.month,
        revenue: view === "mrr" ? d.mrr : d.arr
    }));
    return (
        <div style={{ marginTop: 32, padding: "32px", borderRadius: "24px", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", background: "var(--glass-pill-bg)", border: "1px solid var(--glass-pill-border)", boxShadow: "var(--glass-pill-shadow)", padding: "4px 10px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.75 }}>Financial Audit</span>
                        <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: "17px", fontWeight: 600, color: "var(--color-text)", margin: 0, letterSpacing: "-0.01em" }}>
                            Revenue Intelligence
                        </h2>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--color-secondary)", marginTop: 4, fontWeight: 500, opacity: 0.6 }}>
                        Verified performance metrics directly from the source.
                    </p>
                </div>
                {isStripeConnected && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "8px 16px", borderRadius: 99, color: "#10B981", fontSize: 13, fontWeight: 600 }}>
                        <RefreshCw size={14} className="animate-spin" />
                        Live via Stripe
                    </div>
                )}
            </div>

            {/* Premium Highlight Card */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 20, padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, boxShadow: "var(--shadow-card)" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ position: "relative", display: "flex", width: 10, height: 10 }}>
                           <span style={{ position: "relative", width: 10, height: 10, borderRadius: "50%", background: "#0EA5E9" }}></span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-secondary)", opacity: 0.5 }}>MRR</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                        <span style={{ fontSize: 48, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-1.5px" }}>{formatCurrency(latestSnap?.mrr ?? 0)}</span>
                        <span style={{ fontSize: 18, fontWeight: 600, color: "var(--color-secondary)", opacity: 0.4 }}>/ mo</span>
                    </div>
                </div>
                <div style={{ textAlign: "right", paddingLeft: "48px", borderLeft: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, opacity: 0.5 }}>Verified MRR</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.5px" }}>{formatCurrency(latestSnap?.mrr ?? 0)}</p>
                </div>
            </div>

            {/* Secondary Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
                {[
                    { icon: TrendingUp, label: "MoM Growth", color: "#10B981", value: formatPercent(latestSnap?.growth_rate ?? 0) },
                    { icon: BarChart3, label: "ARR", color: "var(--color-text)", value: formatCurrency(latestSnap?.arr ?? latestSnap?.all_time_revenue ?? 0) },
                    { icon: Users, label: "Active Subs", color: "var(--color-text)", value: latestSnap?.customer_count ?? 0 }
                ].map((m, idx) => (
                    <div key={idx} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "20px 24px", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: "var(--color-secondary)", opacity: 0.5 }}>
                            <m.icon size={16} />
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</span>
                        </div>
                        <p style={{ fontSize: 24, fontWeight: 800, color: m.color, margin: 0, letterSpacing: "-0.5px" }}>{m.value}</p>
                    </div>
                ))}
            </div>

            {/* Diagnostics and Health */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 28, boxShadow: "var(--shadow-card)" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, color: "var(--color-text)" }}>
                        <Zap size={20} color="#6366F1" fill="#6366F1" style={{ opacity: 0.8 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>AI Risk Assessment</h3>
                     </div>
                     
                     <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20 }}>
                         <span style={{ fontSize: 40, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>{healthScore?.score ?? 0}</span>
                         <span style={{ fontSize: 16, color: "var(--color-secondary)", fontWeight: 600, paddingBottom: 6, opacity: 0.4 }}>/100</span>
                     </div>
                     <p style={{ fontSize: 14, color: "var(--color-secondary)", lineHeight: 1.6, margin: 0, fontWeight: 500, opacity: 0.8 }}>
                        {healthScore?.ai_summary || "Our AI model analyzes volatility, churn velocity, and revenue concentration to establish this financial security score."}
                     </p>
                     <div style={{ marginTop: 24, display: "inline-block", background: "var(--glass-pill-bg)", padding: "8px 16px", borderRadius: 10, border: "1px solid var(--glass-pill-border)", boxShadow: "var(--glass-pill-shadow)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                         Risk Profile: <span style={{ color: healthScore?.risk_level === "Low" ? "#10B981" : healthScore?.risk_level === "High" ? "#EF4444" : "#F59E0B" }}>{healthScore?.risk_level ?? "Unrated"}</span>
                     </div>
                </div>

                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", marginBottom: 24, letterSpacing: "-0.01em" }}>Diagnostics</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {[
                            { icon: AlertCircle, label: "Churn Rate", value: `${(latestSnap?.churn_rate ?? 0).toFixed(1)}%` },
                            { icon: Activity, label: "Volatility", value: (latestSnap?.volatility_score ?? 0).toFixed(2) },
                            { icon: RefreshCw, label: "Refund Velocity", value: `${(latestSnap?.refund_rate ?? 0).toFixed(1)}%` }
                        ].map((d, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < 2 ? "1px solid var(--color-stroke-soft)" : "none", paddingBottom: i < 2 ? 16 : 0 }}>
                                <span style={{ fontSize: 14, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: 10, fontWeight: 500, opacity: 0.6 }}><d.icon size={16} /> {d.label}</span>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 32, boxShadow: "var(--shadow-card)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0, letterSpacing: "-0.01em" }}>Revenue Trajectory</h3>
                    
                    {chartData.length > 0 && (
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
                    )}
                </div>
                
                {chartData.length > 0 ? (
                    <RevenueChart data={formattedChartData} label={view === "mrr" ? "MRR" : "ARR"} />
                ) : (
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--color-border)", borderRadius: 12, color: "var(--color-secondary)", fontSize: 14 }}>
                        No trajectory data available
                    </div>
                )}
            </div>
        </div>
    );
}
