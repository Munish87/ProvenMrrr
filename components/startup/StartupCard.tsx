import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { HealthScoreBadge } from "./HealthScoreBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import type { Database } from "@/lib/supabase/types";

type Startup = Database["public"]["Tables"]["startups"]["Row"];

interface StartupCardProps {
    startup: Startup;
    mrr: number;
    growthRate: number;
    score: number;
    riskLevel: "low" | "medium" | "high";
    rank?: number;
}

export function StartupCard({
    startup,
    mrr,
    growthRate,
    score,
    riskLevel,
    rank,
}: StartupCardProps) {
    const riskColors = {
        low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        high: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    };

    return (
        <Link href={`/startup/${startup.id}`}>
            <div className="glass rounded-xl p-5 card-hover cursor-pointer bg-vetra-surface">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        {/* Rank badge */}
                        {rank && (
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-vetra-primary/20 text-vetra-primary text-xs font-bold flex items-center justify-center">
                                #{rank}
                            </span>
                        )}

                        {/* Logo */}
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ filter: startup.is_anonymous ? "blur(5px)" : "none" }}>
                            {startup.name.charAt(0).toUpperCase()}
                        </div>
 
                        <div className="min-w-0">
                            <h3 className="font-semibold text-white truncate" style={{ filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</h3>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                {startup.category ?? "SaaS"}{startup.country ? ` · ${startup.country}` : ""}
                            </p>
                        </div>
                    </div>

                    <HealthScoreBadge score={score} size="sm" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                        <p className="text-xs text-slate-500">MRR</p>
                        <p className="text-sm font-semibold text-white mt-0.5">
                            {formatCurrency(mrr)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Growth</p>
                        <p
                            className={`text-sm font-semibold mt-0.5 ${growthRate >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                        >
                            {formatPercent(growthRate)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Risk</p>
                        <span
                            className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${riskColors[riskLevel]}`}
                        >
                            {riskLevel}
                        </span>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5">
                    <VerifiedBadge isVerified={startup.is_verified} />
                </div>
            </div>
        </Link>
    );
}
