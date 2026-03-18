"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, ExternalLink, Link as LinkIcon, Briefcase } from "lucide-react";
import { submitFrictionlessStartup } from "@/app/actions/startup";
import type { ProviderType } from "@/lib/revenue/fetchers";
import Link from "next/link";
import { SuccessModal } from "./SuccessModal";

export function AddStartupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [provider, setProvider] = useState<ProviderType | null>(null);
    const [apiKey, setApiKey] = useState("");
    const [xHandle, setXHandle] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isListedForSale, setIsListedForSale] = useState(false);
    const [askingPrice, setAskingPrice] = useState("");
    const [profitMargin, setProfitMargin] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateStartupId, setDuplicateStartupId] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ startupId: string; claimToken: string | null } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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

    const providers: { id: ProviderType; label: string; icon: React.ReactNode }[] = [
        {
            id: "stripe",
            label: "Stripe",
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="16" rx="4" fill="#635bff" />
                    <path d="M8.211 4.542c-2.025 0-3.328 1.05-3.328 2.66 0 2.508 3.486 2.062 3.486 3.195 0 .428-.415.706-1.077.706-1.002 0-1.785-.357-2.313-.805v1.854c.66.386 1.637.604 2.569.604 2.19 0 3.493-1.071 3.493-2.73 0-2.604-3.507-2.094-3.507-3.235 0-.395.395-.657 1.015-.657.854 0 1.542.27 2.032.616l.261-1.776a4.832 4.832 0 0 0-2.631-.432z" fill="#fff" />
                </svg>
            )
        },
        {
            id: "lemonsqueezy",
            label: "LemonSqueezy",
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="16" rx="4" fill="#5E22DB" />
                    <path d="M7.747 4.053a4 4 0 0 1 4.2 4.2l-4.2-4.2ZM11.453 8.747a4 4 0 0 1-4.2 4.2l4.2-4.2ZM8.253 11.947a4 4 0 0 1-4.2-4.2l4.2 4.2ZM4.547 7.253a4 4 0 0 1 4.2-4.2l-4.2 4.2Z" fill="#FFC233" />
                    <circle cx="8" cy="8" r="3.2" fill="#FFC233" />
                </svg>
            )
        },
        {
            id: "polar",
            label: "Polar",
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="16" rx="4" fill="#000000" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Zm0-1.5V4.5a3.5 3.5 0 0 0 0 7Z" fill="#fff" />
                </svg>
            )
        },
        {
            id: "dodopayments",
            label: "Dodo Payments",
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="16" rx="4" fill="#C1F418" />
                    <path d="M6 10.5C6 11.88 7.12 13 8.5 13S11 11.88 11 10.5V6C11 5.448 10.552 5 10 5H6v5.5Z" fill="#000" />
                    <circle cx="9.5" cy="7.5" r="0.8" fill="#C1F418" />
                </svg>
            )
        },
        {
            id: "paddle",
            label: "Paddle",
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="16" rx="4" fill="#FFD233" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M7 4.5A2.5 2.5 0 0 1 9.5 7v1H7V4.5ZM9.5 9v2.5A2.5 2.5 0 0 1 7 14V9h2.5Z" fill="#000" />
                </svg>
            )
        },
        {
            id: "revenuecat",
            label: "RevenueCat",
            icon: (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="16" height="16" rx="4" fill="#E84F59" />
                    <path d="M4 11V6l3 2.5L10 6v5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 11h6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
            )
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider) {
            setError("Please select a payment provider.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setDuplicateStartupId(null);

        const res = await submitFrictionlessStartup({
            provider,
            apiKey,
            name: "Unclaimed Startup", // Default name since UI doesn't ask for it
            category: "Software",
            websiteUrl: "", // Default empty URL
            description: "",
            xHandle,
            isAnonymous,
            isListedForSale,
            askingPrice: isListedForSale && askingPrice ? parseFloat(askingPrice) : undefined,
            profitMargin: isListedForSale && profitMargin ? parseFloat(profitMargin) : undefined,
            contactEmail: isListedForSale ? contactEmail : undefined,
        });

        if (!res.success) {
            setError(res.error || "Failed to submit startup.");
            // @ts-ignore
            if (res.isDuplicate && res.existingStartupId) {
                // @ts-ignore
                setDuplicateStartupId(res.existingStartupId);
            }
            setIsSubmitting(false);
        } else {
            // Instantly append the verified startup explicitly via DOM React Event Emitters
            if (res.startup) {
                const newCardData = {
                    id: res.startup.id,
                    name: res.startup.name,
                    category: res.startup.category,
                    description: null,
                    is_listed_for_sale: res.startup.is_listed_for_sale,
                    is_verified: res.startup.is_verified,
                    created_at: res.startup.created_at,
                    snap: {
                        mrr: res.startup.mrr,
                        growth_rate: res.startup.growth_rate,
                    }
                };
                window.dispatchEvent(new CustomEvent('new-startup', { detail: newCardData }));
            }

            setIsSubmitting(false);
            setSuccessData({
                startupId: res.startupId!,
                claimToken: res.claimToken || null
            });
        }
    };

    if (successData) {
        return <SuccessModal isOpen={true} onClose={() => {
            setSuccessData(null);
            onClose();
        }} startupId={successData.startupId} claimToken={successData.claimToken} />;
    }

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    };

    const contentStyle: React.CSSProperties = {
        width: 520,
        maxWidth: '92%',
        background: 'white',
        borderRadius: 14,
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        padding: 24,
        position: 'relative',
        maxHeight: '85vh',
        overflowY: 'auto'
    };

    return createPortal(
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={contentStyle}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#111827", letterSpacing: "0px", fontFamily: "monospace" }}>Add your startup</h2>
                        <p style={{ margin: "8px 0 0", color: "#6B7280", fontSize: 13, lineHeight: 1.5, fontFamily: "monospace", maxWidth: 440 }}>
                            Showcase your verified revenue to <span style={{ color: "#111827", fontWeight: 600 }}>120,000+ monthly visitors</span> and get a <span style={{ color: "#111827", fontWeight: 600 }}>54+ DR dofollow backlink</span>
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ height: 1, background: "#E5E7EB", margin: "0 -24px 24px", width: "calc(100% + 48px)" }} />

                {error && (
                    <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13, border: "1px solid #FCA5A5" }}>
                        {error}
                        {duplicateStartupId && (
                            <div style={{ marginTop: 8 }}>
                                <Link href={`/startup/${duplicateStartupId}`} style={{ color: "#991B1B", fontWeight: 600, textDecoration: "underline" }} onClick={onClose}>
                                    View and claim existing startup →
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Payment Provider Selector */}
                    <div>
                        <div style={{
                            background: '#F3F4F6',
                            borderRadius: 12,
                            padding: 4,
                            display: 'flex',
                            gap: 2,
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            border: '1px solid #E5E7EB'
                        }}>
                            {providers.map((p) => {
                                const isActive = provider === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setProvider(p.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '6px 14px',
                                            borderRadius: 8,
                                            background: isActive ? 'white' : 'transparent',
                                            color: isActive ? '#111827' : '#4B5563',
                                            border: 'none',
                                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                            fontSize: 13,
                                            fontWeight: isActive ? 600 : 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {p.icon}
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 8, display: "block", fontFamily: "monospace" }}>
                            1. {provider ? providers.find(p => p.id === provider)?.label : "Provider"} API key
                        </label>
                        <input
                            type="password"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #D1D5DB',
                                borderRadius: 8,
                                fontSize: 14,
                                fontFamily: "monospace",
                                outline: "none",
                                transition: "border-color 0.15s"
                            }}
                            placeholder={provider === "stripe" ? "rk_live_..." : "sk_..."}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            required
                        />

                        {/* API Key Helper Box */}
                        <div style={{
                            marginTop: 12,
                            padding: 16,
                            border: "1px solid #E5E7EB",
                            borderRadius: 8,
                            background: "#F9FAFB",
                            position: "relative"
                        }}>
                            <p style={{ margin: "0 0 8px", fontSize: 13, color: "#374151", fontWeight: 500, fontFamily: "monospace" }}>
                                Click here to create a read-only API key.
                            </p>
                            <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "#6B7280", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                <div>1. Scroll down and click 'Create key'</div>
                                <div>2. Don't change the permissions</div>
                                <div>3. Don't delete the key or we can't refresh revenue</div>
                            </div>
                            <a href="#" style={{ position: "absolute", top: 16, right: 16, color: "#111827", opacity: 0.7 }}>
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Optional X Handle */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 8, display: "block", fontFamily: "monospace" }}>
                            2. 𝕏 handle (optional)
                        </label>
                        <input
                            type="text"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid #D1D5DB',
                                borderRadius: 8,
                                fontSize: 14,
                                fontFamily: "monospace",
                                outline: "none"
                            }}
                            placeholder="username"
                            value={xHandle}
                            onChange={(e) => setXHandle(e.target.value)}
                        />
                    </div>

                    {/* Anonymous toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{ position: "relative", width: 18, height: 18, borderRadius: "50%", border: isAnonymous ? "5px solid #111827" : "1px solid #D1D5DB", cursor: "pointer", display: "inline-block", background: "white", transition: "all 0.1s" }}>
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                style={{ opacity: 0, position: "absolute", margin: 0, width: 0, height: 0 }}
                            />
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: "monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
                            Anonymous mode
                            <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid #9CA3AF", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontStyle: "italic" }}>
                                i
                            </div>
                        </span>
                    </div>

                    <div style={{ height: 1, background: "#E5E7EB", margin: "0 -24px", width: "calc(100% + 48px)" }} />

                    {/* Sale details conditional block */}
                    {isListedForSale && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid #E5E7EB", marginTop: -8 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 8, display: "block", fontFamily: "monospace" }}>Asking Price ($)</label>
                                    <input type="number" min="0" step="any" required value={askingPrice} onChange={e => setAskingPrice(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: "monospace", outline: "none" }} placeholder="e.g. 50000" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 8, display: "block", fontFamily: "monospace" }}>Margin % (30d)</label>
                                    <input type="number" min="0" max="100" step="any" required value={profitMargin} onChange={e => setProfitMargin(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: "monospace", outline: "none" }} placeholder="e.g. 85" />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 8, display: "block", fontFamily: "monospace" }}>Contact Email (Hidden)</label>
                                <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: "monospace", outline: "none" }} placeholder="founder@startup.com" />
                            </div>
                        </div>
                    )}

                    {/* Footer / Submit area */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Native realistic toggle styling */}
                            <label style={{ position: "relative", display: "inline-block", width: 44, height: 24 }}>
                                <input
                                    type="checkbox"
                                    checked={isListedForSale}
                                    onChange={(e) => setIsListedForSale(e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: isListedForSale ? "#10B981" : "#E5E7EB",
                                    transition: ".2s", borderRadius: 24
                                }}>
                                    <span style={{
                                        position: "absolute", content: '""', height: 18, width: 18, left: 3, top: 3,
                                        backgroundColor: "white", transition: ".2s", borderRadius: "50%",
                                        transform: isListedForSale ? "translateX(20px)" : "translateX(0)",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                    }} />
                                </span>
                            </label>
                            <span style={{ fontSize: 13, color: "#111827", fontFamily: "monospace" }}>List for sale</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !provider || !apiKey}
                            style={{
                                background: "#828282", // Match screenshot's gray button
                                color: "white",
                                border: "none",
                                padding: "10px 18px",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: (isSubmitting || !provider || !apiKey) ? "not-allowed" : "pointer",
                                opacity: (isSubmitting || !provider || !apiKey) ? 0.7 : 1,
                                fontFamily: "monospace"
                            }}
                        >
                            {isSubmitting ? "Submitting..." : "Add startup"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
