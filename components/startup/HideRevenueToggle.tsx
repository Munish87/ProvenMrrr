"use client";

import { useState } from "react";

export function HideRevenueToggle({ initialValue }: { initialValue: boolean }) {
    const [isHidden, setIsHidden] = useState(initialValue);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "18px",
                background: isHidden
                    ? "linear-gradient(135deg, color-mix(in srgb, #f87171 22%, transparent), color-mix(in srgb, #f87171 8%, var(--color-surface)) 34%, var(--color-surface) 100%)"
                    : "var(--color-surface)",
                borderRadius: 18,
                border: `1px solid ${isHidden ? "rgba(248, 113, 113, 0.28)" : "var(--color-border)"}`,
                boxShadow: "var(--shadow-card)",
                marginBottom: 0,
                transition: "all 0.2s ease"
            }}
        >
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>Hide Real-Time Revenue?</p>
                <p style={{ fontSize: 12, color: isHidden ? "var(--listing-card-sold-accent)" : "var(--color-secondary)", lineHeight: 1.5 }}>
                    Turn this on to entirely hide the "Financial Health & Revenue Dashboard" from prospective buyers on your public profile.
                </p>
            </div>
            <input type="hidden" name="hide_real_time_revenue" value={isHidden.toString()} />
            <button
                type="button"
                onClick={() => setIsHidden(!isHidden)}
                style={{
                    position: "relative", display: "inline-block", width: 44, height: 24,
                    background: isHidden ? "linear-gradient(135deg, #f87171, #dc2626)" : "rgba(224, 232, 239, 0.18)",
                    transition: ".2s", borderRadius: 24, border: "1px solid rgba(224, 232, 239, 0.16)", cursor: "pointer",
                    flexShrink: 0
                }}
            >
                <span style={{
                    position: "absolute", content: '""', height: 18, width: 18, left: 3, top: 3,
                    backgroundColor: "white", transition: ".2s", borderRadius: "50%",
                    transform: isHidden ? "translateX(20px)" : "translateX(0)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                }} />
            </button>
        </div>
    );
}
