"use client";

import { useState } from "react";

export function AnonymityToggle({ initialValue }: { initialValue: boolean }) {
    const [isAnonymous, setIsAnonymous] = useState(initialValue);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                background: isAnonymous
                    ? "linear-gradient(135deg, color-mix(in srgb, #7ea1ff 20%, transparent), color-mix(in srgb, #7ea1ff 8%, var(--color-surface)) 34%, var(--color-surface) 100%)"
                    : "var(--color-surface)",
                borderRadius: 18,
                border: `1px solid ${isAnonymous ? "rgba(126, 161, 255, 0.28)" : "var(--color-border)"}`,
                boxShadow: "var(--shadow-card)",
                transition: "all 0.2s ease",
            }}
        >
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>Anonymous mode</p>
                <p style={{ fontSize: 12, color: isAnonymous ? "var(--color-accent)" : "var(--color-secondary)", lineHeight: 1.5 }}>
                    Hide your identity, logo, and website from public visitors.
                </p>
            </div>
            <input type="hidden" name="is_anonymous" value={isAnonymous.toString()} />
            <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                style={{
                    position: "relative", display: "inline-block", width: 44, height: 24,
                    background: isAnonymous ? "linear-gradient(135deg, #7ea1ff, #5b7cff)" : "rgba(224, 232, 239, 0.18)",
                    transition: ".2s", borderRadius: 24, border: "1px solid rgba(224, 232, 239, 0.16)", cursor: "pointer",
                    boxShadow: isAnonymous ? "0 10px 18px rgba(91, 124, 255, 0.24)" : "none"
                }}
            >
                <span style={{
                    position: "absolute", content: '""', height: 18, width: 18, left: 3, top: 3,
                    backgroundColor: "white", transition: ".2s", borderRadius: "50%",
                    transform: isAnonymous ? "translateX(20px)" : "translateX(0)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                }} />
            </button>
        </div>
    );
}
