"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail, DollarSign, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface OfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    startupId: string;
    startupName: string;
}

export function OfferModal({ isOpen, onClose, startupId, startupName }: OfferModalProps) {
    const [buyerEmail, setBuyerEmail] = useState("");
    const [offerAmount, setOfferAmount] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    // Auto-fill user email if authenticated
    useEffect(() => {
        setMounted(true);
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                setBuyerEmail(session.user.email);
                setSessionToken(session.access_token);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-relay`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {})
                },
                body: JSON.stringify({
                    startupId,
                    buyerEmail,
                    offerAmount,
                    messageBody
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to relay offer to founder.");
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "An unexpected network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'var(--modal-overlay-bg)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: 24,
    };

    const contentStyle: React.CSSProperties = {
        width: 480,
        maxWidth: '92%',
        background: 'var(--modal-card-bg)',
        borderRadius: 28,
        border: '1px solid var(--modal-card-border)',
        boxShadow: 'var(--modal-card-shadow)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        padding: 32,
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 16px",
        border: "1px solid var(--modal-input-border)",
        borderRadius: 16,
        fontSize: 15,
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
        background: "var(--modal-input-bg)",
        color: "var(--color-text)",
        boxShadow: "var(--modal-input-shadow)",
    };

    if (isSuccess) {
        return createPortal(
            <div style={overlayStyle} onClick={onClose}>
                <div style={{ ...contentStyle, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <div style={{ width: 64, height: 64, background: "color-mix(in srgb, #10b981 16%, var(--color-surface))", border: "1px solid color-mix(in srgb, #10b981 28%, var(--color-border))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <Mail color="#34d399" size={32} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text)", letterSpacing: "-0.5px" }}>Offer Sent!</h2>
                    <p style={{ margin: "0 0 32px", color: "var(--color-secondary)", lineHeight: 1.6, fontSize: 15 }}>
                        Your offer of <strong>${Number(offerAmount).toLocaleString()}</strong> has been securely routed directly to the founder of {startupName}. They will reply to your email directly if interested.
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            width: "100%",
                            background: "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                            color: "white",
                            border: "none",
                            padding: "14px 24px",
                            borderRadius: 999,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "background 0.2s",
                            boxShadow: "0 16px 28px rgba(91, 124, 255, 0.24), inset 0 1px 0 rgba(255,255,255,0.24)"
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={contentStyle}>
                <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "var(--modal-close-bg)", border: "1px solid var(--modal-close-border)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-secondary)" }}>
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--color-text)", letterSpacing: "-0.5px" }}>Make an Offer</h2>
                <p style={{ margin: "0 0 24px", color: "var(--color-secondary)", fontSize: 14, lineHeight: 1.5 }}>
                    Connect directly with the founder of <strong>{startupName}</strong>. ProvenMRR bridges your message securely.
                </p>

                {error && (
                    <div style={{ background: "color-mix(in srgb, #ef4444 14%, var(--color-surface))", color: "color-mix(in srgb, #ef4444 58%, var(--color-text))", padding: "12px 16px", borderRadius: 14, marginBottom: 24, fontSize: 14, border: "1px solid color-mix(in srgb, #ef4444 26%, var(--color-border))" }}>
                        {error}
                    </div>
                )}

                {!sessionToken ? (
                    <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
                        <div style={{ width: 48, height: 48, background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "var(--shadow-card)" }}>
                            <Mail color="var(--color-secondary)" size={24} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", margin: "0 0 8px" }}>Authentication Required</h3>
                        <p style={{ color: "var(--color-secondary)", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" }}>
                            You must be signed in to contact founders and make offers on startups.
                        </p>
                        <Link href="/login" style={{
                            display: "inline-block",
                            background: "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: 999,
                            fontSize: 14,
                            fontWeight: 700,
                            textDecoration: "none",
                            transition: "background 0.2s",
                            boxShadow: "0 16px 28px rgba(91,124,255,0.24), inset 0 1px 0 rgba(255,255,255,0.24)"
                        }}>
                            Sign in to continue
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8, display: "block" }}>
                                Offer Amount (USD)
                            </label>
                            <div style={{ position: "relative" }}>
                                <DollarSign size={18} color="var(--color-secondary)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="50000"
                                    value={offerAmount}
                                    onChange={e => setOfferAmount(e.target.value)}
                                    style={{
                                        ...inputStyle,
                                        padding: "12px 16px 12px 40px",
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8, display: "block" }}>
                                Your Email Address
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="you@company.com"
                                value={buyerEmail}
                                onChange={e => setBuyerEmail(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8, display: "block" }}>
                                Message to Founder
                            </label>
                            <textarea
                                required
                                placeholder="Hi there, I'm highly interested in acquiring your project..."
                                value={messageBody}
                                onChange={e => setMessageBody(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    minHeight: 120,
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    width: "100%",
                                    background: "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                                    color: "white",
                                    border: "none",
                                    padding: "14px 24px",
                                    borderRadius: 999,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                    opacity: isSubmitting ? 0.8 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    transition: "background 0.2s",
                                    boxShadow: "0 16px 28px rgba(91,124,255,0.24), inset 0 1px 0 rgba(255,255,255,0.24)"
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Sending Offer securely...
                                    </>
                                ) : (
                                    "Send securely"
                                )}
                            </button>
                            <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-secondary)", marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>
                                By sending, you agree to ProvenMRR's terms. Your email is passed securely to the founder.
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
