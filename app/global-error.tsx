"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
            console.error("[global-error]", error);
        }
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1.5rem",
                    padding: "2rem",
                    textAlign: "center",
                    background: "#0a0a0f",
                    color: "#fff",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                <div style={{ fontSize: "3rem" }}>💥</div>
                <p style={{ fontSize: "0.75rem", color: "#555", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>ProvenMRR</p>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
                    Critical Error
                </h1>
                <p style={{ color: "#999", maxWidth: 400, margin: 0 }}>
                    Something went critically wrong. Please refresh or return home.
                </p>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.6rem 1.4rem",
                            borderRadius: "0.5rem",
                            background: "#7c3aed",
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
            </body>
        </html>
    );
}
