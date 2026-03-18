"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";

export function SoldToggle({
    id,
    initialValue,
    onToggle,
    disabled = false,
}: {
    id: string;
    initialValue: boolean;
    onToggle: (id: string, nextValue: boolean) => Promise<void>;
    disabled?: boolean;
}) {
    const [isSold, setIsSold] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsSold(initialValue);
    }, [initialValue]);

    const handleToggle = async () => {
        if (disabled || isLoading) return;

        const nextValue = !isSold;
        const previousValue = isSold;
        setIsLoading(true);
        setIsSold(nextValue);
        try {
            await onToggle(id, nextValue);
        } catch (error) {
            setIsSold(previousValue);
            const message = error instanceof Error ? error.message : "Couldn't update sold status.";
            if (typeof window !== "undefined") {
                window.alert(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                background: isSold
                    ? "linear-gradient(135deg, color-mix(in srgb, #ef4444 18%, transparent), color-mix(in srgb, #ef4444 8%, var(--color-surface)) 34%, var(--color-surface) 100%)"
                    : "var(--color-surface)",
                borderRadius: 18,
                border: `1px solid ${isSold ? "color-mix(in srgb, #ef4444 28%, var(--color-border))" : "var(--color-border)"}`,
                boxShadow: "var(--shadow-card)",
                transition: "all 0.2s ease",
            }}
        >
            <input type="hidden" name="sale_status_override" value={isSold ? "sold" : ""} />
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isSold ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "var(--color-surface-strong)",
                    border: `1px solid ${isSold ? "rgba(255,255,255,0.16)" : "var(--color-border)"}`,
                    color: isSold ? "#fff" : "var(--color-secondary)",
                }}
            >
                <BadgeCheck size={20} />
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>Mark as sold</p>
                <p style={{ fontSize: 12, color: isSold ? "color-mix(in srgb, #ef4444 58%, var(--color-text))" : "var(--color-secondary)", lineHeight: 1.5 }}>
                    {isSold ? "This listing will show a SOLD tag and red sold card across the marketplace." : "Turn this on after the startup has been sold."}
                </p>
            </div>
            <button
                type="button"
                disabled={disabled || isLoading}
                onClick={handleToggle}
                style={{
                    position: "relative",
                    display: "inline-block",
                    width: 44,
                    height: 24,
                    background: isSold ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "var(--color-surface-strong)",
                    transition: ".2s",
                    borderRadius: 24,
                    border: "1px solid var(--color-border)",
                    cursor: disabled || isLoading ? "not-allowed" : "pointer",
                    opacity: disabled || isLoading ? 0.6 : 1,
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        height: 18,
                        width: 18,
                        left: 3,
                        top: 3,
                        backgroundColor: "white",
                        transition: ".2s",
                        borderRadius: "50%",
                        transform: isSold ? "translateX(20px)" : "translateX(0)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                />
            </button>
        </div>
    );
}
