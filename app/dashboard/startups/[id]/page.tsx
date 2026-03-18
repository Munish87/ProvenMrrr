"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HealthScoreBadge } from "@/components/startup/HealthScoreBadge";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { VerifiedBadge } from "@/components/startup/VerifiedBadge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Link2, RefreshCw, Eye, EyeOff, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type StartupRow = Database["public"]["Tables"]["startups"]["Row"];
type HealthScoreRow = Database["public"]["Tables"]["health_scores"]["Row"];

export default function StartupDetailPage() {
    const { id } = useParams<{ id: string }>();
    const supabase = createClient();

    const [startup, setStartup] = useState<StartupRow | null>(null);
    const [latestScore, setLatestScore] = useState<Pick<HealthScoreRow, "score" | "risk_level" | "ai_summary"> | null>(null);
    const [latestSnap, setLatestSnap] = useState<{
        mrr: number; arr: number; churn_rate: number; growth_rate: number;
        customer_count: number; volatility_score: number; refund_rate: number;
    } | null>(null);
    const [chartData, setChartData] = useState<{ month: string; revenue: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [connectMsg, setConnectMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [togglingCofounder, setTogglingCofounder] = useState(false);

    async function toggleCofounder() {
        if (!startup) return;
        setTogglingCofounder(true);
        const nextState = !startup.looking_for_cofounder;
        const { error } = await supabase.from("startups").update({ looking_for_cofounder: nextState }).eq("id", startup.id);
        if (!error) {
            setStartup({ ...startup, looking_for_cofounder: nextState });
        }
        setTogglingCofounder(false);
    }

    const load = useCallback(async () => {
        const { data: s } = await supabase
            .from("startups").select("*").eq("id", id).single();

        const { data: hs } = await supabase
            .from("health_scores")
            .select("score, risk_level, ai_summary")
            .eq("startup_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        const { data: snaps } = await supabase
            .from("revenue_snapshots")
            .select("mrr, arr, churn_rate, growth_rate, customer_count, volatility_score, refund_rate, snapshot_date")
            .eq("startup_id", id)
            .order("snapshot_date", { ascending: false })
            .limit(6)
            .returns<{
                mrr: number; arr: number; churn_rate: number; growth_rate: number;
                customer_count: number; volatility_score: number; refund_rate: number; snapshot_date: string;
            }[]>();

        setStartup(s);
        setLatestScore(hs ?? null);
        if (snaps && snaps.length > 0) {
            setLatestSnap(snaps[0]);
            setChartData(
                [...snaps].reverse().map((sn) => ({
                    month: new Date(sn.snapshot_date).toLocaleString("en-US", { month: "short", year: "2-digit" }),
                    revenue: sn.mrr,
                }))
            );
        }
        setLoading(false);
    }, [id, supabase]);

    useEffect(() => { load(); }, [load]);

    async function handleConnect() {
        if (!apiKey.trim()) return;
        setConnecting(true);
        setConnectMsg(null);

        const res = await fetch("/api/stripe/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startupId: id, apiKey }),
        });
        const data = await res.json();

        if (res.ok) {
            setConnectMsg({ type: "success", text: `✓ Connected! Health Score: ${data.healthScore.score}/100` });
            setApiKey("");
            load();
        } else {
            setConnectMsg({ type: "error", text: data.error ?? "Connection failed" });
        }
        setConnecting(false);
    }

    async function handleRefresh() {
        setRefreshing(true);
        await fetch("/api/stripe/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startupId: id }),
        });
        await load();
        setRefreshing(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="w-7 h-7 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (!startup) return <p className="text-slate-400">Startup not found.</p>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-slate-900">{startup.name}</h1>
                        {startup.is_verified && <VerifiedBadge />}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{startup.description ?? ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/startup/${id}`} target="_blank" className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors" title="Public page">
                        <ExternalLink size={15} className="text-slate-500" />
                    </Link>
                    {startup.is_verified && (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-sm transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    )}
                </div>
            </div>

            {/* Health score + key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex items-center gap-5">
                    <HealthScoreBadge score={latestScore?.score ?? 0} size="lg" />
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Health Score</p>
                        <p className="text-3xl font-black text-slate-900 mt-0.5">
                            {latestScore?.score ?? "—"}
                            <span className="text-base font-normal text-slate-400">/100</span>
                        </p>
                        <p
                            className="text-sm capitalize mt-1"
                            style={{
                                color:
                                    latestScore?.risk_level === "low" ? "#10b981"
                                        : latestScore?.risk_level === "medium" ? "#f59e0b"
                                            : "#f43f5e",
                            }}
                        >
                            {latestScore?.risk_level ?? "—"} risk
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: "MRR", value: formatCurrency(latestSnap?.mrr ?? 0) },
                        { label: "ARR", value: formatCurrency(latestSnap?.arr ?? 0) },
                        { label: "MoM Growth", value: latestSnap ? formatPercent(latestSnap.growth_rate) : "—" },
                        { label: "Churn Rate", value: latestSnap ? `${latestSnap.churn_rate.toFixed(1)}%` : "—" },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="text-base font-bold text-slate-900 mt-0.5">{value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Full metrics (private) */}
            {latestSnap && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-900 mb-4">Full Metrics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Customer Count", value: String(latestSnap.customer_count) },
                            { label: "Volatility Score", value: `${latestSnap.volatility_score.toFixed(1)}/100` },
                            { label: "Refund Rate", value: `${latestSnap.refund_rate.toFixed(1)}%` },
                            { label: "Annual ARR", value: formatCurrency(latestSnap.arr) },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-sm font-semibold text-slate-900 mt-1">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Revenue chart */}
            {chartData.length > 0 && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-900 mb-4">Revenue History</h2>
                    <RevenueChart data={chartData} />
                </div>
            )}

            {/* AI Summary */}
            {latestScore?.ai_summary && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-900 mb-3">AI Health Analysis</h2>
                    <p className="text-slate-500 text-sm leading-relaxed">{latestScore.ai_summary}</p>
                </div>
            )}

            {/* Co-Founder Search */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 mb-1">Co-founder Search</h2>
                        <p className="text-slate-500 text-sm">
                            List this startup in the public directory to find a co-founder.
                        </p>
                    </div>
                    <button
                        onClick={toggleCofounder}
                        disabled={togglingCofounder}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${startup.looking_for_cofounder ? 'bg-indigo-500' : 'bg-slate-700'
                            } ${togglingCofounder ? 'opacity-50' : ''}`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${startup.looking_for_cofounder ? 'translate-x-5' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Stripe Connect */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Link2 size={16} className="text-indigo-500" />
                    <h2 className="text-sm font-semibold text-slate-900">
                        {startup.is_verified ? "Update Stripe Connection" : "Connect Stripe"}
                    </h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Paste your Stripe <strong className="text-slate-400">Restricted Key</strong> (rk_...) — read-only permissions only. We encrypt and store it securely.
                </p>

                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="rk_live_..."
                            className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                    <button
                        onClick={handleConnect}
                        disabled={connecting || !apiKey.trim()}
                        className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {connecting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Connect"}
                    </button>
                </div>

                {connectMsg && (
                    <div className={`mt-3 px-4 py-2.5 rounded-xl text-sm ${connectMsg.type === "success"
                        ? "bg-emerald-400/10 border border-emerald-400/20 text-emerald-400"
                        : "bg-rose-400/10 border border-rose-400/20 text-rose-400"
                        }`}>
                        {connectMsg.text}
                    </div>
                )}
            </div>
        </div>
    );
}
