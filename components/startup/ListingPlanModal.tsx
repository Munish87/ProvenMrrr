"use client";

import { createPortal } from "react-dom";
import { X, Check, Megaphone, Zap, Users, CreditCard, Lock, ChevronLeft, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface ListingPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    startupId: string;
    startupName: string;
}

export function ListingPlanModal({ isOpen, onClose, onConfirm, startupId, startupName }: ListingPlanModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
            setError(null);
        }
    }, [isOpen]);

    // Check on return from Stripe if payment was completed
    useEffect(() => {
        if (!isOpen) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("payment") === "success" && params.get("id") === startupId) {
            onConfirm();
        }
    }, [isOpen, startupId, onConfirm]);

    const handleProceedToPayment = useCallback(async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startupId }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to initialize checkout");
            }
            if (data.url) {
                // Redirect to Stripe hosted checkout
                window.location.href = data.url;
            } else {
                throw new Error("No checkout URL returned from server");
            }
        } catch (err: any) {
            console.error("[Payment Init Error]:", err);
            setError(err.message || "Could not initialize secure checkout. Please try again.");
            setIsProcessing(false);
        }
    }, [startupId]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "var(--modal-overlay-bg)",
            backdropFilter: "blur(18px) saturate(150%)",
            WebkitBackdropFilter: "blur(18px) saturate(150%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 99999, padding: 24
        }} onClick={onClose}>
            <div
                className="modal-card"
                style={{
                    width: "100%", maxWidth: 520, borderRadius: 30,
                    overflow: "hidden", position: "relative",
                    background: "var(--modal-card-bg)",
                    border: "1px solid var(--modal-card-border)",
                    boxShadow: "var(--modal-card-shadow)",
                    animation: "modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                {!isProcessing && (
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            position: "absolute", top: 20, right: 20,
                            background: "var(--modal-close-bg)",
                            border: "1px solid var(--modal-close-border)",
                            borderRadius: "50%", width: 32, height: 32,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--color-secondary)", zIndex: 10
                        }}
                    >
                        <X size={18} />
                    </button>
                )}

                <div style={{ animation: "slideIn 0.3s ease-out" }}>
                    {/* Header */}
                    <div style={{
                        background: "var(--color-surface)", padding: "32px 32px 24px",
                        color: "var(--color-text)", textAlign: "center",
                        position: "relative", zIndex: 1
                    }}>
                        <div style={{
                            width: 64, height: 64, background: "var(--color-surface-strong)",
                            border: "1px solid var(--color-border)", borderRadius: 20,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 16px", boxShadow: "var(--shadow-card)"
                        }}>
                            <Megaphone size={32} color="var(--color-text)" />
                        </div>
                        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Marketplace Access</h2>
                        <p style={{ fontSize: 15, color: "var(--color-secondary)", margin: 0, lineHeight: 1.4 }}>List <b>{startupName}</b> in the primary &quot;For Sale&quot; feed and reach verified investors.</p>
                    </div>

                    <div style={{ padding: "20px 32px 28px", position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
                            {/* Feature: Priority Placement */}
                            <div style={{ display: "flex", gap: 16 }}>
                                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, rgba(125, 162, 255, 0.14), rgba(91, 124, 255, 0.08) 42%, rgba(255, 255, 255, 0.92) 100%)", border: "1px solid rgba(126,161,255,0.22)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#5b7cff", flexShrink: 0, boxShadow: "0 10px 22px rgba(91,124,255,0.12), inset 0 1px 0 rgba(255,255,255,0.92)" }}>
                                    <Zap size={22} fill="currentColor" />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--color-text)" }}>Priority Placement</h4>
                                    <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, lineHeight: 1.5 }}>Your startup appears at the top of category filters for 30 days.</p>
                                </div>
                            </div>

                            {/* Feature: 120k Visitors */}
                            <div style={{ display: "flex", gap: 16 }}>
                                <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, rgba(52,211,153,0.14), rgba(16,185,129,0.08) 42%, rgba(255, 255, 255, 0.92) 100%)", border: "1px solid rgba(52,211,153,0.24)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", flexShrink: 0, boxShadow: "0 10px 22px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.92)" }}>
                                    <Users size={22} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--color-text)" }}>120k+ Monthly Visitors</h4>
                                    <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, lineHeight: 1.5 }}>Direct exposure to our network of SaaS acquirers.</p>
                                </div>
                            </div>
                        </div>

                        {/* Price Block */}
                        <div style={{
                            background: "var(--color-surface)", borderRadius: 24,
                            padding: "24px", textAlign: "center", border: "1px solid var(--color-border)",
                            boxShadow: "var(--shadow-card)", marginBottom: 20
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>ProvenMRR Pro Listing</p>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                                <span style={{ fontSize: 48, fontWeight: 900, color: "var(--color-text)", letterSpacing: "-0.04em" }}>$0.50</span>
                                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--color-secondary)" }}>one-time</span>
                            </div>
                            <p style={{ fontSize: 12, color: "var(--color-secondary)", margin: "8px 0 0", opacity: 0.7 }}>Secure payment via Stripe</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: 12, padding: "12px 16px", marginBottom: 16,
                                color: "#ef4444", fontSize: 13, fontWeight: 500
                            }}>
                                {error}
                            </div>
                        )}

                        {/* CTA Button */}
                        <button
                            type="button"
                            onClick={handleProceedToPayment}
                            disabled={isProcessing}
                            style={{
                                width: "100%",
                                background: isProcessing
                                    ? "rgba(91,124,255,0.5)"
                                    : "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                                color: "white", border: "none", borderRadius: 999,
                                padding: "18px", fontSize: 16, fontWeight: 700, cursor: isProcessing ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: 12, boxShadow: isProcessing ? "none" : "0 16px 28px rgba(91,124,255,0.24), inset 0 1px 0 rgba(255,255,255,0.24)",
                                minHeight: 58, boxSizing: "border-box",
                                transition: "all 0.3s ease"
                            }}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Redirecting to Stripe...
                                </>
                            ) : (
                                <>
                                    <ExternalLink size={18} />
                                    Pay $0.50 &amp; List Startup
                                </>
                            )}
                        </button>

                        {/* Security badge */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            gap: 8, marginTop: 16
                        }}>
                            <Lock size={12} color="#10B981" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-secondary)", opacity: 0.7 }}>
                                256-bit SSL encrypted · Powered by Stripe
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes slideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>,
        document.body
    );
}
