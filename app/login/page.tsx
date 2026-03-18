"use client";

import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const { user } = useAuth();
    const nextPath = searchParams.get("next") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"email" | "code">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const codeInputRef = useRef<HTMLInputElement>(null);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push(nextPath);
        }
    }, [user, router, nextPath]);

    // Auto-focus code input when step changes
    useEffect(() => {
        if (step === "code" && codeInputRef.current) {
            codeInputRef.current.focus();
        }
    }, [step]);

    // Auto-submit OTP when 6 digits are entered
    useEffect(() => {
        if (code.length === 6 && step === "code") {
            handleVerifyCode();
        }
    }, [code, step]);

    const handleSendCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError("");
        setLoading(true);

        // DEMO OVERRIDE: Bypass OTP email sending entirely
        if (email === "demo@provenmrr.com" && password.length > 0) {
            const { error: pwError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (pwError) {
                setError(pwError.message);
                setLoading(false);
            } else {
                router.push(nextPath);
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

    const handleVerifyCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: "email",
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            // If code is wrong, clear it so user can try again
            if (error.message.toLowerCase().includes("invalid")) {
                setCode("");
            }
        } else {
            router.push(nextPath);
            router.refresh();
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
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
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Ambient Background Glows */}
            <div style={{
                position: "absolute",
                top: "20%",
                left: "20%",
                width: "40vw",
                height: "40vw",
                background: "radial-gradient(circle, rgba(126, 161, 255, 0.08) 0%, transparent 70%)",
                zIndex: 0,
                pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute",
                bottom: "10%",
                right: "10%",
                width: "50vw",
                height: "50vw",
                background: "radial-gradient(circle, rgba(52, 211, 153, 0.05) 0%, transparent 70%)",
                zIndex: 0,
                pointerEvents: "none"
            }} />

            <Link href="/" style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 40,
                textDecoration: "none", color: "var(--color-text)", fontWeight: 800, fontSize: 24,
                letterSpacing: "-0.5px", zIndex: 1, transition: "transform 0.2s"
            }}>
                <span style={{ 
                    width: 12, height: 12, borderRadius: "50%", 
                    background: "linear-gradient(135deg, #7ea1ff 0%, #5b7cff 100%)",
                    boxShadow: "0 0 15px rgba(91, 124, 255, 0.4)"
                }} />
                ProvenMRR
            </Link>

            <div className="card" style={{ 
                width: "100%", maxWidth: 420, zIndex: 1,
                padding: "40px 32px",
                border: "1px solid var(--color-border)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.4)"
            }}>
                {step === "email" ? (
                    <>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", marginBottom: 8, letterSpacing: "-0.8px" }}>
                            Welcome back
                        </h1>
                        <p style={{ fontSize: 15, color: "var(--color-secondary)", marginBottom: 32, lineHeight: 1.5 }}>
                            Sign in to your account to manage your startups and access verified data.
                        </p>

                        <button 
                            onClick={handleGoogleSignIn} 
                            className="btn btn-secondary" 
                            style={{ 
                                width: "100%", height: 50, marginBottom: 24, 
                                display: "flex", justifyContent: "center", alignItems: "center", 
                                gap: 12, fontSize: 15, fontWeight: 700
                            }}
                            disabled={loading}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {loading ? "Connecting..." : "Continue with Google"}
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border)", opacity: 0.5 }} />
                            <span style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>or email</span>
                            <div style={{ flex: 1, height: 1, background: "var(--color-border)", opacity: 0.5 }} />
                        </div>

                        <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div>
                                <label className="field-label" htmlFor="email">Email address</label>
                                <input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    className="field-input" 
                                    placeholder="name@company.com" 
                                    disabled={loading}
                                    style={{ height: 48, fontSize: 15 }}
                                />
                            </div>

                            {email === "demo@provenmrr.com" && (
                                <div style={{ animation: "fadeIn 0.3s ease" }}>
                                    <label className="field-label" htmlFor="password">Demo Password</label>
                                    <input 
                                        id="password" 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="field-input" 
                                        placeholder="••••••••" 
                                        disabled={loading}
                                        style={{ height: 48, fontSize: 15 }}
                                    />
                                </div>
                            )}

                            {error && (
                                <div style={{ 
                                    padding: "12px", background: "rgba(248, 113, 113, 0.1)", 
                                    borderRadius: "12px", border: "1px solid rgba(248, 113, 113, 0.2)"
                                }}>
                                    <p style={{ fontSize: 13, color: "var(--color-negative)", textAlign: "center", fontWeight: 500 }}>{error}</p>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 50, marginTop: 8, fontSize: 15, fontWeight: 700 }} disabled={loading}>
                                {loading ? "Sending..." : "Send secure login link"}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", marginBottom: 8, letterSpacing: "-0.8px" }}>
                            Check your inbox
                        </h1>
                        <p style={{ fontSize: 15, color: "var(--color-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
                            We&apos;ve sent a 6-digit code to <strong style={{ color: "var(--color-text)", fontWeight: 700 }}>{email}</strong>. Enter it below to sign in instantly.
                        </p>

                        <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            <div>
                                <label className="field-label" htmlFor="code" style={{ textAlign: "center", width: "100%" }}>Verification Code</label>
                                <input 
                                    id="code" 
                                    ref={codeInputRef}
                                    type="text" 
                                    value={code} 
                                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))} 
                                    required 
                                    className="field-input" 
                                    placeholder="000 000" 
                                    style={{ 
                                        letterSpacing: "0.4em", 
                                        fontSize: "24px", 
                                        textAlign: "center",
                                        height: 64,
                                        fontWeight: 800,
                                        background: "rgba(255,255,255,0.03)"
                                    }} 
                                    disabled={loading} 
                                    autoComplete="one-time-code" 
                                />
                            </div>

                            {error && (
                                <div style={{ 
                                    padding: "12px", background: "rgba(248, 113, 113, 0.1)", 
                                    borderRadius: "12px", border: "1px solid rgba(248, 113, 113, 0.2)"
                                }}>
                                    <p style={{ fontSize: 13, color: "var(--color-negative)", textAlign: "center", fontWeight: 500 }}>{error}</p>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 54, fontSize: 16, fontWeight: 700 }} disabled={loading || code.length !== 6}>
                                {loading ? "Verifying..." : "Sign In to ProvenMRR"}
                            </button>
                            
                            <div style={{ textAlign: "center" }}>
                                <button 
                                    type="button" 
                                    onClick={() => { setStep("email"); setCode(""); setError(""); }} 
                                    style={{ 
                                        background: "none", border: "none", color: "var(--color-muted)", 
                                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                                        textDecoration: "underline", textUnderlineOffset: "4px"
                                    }} 
                                    disabled={loading}
                                >
                                    Use a different email address
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
            
            <p style={{ marginTop: 32, fontSize: 13, color: "var(--color-muted)", zIndex: 1, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
                By continuing, you agree to ProvenMRR&apos;s Terms of Service and Privacy Policy.
            </p>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{ 
                minHeight: "100vh", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "var(--color-bg)"
            }}>
                <div style={{ 
                    width: 40, height: 40, 
                    border: "3px solid rgba(126, 161, 255, 0.1)",
                    borderTopColor: "#7ea1ff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
