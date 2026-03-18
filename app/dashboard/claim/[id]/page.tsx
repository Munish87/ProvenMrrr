"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { claimStartupWithApiKey } from "@/app/actions/claim";
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ClaimVerificationPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleClaim(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await claimStartupWithApiKey(id, apiKey);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } else {
            setError(result.error || "Failed to claim startup.");
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div style={{ display: "flex", minHeight: "70vh", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
                <CheckCircle size={64} style={{ color: "var(--color-positive)", marginBottom: 24 }} />
                <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Ownership Verified!</h1>
                <p style={{ color: "var(--color-secondary)", marginBottom: 32, maxWidth: 400, lineHeight: 1.5 }}>
                    You have successfully claimed this startup. You are now redirected to the profile.
                </p>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <Loader2 className="animate-spin" style={{ color: "var(--color-accent)" }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-accent)" }}>Redirecting...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px" }}>
            <Link href={`/startup/${id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-secondary)", textDecoration: "none", marginBottom: 32, fontWeight: 500 }}>
                <ArrowLeft size={16} /> Back to startup
            </Link>

            <div className="card" style={{ padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent)", marginBottom: 24 }}>
                    <ShieldCheck size={28} />
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>Verify Ownership</h1>
                <p style={{ color: "var(--color-secondary)", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
                    To claim this profile, please enter the same <strong>Stripe Restricted API Key</strong> used for the initial data submission. This ensures you are the rightful owner.
                </p>

                <form onSubmit={handleClaim} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div>
                        <label className="field-label" style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>
                            Restricted API Key
                        </label>
                        <input
                            type="password"
                            required
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="rk_live_..."
                            className="field-input"
                        />
                    </div>

                    {error && (
                        <div style={{ display: "flex", gap: 12, padding: 16, borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 14 }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !apiKey}
                        className="btn btn-primary"
                        style={{ width: "100%", height: 48, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (loading || !apiKey) ? 0.6 : 1, cursor: (loading || !apiKey) ? "not-allowed" : "pointer" }}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Claim"}
                    </button>
                </form>

                <p style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "var(--color-secondary)" }}>
                    Keys are only used for one-time verification.
                </p>
            </div>
        </div>
    );
}
