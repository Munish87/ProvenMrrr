"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: document.title,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <button onClick={handleShare} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {copied ? <Check size={14} color="var(--color-positive)" /> : <Share2 size={14} />}
            {copied ? <span style={{ color: "var(--color-positive)" }}>Copied</span> : "Share"}
        </button>
    );
}
