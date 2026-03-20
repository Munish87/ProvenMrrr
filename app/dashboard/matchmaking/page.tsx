"use client";

import { useEffect, useState } from "react";
import { saveBuyerInteraction, getMatchedStartups } from "@/app/actions/matchmaking";
import { Settings, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MatchmakingStack } from "@/components/matchmaking/MatchmakingStack";

type Match = {
    startup: any;
    score: number;
    latestSnapshot: any;
    interaction: string | null;
};

export default function MatchesDashboard() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInitialData() {
            try {
                setError(null);
                const res = await getMatchedStartups();
                
                if (res.success && res.matches) {
                    setMatches(res.matches as Match[]);
                } else if (!res.success) {
                    setError(res.error || "Failed to load matches");
                }
            } catch (err) {
                setError("An unexpected error occurred");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInitialData();
    }, []);

    const handleSwipe = async (startupId: string, type: 'interested' | 'skipped') => {
        await saveBuyerInteraction(startupId, type);
    };

    if (isLoading) {
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div className="animate-spin" style={{ width: 48, height: 48, border: "4px solid rgba(0,0,0,0.05)", borderTopColor: "var(--color-accent)", borderRadius: "50%", margin: "0 auto 24px" }} />
                    <p style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 18 }}>Finding your matches...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="page-container" style={{ paddingTop: 100, paddingBottom: 100 }}>
                {/* Header Section */}
                <div style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center", 
                    marginBottom: 48, padding: "0 12px" 
                }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.02em", margin: "0 0 8px 0" }}>
                            Discovery
                        </h1>
                        <p style={{ color: "var(--color-secondary)", fontSize: 16, fontWeight: 500 }}>Swipe through verified startups tailored for you.</p>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <Link href="/dashboard/interested" className="btn btn-secondary" style={{ 
                            textDecoration: "none", 
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "0 20px", height: 44,
                            fontWeight: 600, fontSize: 14,
                             transition: "0.2s"
                        }}>
                            <Heart size={16} fill="var(--color-accent)" color="var(--color-accent)" />
                            Your Matches
                            <ArrowRight size={14} color="var(--color-secondary)" style={{ opacity: 0.6 }} />
                        </Link>
                        <Link href="/dashboard/matchmaking/preferences" className="btn btn-secondary" style={{ 
                            width: 44, height: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--color-secondary)"
                        }}>
                            <Settings size={20} />
                        </Link>
                    </div>
                </div>

                {/* Matchmaking UI */}
                <div style={{ display: "flex", justifyContent: "center", padding: "0 12px" }}>
                    {error ? (
                        <div className="card" style={{ padding: 48, textAlign: "center", maxWidth: 480, width: "100%" }}>
                            <div style={{ background: "rgba(239, 68, 68, 0.1)", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                                <AlertCircle size={32} color="#EF4444" />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Something went wrong</h3>
                            <p style={{ color: "var(--color-secondary)", marginBottom: 32, fontSize: 16, lineHeight: 1.6 }}>{error}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="btn btn-primary"
                                style={{ padding: "12px 32px" }}
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <MatchmakingStack 
                            matches={matches} 
                            onSwipe={handleSwipe} 
                        />
                    )}
                </div>
            </div>
        </>
    );
}

// Helper component for error state since Lucide's AlertCircle wasn't imported
function AlertCircle({ size, color }: { size: number, color: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
