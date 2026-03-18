"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { OfferModal } from "./OfferModal";

interface Props {
    askingPrice: string;
    startupId: string;
    startupName: string;
    revMultiple: string | null;
    profitMultiple: string | null;
}

export function SaleBannerWrapper({ askingPrice, startupId, startupName, revMultiple, profitMultiple }: Props) {
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    return (
        <div style={{
            background: "#FFFBF2",
            border: "1px solid #FDE6B0",
            borderRadius: 16,
            padding: "16px 24px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#FDE6B0", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16 }}>💰</span>
                </div>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#925A0F", margin: 0, marginBottom: 2 }}>
                        This startup is for sale. Asking price: {askingPrice}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#AC7216", fontWeight: 500 }}>
                        {revMultiple && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7L13 15L9 11L3 17" /><path d="M21 13V7H15" /></svg>
                                {revMultiple}x revenue
                            </div>
                        )}
                        {profitMultiple && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: "10px" }}>🟢</span>
                                {profitMultiple}x profit
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                    onClick={() => setIsSaved(!isSaved)}
                    style={{
                        padding: "8px 16px",
                        background: "white",
                        border: "1px solid #FDE6B0",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#925A0F",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: isSaved ? 0.7 : 1
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "#925A0F" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    {isSaved ? "Saved" : "Save"}
                </button>
                <button
                    onClick={() => setIsOfferModalOpen(true)}
                    style={{
                        padding: "8px 16px",
                        background: "#EA580C",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Contact Seller
                </button>
            </div>

            <OfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                startupId={startupId}
                startupName={startupName}
            />
        </div>
    );
}
