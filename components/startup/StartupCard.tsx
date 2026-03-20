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
        low: "text-emerald-600 bg-emerald-50 border-emerald-100",
        medium: "text-amber-600 bg-amber-50 border-amber-100",
        high: "text-rose-600 bg-rose-50 border-rose-100",
    };

    return (
        <Link href={`/startup/${startup.slug || startup.id}`}>
            <div className="card p-5 card-hover cursor-pointer border border-zinc-100">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                        {/* Rank badge */}
                        {rank && (
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
                                #{rank}
                            </span>
                        )}

                        {/* Logo */}
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ filter: startup.is_anonymous ? "blur(5px)" : "none" }}>
                            {startup.name.charAt(0).toUpperCase()}
                        </div>
 
                        <div className="min-w-0">
                            <h3 className="font-semibold text-zinc-900 truncate" style={{ filter: startup.is_anonymous ? "blur(5px)" : "none" }}>{startup.name}</h3>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                                {startup.category ?? "SaaS"}{startup.country ? ` · ${startup.country}` : ""}
                            </p>
                        </div>
                    </div>

                    <HealthScoreBadge score={score} size="sm" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">MRR</p>
                        <p className="text-sm font-bold text-zinc-900 mt-0.5">
                            {formatCurrency(mrr)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Growth</p>
                        <p
                            className={`text-sm font-bold mt-0.5 ${growthRate >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                        >
                            {formatPercent(growthRate)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Risk</p>
                        <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border border-current capitalize ${riskColors[riskLevel]}`}
                        >
                            {riskLevel}
                        </span>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100">
                    <VerifiedBadge isVerified={startup.is_verified} />
                </div>
            </div>
        </Link>
    );
}
