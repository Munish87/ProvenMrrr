"use client";

import { useState } from "react";
import { StartupDiscoveryCard } from "./StartupDiscoveryCard";

interface CategoryStartupListProps {
    startups: any[];
    snapMap: Record<string, any>;
}

export function CategoryStartupList({ startups, snapMap }: CategoryStartupListProps) {
    const [visibleCount, setVisibleCount] = useState(50);

    const displayedStartups = startups.slice(0, visibleCount);
    const hasMore = visibleCount < startups.length;

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 50);
    };

    return (
        <div
            className="glass"
            style={{
                padding: 28,
                borderRadius: 32,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div className="startup-grid-container" style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))", 
                gap: 22,
                animation: "fadeInUp 0.6s ease-out"
            }}>
                {displayedStartups.map((s, index) => (
                    <div 
                        key={s.id}
                        style={{
                            animation: `fadeInUp 0.5s ease-out forwards`,
                            animationDelay: `${Math.min(index % 50, 20) * 0.05}s`,
                            opacity: 0
                        }}
                    >
                        <StartupDiscoveryCard 
                            s={s} 
                            snap={snapMap[s.id]} 
                        />
                    </div>
                ))}
            </div>

            {hasMore && (
                <div style={{ 
                    marginTop: 48, 
                    display: "flex", 
                    justifyContent: "center",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 32
                }}>
                    <button
                        onClick={handleLoadMore}
                        className="btn btn-secondary"
                        style={{
                            padding: "12px 32px",
                            fontSize: 15,
                            fontWeight: 600,
                            borderRadius: 14,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: "var(--color-surface-strong)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text)",
                            display: "flex",
                            alignItems: "center",
                            gap: 10
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "var(--color-accent)";
                            e.currentTarget.style.color = "white";
                            e.currentTarget.style.transform = "translateY(-1px)";
                            const lastSpan = e.currentTarget.lastElementChild as HTMLElement;
                            if (lastSpan) {
                                lastSpan.style.background = "rgba(255,255,255,0.2)";
                                lastSpan.style.color = "white";
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "var(--color-surface-strong)";
                            e.currentTarget.style.color = "var(--color-text)";
                            e.currentTarget.style.transform = "translateY(0)";
                            const lastSpan = e.currentTarget.lastElementChild as HTMLElement;
                            if (lastSpan) {
                                lastSpan.style.background = "var(--color-bg-soft)";
                                lastSpan.style.color = "var(--color-accent)";
                            }
                        }}
                    >
                        <span>Load more startups</span>
                        <span style={{ 
                            fontSize: 12, 
                            fontWeight: 700,
                            background: "var(--color-bg-soft)",
                            color: "var(--color-accent)",
                            padding: "2px 10px",
                            borderRadius: "10px",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
                        }}>
                            {startups.length - visibleCount} remaining
                        </span>
                    </button>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
