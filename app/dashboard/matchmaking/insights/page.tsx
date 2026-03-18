"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DemandInsights() {
    const [stats, setStats] = useState<{ categoryDesc: [string, number][], avgBudget: number, totalBuyers: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInsights() {
            const supabase = createClient();
            const { data } = await supabase.from("buyer_preferences").select("categories, max_budget");
            
            if (data && data.length > 0) {
                const catCounts: Record<string, number> = {};
                let totalBudget = 0;
                let budgetCount = 0;

                data.forEach(pref => {
                    // Count categories
                    if (pref.categories) {
                        pref.categories.forEach((cat: string) => {
                            catCounts[cat] = (catCounts[cat] || 0) + 1;
                        });
                    }
                    
                    // Average max budget
                    if (pref.max_budget) {
                        totalBudget += pref.max_budget;
                        budgetCount++;
                    }
                });

                const sortedCategories = Object.entries(catCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5); // top 5

                setStats({
                    categoryDesc: sortedCategories,
                    avgBudget: budgetCount > 0 ? totalBudget / budgetCount : 0,
                    totalBuyers: data.length
                });
            }
            
            setIsLoading(false);
        }
        
        // This is a minimal public/internal insight view
        // In reality, this data might be aggregated server-side to prevent exposing individual preferences.
        fetchInsights();
    }, []);

    if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: "var(--color-secondary)" }}>Loading insights...</div>;

    if (!stats || stats.totalBuyers === 0) {
        return (
            <div style={{ background: "var(--color-card)", padding: 48, borderRadius: 16, textAlign: "center", border: "1px solid var(--color-border)" }}>
                <p style={{ color: "var(--color-secondary)" }}>Not enough data to generate insights yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Key Metric 1 */}
                <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", padding: 24, borderRadius: 16 }}>
                    <p style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Active Buyers</p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>{stats.totalBuyers}</p>
                    <p style={{ fontSize: 13, color: "var(--color-secondary)", marginTop: 8 }}>Configured acquisition criteria</p>
                </div>

                {/* Key Metric 2 */}
                <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", padding: 24, borderRadius: 16 }}>
                    <p style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Avg. Max Budget</p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>
                        {stats.avgBudget > 0 ? `$${Math.round(stats.avgBudget).toLocaleString()}` : "N/A"}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--color-secondary)", marginTop: 8 }}>Based on stated buyer capacity</p>
                </div>
            </div>

            {/* Top Categories Chart (Text based) */}
            <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", padding: 24, borderRadius: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 20 }}>Most Demanded Categories</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {stats.categoryDesc.map(([cat, count], index) => {
                        const percentage = Math.round((count / stats.totalBuyers) * 100);
                        return (
                            <div key={cat}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{index + 1}. {cat}</span>
                                    <span style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 500 }}>{percentage}% of buyers</span>
                                </div>
                                <div style={{ width: "100%", height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: `${percentage}%`, height: "100%", background: "var(--color-accent)", borderRadius: 4 }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
