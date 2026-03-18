"use client";

import { createPortal } from "react-dom";
import { X, Check, Megaphone, Zap, Users, CreditCard, Lock, ShieldCheck, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { createClient } from "@/lib/supabase/client";

// Initialize Stripe outside of component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

interface ListingPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    startupId: string;
    startupName: string;
}

export function ListingPlanModal({ isOpen, onClose, onConfirm, startupId, startupName }: ListingPlanModalProps) {
    const [step, setStep] = useState<"info" | "payment" | "success">("info");
    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setStep("info");
            setIsProcessing(false);
            setClientSecret(null);
        }
    }, [isOpen]);

    // Real-time listener for payment confirmation
    useEffect(() => {
        if (!isOpen || step !== "payment") return;

        const supabase = createClient();
        const channel = supabase
            .channel(`payment-confirmation-${startupId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "startups",
                    filter: `id=eq.${startupId}`,
                },
                (payload) => {
                    const updated = payload.new as any;
                    if (updated.listing_fee_paid) {
                        setStep("success");
                        setIsProcessing(false);
                        // Optional: Clear local storage or triggers
                        if (typeof window !== "undefined") {
                            window.localStorage.setItem(`provenmrr-listing-paid:${startupId}`, "true");
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, step, startupId]);

    if (!isOpen) return null;

    const handleProceedToPayment = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch("/api/stripe/payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startupId }),
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setStep("payment");
            } else {
                throw new Error(data.error || "Failed to initialize payment");
            }
        } catch (err) {
            console.error("[Payment Init Error]:", err);
            alert("Could not initialize secure checkout. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

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
                {(step !== "success" && !isProcessing) && (
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

                {step === "info" && (
                    <div style={{ animation: "slideIn 0.3s ease-out" }}>
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
                            <p style={{ fontSize: 15, color: "var(--color-secondary)", margin: 0, lineHeight: 1.4 }}>List <b>{startupName}</b> in the primary "For Sale" feed and reach verified investors.</p>
                        </div>

                        <div style={{ padding: "20px 32px 28px", position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
                                <div style={{ display: "flex", gap: 16 }}>
                                    <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, rgba(125, 162, 255, 0.14), rgba(91, 124, 255, 0.08) 42%, rgba(255, 255, 255, 0.92) 100%)", border: "1px solid rgba(126,161,255,0.22)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#5b7cff", flexShrink: 0, boxShadow: "0 10px 22px rgba(91,124,255,0.12), inset 0 1px 0 rgba(255,255,255,0.92)" }}>
                                        <Zap size={22} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--color-text)" }}>Priority Placement</h4>
                                        <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, lineHeight: 1.5 }}>Your startup appears at the top of category filters for 30 days.</p>
                                    </div>
                                </div>
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
                            </div>

                            <button 
                                type="button"
                                onClick={handleProceedToPayment}
                                disabled={isProcessing}
                                style={{
                                    width: "100%",
                                    background: "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                                    color: "white", border: "none", borderRadius: 999,
                                    padding: "18px", fontSize: 16, fontWeight: 700, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    gap: 12, boxShadow: "0 16px 28px rgba(91,124,255,0.24), inset 0 1px 0 rgba(255,255,255,0.24)",
                                    minHeight: 58, boxSizing: "border-box", opacity: isProcessing ? 0.7 : 1
                                }}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : "Continue to Checkout"}
                            </button>
                        </div>
                    </div>
                )}

                {step === "payment" && clientSecret && (
                    <div style={{ padding: 32, animation: "slideIn 0.3s ease-out", position: "relative", zIndex: 1 }}>
                        <button 
                            type="button"
                            onClick={() => setStep("info")}
                            disabled={isProcessing}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "none", border: "none", color: "var(--color-secondary)",
                                fontSize: 14, fontWeight: 600, cursor: "pointer",
                                padding: 0, marginBottom: 32, opacity: isProcessing ? 0.5 : 1
                            }}
                        >
                            <ChevronLeft size={16} /> Back
                        </button>

                        <div style={{ textAlign: "center", marginBottom: 32 }}>
                            <div style={{ 
                                width: 56, height: 56, 
                                background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))", 
                                borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#8eaaff", margin: "0 auto 20px", border: "1px solid rgba(126,161,255,0.22)"
                            }}>
                                <CreditCard size={28} />
                            </div>
                            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>Secure Payment</h2>
                            <p style={{ fontSize: 15, color: "var(--color-secondary)", margin: 0, fontWeight: 500 }}>Securely list <b>{startupName}</b></p>
                        </div>

                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' as any } }}>
                            <CheckoutForm 
                                startupId={startupId} 
                                onProcessing={setIsProcessing} 
                                isProcessing={isProcessing} 
                            />
                        </Elements>

                        <div style={{ 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            gap: 12, marginTop: 32, padding: "14px",
                            background: "var(--color-surface)", borderRadius: 16,
                            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Lock size={14} color="#10B981" />
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.05em" }}>Secured by Stripe</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === "success" && (
                    <div style={{ padding: "48px 32px", textAlign: "center", animation: "slideIn 0.3s ease-out" }}>
                        <div style={{ 
                            width: 80, height: 80, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                            borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", margin: "0 auto 24px", boxShadow: "0 20px 40px rgba(16,185,129,0.3)"
                        }}>
                            <Check size={40} strokeWidth={3} />
                        </div>
                        <h2 style={{ fontSize: 32, fontWeight: 900, color: "var(--color-text)", marginBottom: 16, letterSpacing: "-0.03em" }}>You're Live!</h2>
                        <p style={{ fontSize: 16, color: "var(--color-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
                            Payment confirmed. <b>{startupName}</b> is now visible to all potential buyers in the marketplace.
                        </p>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{
                                width: "100%", background: "var(--color-surface)",
                                color: "var(--color-text)", border: "1px solid var(--color-border)",
                                borderRadius: 18, padding: "18px", fontSize: 16, fontWeight: 700,
                                cursor: "pointer", boxShadow: "var(--shadow-card)"
                            }}
                        >
                            Back to Dashboard
                        </button>
                        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--color-accent)", fontWeight: 700, fontSize: 13 }}>
                            <Sparkles size={16} />
                            <span>Priority placement active</span>
                        </div>
                    </div>
                )}
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

function CheckoutForm({ startupId, onProcessing, isProcessing }: { startupId: string, onProcessing: (v: boolean) => void, isProcessing: boolean }) {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        onProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // We don't actually want a redirect if we can help it, 
                // but Stripe requires one for some payment methods.
                // We'll handle the "instant" case via Realtime.
                return_url: `${window.location.origin}/dashboard/startups?id=${startupId}&payment=processing`,
            },
            redirect: "if_required",
        });

        if (error) {
            setErrorMessage(error.message || "An unexpected error occurred.");
            onProcessing(false);
        } else {
            // Success! The Realtime listener will pick up the DB changes.
            // We just stay in the loading state until Realtime triggers step="success".
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement options={{ layout: "tabs" }} />
            {errorMessage && <div style={{ color: "#ef4444", fontSize: 13, marginTop: 12, fontWeight: 500 }}>{errorMessage}</div>}
            <button 
                type="submit" 
                disabled={isProcessing || !stripe || !elements}
                style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                    color: "white", border: "none", borderRadius: 18,
                    padding: "20px", fontSize: 16, fontWeight: 800,
                    cursor: (isProcessing || !stripe) ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 12, marginTop: 32, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    opacity: isProcessing ? 0.7 : 1,
                    boxShadow: "0 16px 30px rgba(91, 124, 255, 0.25)",
                    minHeight: 60, boxSizing: "border-box"
                }}
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Verifying...
                    </>
                ) : (
                    `Pay $0.50 & List Startup`
                )}
            </button>
        </form>
    );
}
