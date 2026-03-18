"use client";

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"email" | "code">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // DEMO OVERRIDE: Bypass OTP email sending entirely
        if (email === "demo@vetra.app" && password.length > 0) {
            const { error: pwError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (pwError) {
                setError(pwError.message);
                setLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
        });

        if (error) {
            setError(error.message);
        } else {
            setStep("code");
        }
        setLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: "email",
        });

        if (error) {
            setError(error.message);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
        setLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setError("");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--color-bg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
        }}>
            <Link href="/" style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 32,
                textDecoration: "none", color: "var(--color-text)", fontWeight: 700, fontSize: 18,
            }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
                Vetra
            </Link>

            <div className="card" style={{ width: "100%", maxWidth: 400 }}>
                {step === "email" ? (
                    <>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 6, letterSpacing: "-0.3px" }}>
                            Welcome to Vetra
                        </h1>
                        <p style={{ fontSize: 14, color: "var(--color-secondary)", marginBottom: 28 }}>
                            Sign in or create an account to continue.
                        </p>

                        <button onClick={handleGoogleSignIn} className="btn btn-secondary" style={{ width: "100%", height: 44, marginBottom: 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                            <span style={{ fontSize: 13, color: "var(--color-secondary)" }}>or continue with email</span>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                        </div>

                        <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label className="field-label" htmlFor="email">Email address</label>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field-input" placeholder="you@example.com" disabled={loading} />
                            </div>

                            {email === "demo@vetra.app" && (
                                <div>
                                    <label className="field-label" htmlFor="password">Demo Password (Bypass Override)</label>
                                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" placeholder="Enter demo password" disabled={loading} />
                                </div>
                            )}

                            {error && <p style={{ fontSize: 13, color: "var(--color-negative)", marginTop: -4 }}>{error}</p>}
                            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 44, marginTop: 4, fontSize: 15 }} disabled={loading}>
                                {loading ? "Sending code..." : "Send login code"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 6, letterSpacing: "-0.3px" }}>
                            Check your email
                        </h1>
                        <p style={{ fontSize: 14, color: "var(--color-secondary)", marginBottom: 28, lineHeight: 1.5 }}>
                            We sent a 6-digit login code to <strong style={{ color: "var(--color-text)" }}>{email}</strong>. Entering it below will automatically sign you in.
                        </p>

                        <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label className="field-label" htmlFor="code">Login Code</label>
                                <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))} required className="field-input" placeholder="000000" style={{ letterSpacing: "0.2em", fontSize: "18px", textAlign: "center" }} disabled={loading} autoComplete="one-time-code" />
                            </div>
                            {error && <p style={{ fontSize: 13, color: "var(--color-negative)", marginTop: -4 }}>{error}</p>}
                            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 44, marginTop: 4, fontSize: 15 }} disabled={loading || code.length !== 6}>
                                {loading ? "Verifying..." : "Verify & Sign In"}
                            </button>
                            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} className="btn btn-secondary" style={{ width: "100%", height: 44, background: "transparent", border: "none" }} disabled={loading}>
                                Use a different email
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
