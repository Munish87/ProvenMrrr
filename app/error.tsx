"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
            console.error("[app/error]", error);
        }
    }, [error]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.5rem",
                padding: "2rem",
                textAlign: "center",
                background: "var(--color-bg, #0a0a0f)",
                color: "var(--color-text, #fff)",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
        >
            <div style={{ fontSize: "3rem" }}>⚡</div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
                Something went wrong
            </h1>
            <p style={{ color: "var(--color-text-muted, #999)", maxWidth: 400, margin: 0 }}>
                An unexpected error occurred. Our team has been notified. You can try
                again or return home.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
                <button
                    onClick={reset}
                    style={{
                        padding: "0.6rem 1.4rem",
                        borderRadius: "0.5rem",
                        background: "var(--color-accent, #7c3aed)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                    }}
                >
                    Try again
                </button>
                <Link
                    href="/"
                    style={{
                        padding: "0.6rem 1.4rem",
                        borderRadius: "0.5rem",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                    }}
                >
                    Go home
                </Link>
            </div>
        </div>
    );
}
