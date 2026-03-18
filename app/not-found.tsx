import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page Not Found – ProvenMRR",
    description: "The page you're looking for doesn't exist.",
    robots: { index: false },
};

export default function NotFound() {
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
            <div
                style={{
                    fontSize: "5rem",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                }}
            >
                404
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
                Page not found
            </h1>
            <p style={{ color: "var(--color-text-muted, #999)", maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
                The page you&apos;re looking for doesn&apos;t exist or may have been
                moved. Let&apos;s get you back on track.
            </p>
            <Link
                href="/"
                style={{
                    padding: "0.65rem 1.6rem",
                    borderRadius: "0.5rem",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    marginTop: "0.5rem",
                }}
            >
                Back to ProvenMRR
            </Link>
        </div>
    );
}
