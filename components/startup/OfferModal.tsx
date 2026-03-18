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
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
    };

    const contentStyle: React.CSSProperties = {
        width: 480,
        maxWidth: '92%',
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        padding: 32,
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
    };

    if (isSuccess) {
        return createPortal(
            <div style={overlayStyle} onClick={onClose}>
                <div style={{ ...contentStyle, textAlign: "center" }} onClick={e => e.stopPropagation()}>
                    <div style={{ width: 64, height: 64, background: "#D1FAE5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <Mail color="#059669" size={32} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "#111827", letterSpacing: "-0.5px" }}>Offer Sent!</h2>
                    <p style={{ margin: "0 0 32px", color: "#4B5563", lineHeight: 1.6, fontSize: 15 }}>
                        Your offer of <strong>${Number(offerAmount).toLocaleString()}</strong> has been securely routed directly to the founder of {startupName}. They will reply to your email directly if interested.
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            width: "100%",
                            background: "#111827",
                            color: "white",
                            border: "none",
                            padding: "14px 24px",
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background 0.2s"
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
                <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#111827", letterSpacing: "-0.5px" }}>Make an Offer</h2>
                <p style={{ margin: "0 0 24px", color: "#6B7280", fontSize: 14, lineHeight: 1.5 }}>
                    Connect directly with the founder of <strong>{startupName}</strong>. Vetra bridges your message securely.
                </p>

                {error && (
                    <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontSize: 14, border: "1px solid #F87171" }}>
                        {error}
                    </div>
                )}

                {!sessionToken ? (
                    <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
                        <div style={{ width: 48, height: 48, background: "#F3F4F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <Mail color="#6B7280" size={24} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>Authentication Required</h3>
                        <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" }}>
                            You must be signed in to contact founders and make offers on startups.
                        </p>
                        <Link href="/login" style={{
                            display: "inline-block",
                            background: "#111827",
                            color: "white",
                            padding: "12px 24px",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "background 0.2s"
                        }}>
                            Sign in to continue
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                                Offer Amount (USD)
                            </label>
                            <div style={{ position: "relative" }}>
                                <DollarSign size={18} color="#9CA3AF" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="50000"
                                    value={offerAmount}
                                    onChange={e => setOfferAmount(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 16px 12px 40px", border: "1px solid #D1D5DB",
                                        borderRadius: 10, fontSize: 15, outline: "none", transition: "border-color 0.2s",
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                                Your Email Address
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="you@company.com"
                                value={buyerEmail}
                                onChange={e => setBuyerEmail(e.target.value)}
                                style={{
                                    width: "100%", padding: "12px 16px", border: "1px solid #D1D5DB",
                                    borderRadius: 10, fontSize: 15, outline: "none", transition: "border-color 0.2s",
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                                Message to Founder
                            </label>
                            <textarea
                                required
                                placeholder="Hi there, I'm highly interested in acquiring your project..."
                                value={messageBody}
                                onChange={e => setMessageBody(e.target.value)}
                                style={{
                                    width: "100%", padding: "12px 16px", border: "1px solid #D1D5DB",
                                    borderRadius: 10, fontSize: 15, outline: "none", transition: "border-color 0.2s",
                                    minHeight: 120, resize: "vertical", boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    width: "100%",
                                    background: "#4F46E5",
                                    color: "white",
                                    border: "none",
                                    padding: "14px 24px",
                                    borderRadius: 10,
                                    fontSize: 15,
                                    fontWeight: 600,
                                    cursor: isSubmitting ? "not-allowed" : "pointer",
                                    opacity: isSubmitting ? 0.8 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    transition: "background 0.2s"
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
                            <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 12, marginBottom: 0 }}>
                                By sending, you agree to vetra's terms. Your email is passed securely to the founder.
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
