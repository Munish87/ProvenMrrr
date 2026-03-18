"use client";

import { useState } from "react";

export function AnonymityToggle({ initialValue }: { initialValue: boolean }) {
    const [isAnonymous, setIsAnonymous] = useState(initialValue);

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#F9FAFB", borderRadius: 8, border: "1px solid var(--color-border)" }}>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Anonymous mode</p>
                <p style={{ fontSize: 11, color: "var(--color-secondary)" }}>Hide your identity, logo, and website from public visitors.</p>
            </div>
            <input type="hidden" name="is_anonymous" value={isAnonymous.toString()} />
            <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                style={{
                    position: "relative", display: "inline-block", width: 44, height: 24,
                    backgroundColor: isAnonymous ? "#312E81" : "#E5E7EB",
                    transition: ".2s", borderRadius: 24, border: "none", cursor: "pointer"
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
