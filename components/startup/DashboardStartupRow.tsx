"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { HealthScoreBadge } from "./HealthScoreBadge";
import { ListingPlanModal } from "./ListingPlanModal";
import { formatCurrency } from "@/lib/utils";

interface DashboardStartupRowProps {
    startup: {
        id: string;
        name: string;
        is_verified: boolean;
        is_listed_for_sale: boolean;
    };
    score?: number;
    snap?: { mrr: number; growth_rate: number };
}

export function DashboardStartupRow({ startup, score, snap }: DashboardStartupRowProps) {
    const [showModal, setShowModal] = useState(false);
    const [priceLabel, setPriceLabel] = useState("$9.99");

    useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset();
        const locale = navigator.language;
        if (tz.includes("Asia/Calcutta") || tz.includes("Asia/Kolkata") || offset === -330 || locale.includes("IN")) {
            setPriceLabel("₹849");
        } else if (tz.includes("Canada")) {
            setPriceLabel("$13.99");
        } else if (tz.includes("London")) {
            setPriceLabel("£7.99");
        } else if (tz.includes("Europe") || tz.includes("Paris") || tz.includes("Berlin")) {
            setPriceLabel("€9.49");
        } else {
            setPriceLabel("$9.99");
        }
    }, []);

    return (
        <>
            <div style={{ position: "relative" }}>
                <Link href={`/dashboard/startups?id=${startup.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <div className="hover:bg-white/5" style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div className="startup-card-logo" style={{ width: 36, height: 36, fontSize: 14 }}>
                                {startup.name.charAt(0)}
                            </div>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{startup.name}</p>
                                <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 1, margin: "1px 0 0", fontWeight: 500 }}>
                                    {startup.is_verified ? "✓ Verified" : "Not verified"}
                                    {snap ? ` · MRR ${formatCurrency(snap.mrr)}` : ""}
                                    {startup.is_listed_for_sale && <span className="tag-forsale" style={{ marginLeft: 8 }}>FOR SALE</span>}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {!startup.is_listed_for_sale && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowModal(true);
                                    }}
                                    style={{
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: "#6366F1",
                                        color: "white",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4
                                    }}
                                >
                                    <Zap size={10} fill="white" /> Sell for {priceLabel}
                                </button>
                            )}
                            {score !== undefined ? (
                                <HealthScoreBadge score={score} size="sm" />
                            ) : (
                                <span style={{ fontSize: 11, color: "var(--color-secondary)", fontWeight: 600, padding: "4px 10px", border: "1px solid var(--color-border)", borderRadius: 8, background: "rgba(0,0,0,0.02)" }}>
                                    Connect Stripe
                                </span>
                            )}
                            <ArrowRight size={14} color="var(--color-border)" />
                        </div>
                    </div>
                </Link>
            </div>

            <ListingPlanModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    window.location.href = `/dashboard/startups?id=${startup.id}&list=true`;
                }}
                startupId={startup.id}
                startupName={startup.name}
            />
        </>
    );
}
