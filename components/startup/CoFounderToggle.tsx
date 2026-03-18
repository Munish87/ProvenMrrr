"use client";

import { useState } from "react";

export function CoFounderToggle({ initialValue }: { initialValue: boolean }) {
    const [isLooking, setIsLooking] = useState(initialValue);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "18px",
                background: isLooking
                    ? "linear-gradient(135deg, color-mix(in srgb, #34d399 22%, transparent), color-mix(in srgb, #34d399 8%, var(--color-surface)) 34%, var(--color-surface) 100%)"
                    : "var(--color-surface)",
                borderRadius: 18,
                border: `1px solid ${isLooking ? "rgba(52, 211, 153, 0.3)" : "var(--color-border)"}`,
                boxShadow: "var(--shadow-card)",
                marginBottom: 0,
                transition: "all 0.2s ease"
            }}
        >
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>Looking for a co-founder?</p>
                <p style={{ fontSize: 12, color: isLooking ? "var(--listing-card-sale-accent)" : "var(--color-secondary)", lineHeight: 1.5 }}>
                    Turn this on with one click to list your startup on the <b>Co-founders</b> page and discover potential builder partners.
                </p>
            </div>
            <input type="hidden" name="looking_for_cofounder" value={isLooking.toString()} />
            <button
                type="button"
                onClick={() => setIsLooking(!isLooking)}
                style={{
                    position: "relative", display: "inline-block", width: 44, height: 24,
                    background: isLooking ? "linear-gradient(135deg, #34d399, #059669)" : "rgba(224, 232, 239, 0.18)",
                    transition: ".2s", borderRadius: 24, border: "1px solid rgba(224, 232, 239, 0.16)", cursor: "pointer",
                    flexShrink: 0
                }}
            >
                <span style={{
                    position: "absolute", content: '""', height: 18, width: 18, left: 3, top: 3,
                    backgroundColor: "white", transition: ".2s", borderRadius: "50%",
                    transform: isLooking ? "translateX(20px)" : "translateX(0)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                }} />
            </button>
        </div>
    );
}
