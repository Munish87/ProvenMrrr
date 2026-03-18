"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, ExternalLink, Link as LinkIcon, Briefcase } from "lucide-react";
import { submitFrictionlessStartup } from "@/app/actions/startup";
import type { ProviderType } from "@/lib/revenue/fetchers";
import Link from "next/link";
import { SuccessModal } from "./SuccessModal";
import { ListingPlanModal } from "./ListingPlanModal";

export function AddStartupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [provider, setProvider] = useState<ProviderType | null>("stripe");
    const [apiKey, setApiKey] = useState("");
    const [polarOrgId, setPolarOrgId] = useState("");
    const [revenueCatProjectId, setRevenueCatProjectId] = useState("");
    const [revenueCatShareUrl, setRevenueCatShareUrl] = useState("");
    const [xHandle, setXHandle] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isListedForSale, setIsListedForSale] = useState(false);
    const [askingPrice, setAskingPrice] = useState("");
    const [profitMargin, setProfitMargin] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("SaaS");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateStartupId, setDuplicateStartupId] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<{ startupId: string; claimToken: string | null } | null>(null);
    const [showListingModal, setShowListingModal] = useState(false);
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
                <div style={{ width: 20, height: 20, background: "#635BFF", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.211 4.542c-2.025 0-3.328 1.05-3.328 2.66 0 2.508 3.486 2.062 3.486 3.195 0 .428-.415.706-1.077.706-1.002 0-1.785-.357-2.313-.805v1.854c.66.386 1.637.604 2.569.604 2.19 0 3.493-1.071 3.493-2.73 0-2.604-3.507-2.094-3.507-3.235 0-.395.395-.657 1.015-.657.854 0 1.542.27 2.032.616l.261-1.776a4.832 4.832 0 0 0-2.631-.432z" fill="#fff" />
                    </svg>
                </div>
            )
        },
        {
            id: "lemonsqueezy",
            label: "LemonSqueezy",
            icon: (
                <div style={{ width: 20, height: 20, background: "#5E22DB", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.747 4.053a4 4 0 0 1 4.2 4.2l-4.2-4.2ZM11.453 8.747a4 4 0 0 1-4.2 4.2l4.2-4.2ZM8.253 11.947a4 4 0 0 1-4.2-4.2l4.2 4.2ZM4.547 7.253a4 4 0 0 1 4.2-4.2l-4.2 4.2Z" fill="#FFC233" />
                    </svg>
                </div>
            )
        },
        {
            id: "polar",
            label: "Polar",
            icon: (
                <div style={{ width: 20, height: 20, background: "#000000", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Zm0-1.5V4.5a3.5 3.5 0 0 0 0 7Z" fill="#fff" />
                    </svg>
                </div>
            )
        },
        {
            id: "dodopayments",
            label: "Dodo Payments",
            icon: (
                <div style={{ width: 20, height: 20, background: "#C1F418", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 10.5C6 11.88 7.12 13 8.5 13S11 11.88 11 10.5V6C11 5.448 10.552 5 10 5H6v5.5Z" fill="#000" />
                        <circle cx="9.5" cy="7.5" r="0.8" fill="#C1F418" />
                    </svg>
                </div>
            )
        },
        {
            id: "paddle",
            label: "Paddle",
            icon: (
                <div style={{ width: 20, height: 20, background: "#FFD233", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M7 4.5A2.5 2.5 0 0 1 9.5 7v1H7V4.5ZM9.5 9v2.5A2.5 2.5 0 0 1 7 14V9h2.5Z" fill="#000" />
                    </svg>
                </div>
            )
        },
        {
            id: "revenuecat",
            label: "RevenueCat",
            icon: (
                <div style={{ width: 20, height: 20, background: "#E84F59", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 11V6l3 2.5L10 6v5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 11h6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                </div>
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
            category: selectedCategory,
            websiteUrl: "", // Default empty URL
            description: "",
            xHandle,
            isAnonymous,
            isListedForSale,
            askingPrice: isListedForSale && askingPrice ? parseFloat(askingPrice) : undefined,
            profitMargin: isListedForSale && profitMargin ? parseFloat(profitMargin) : undefined,
            contactEmail: isListedForSale ? contactEmail : undefined,
            providerMetadata: {
                polarOrgId,
                revenueCatProjectId,
                revenueCatShareUrl
            }
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

            if (isListedForSale) {
                setShowListingModal(true);
            }
            setIsSubmitting(false);
            setSuccessData({
                startupId: res.startupId!,
                claimToken: res.claimToken || null
            });
        }
    };

    if (successData && !showListingModal) {
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
        background: 'var(--modal-overlay-bg)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24
    };

    const contentStyle: React.CSSProperties = {
        width: 640,
        maxWidth: 'min(640px, 100%)',
        background: 'var(--modal-card-bg)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: 30,
        border: '1px solid var(--modal-card-border)',
        boxShadow: 'var(--modal-card-shadow)',
        padding: 32,
        position: 'relative',
        maxHeight: 'min(88vh, 920px)',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        transition: 'opacity 0.22s ease, transform 0.22s ease, filter 0.22s ease'
    };

    const darkInputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid var(--modal-input-border)',
        borderRadius: 16,
        fontSize: 14,
        outline: "none",
        transition: "all 0.2s",
        background: "var(--modal-input-bg)",
        color: "var(--color-text)",
        boxShadow: "var(--modal-input-shadow)"
    };

    const helperBoxStyle: React.CSSProperties = {
        marginTop: 12,
        padding: 18,
        border: "1px solid var(--color-border)",
        borderRadius: 18,
        background: "var(--color-surface)",
        position: "relative",
        boxShadow: "var(--shadow-card)"
    };

    return createPortal(
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div
                style={{
                    ...contentStyle,
                    opacity: showListingModal ? 0.18 : 1,
                    transform: showListingModal ? "scale(0.985)" : "scale(1)",
                    filter: showListingModal ? "blur(8px)" : "blur(0)",
                    pointerEvents: showListingModal ? "none" : "auto",
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 24,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(circle at 18% 16%, rgba(91, 124, 255, 0.08), transparent 22%), radial-gradient(circle at 78% 74%, rgba(52, 211, 153, 0.07), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 24%, rgba(0,0,0,0) 100%)",
                        }}
                    />
                </div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, position: "relative" }}>
                    <div>
                        <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "var(--color-text)", letterSpacing: "-0.04em", lineHeight: 1.05 }}>Add your startup</h2>
                        <p style={{ margin: "10px 0 0", color: "var(--color-secondary)", fontSize: 14, lineHeight: 1.65, fontWeight: 500, maxWidth: 520 }}>
                            Showcase your verified revenue to <span style={{ color: "var(--color-text)", fontWeight: 700 }}>potential buyers</span> and <span style={{ color: "var(--color-text)", fontWeight: 700 }}>investors</span>.
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: "var(--modal-close-bg)", border: "1px solid var(--modal-close-border)", cursor: "pointer", color: "var(--color-secondary)", padding: 0, width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ height: 1, background: "rgba(224,232,239,0.08)", margin: "0 -32px 26px", width: "calc(100% + 64px)", position: "relative" }} />

                {error && (
                    <div style={{ background: "rgba(248,113,113,0.12)", color: "#fecaca", padding: "14px 18px", borderRadius: 16, marginBottom: 24, fontSize: 13, border: "1px solid rgba(248,113,113,0.26)", fontWeight: 500, position: "relative", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                        {error}
                        {duplicateStartupId && (
                            <div style={{ marginTop: 8 }}>
                                <Link href={`/startup/${duplicateStartupId}`} style={{ color: "#b91c1c", fontWeight: 700, textDecoration: "underline" }} onClick={onClose}>
                                    View and claim existing startup &rarr;
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22, position: "relative" }}>
                    {/* Payment Provider Selector */}
                    <div>
                        <div style={{
                            background: 'var(--color-surface)',
                            borderRadius: 22,
                            padding: 8,
                            display: 'flex',
                            gap: 6,
                            border: '1px solid var(--color-border)',
                            boxShadow: 'var(--shadow-card)',
                            overflowX: 'auto',
                            scrollbarWidth: 'none'
                        }}>
                            {providers.map((p) => {
                                const isActive = provider === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setProvider(p.id)}
                                        style={{
                                            flex: '0 0 auto',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px 12px',
                                            borderRadius: 14,
                                            background: isActive ? 'linear-gradient(135deg, rgba(125, 162, 255, 0.18), rgba(91, 124, 255, 0.12) 42%, rgba(255, 255, 255, 0.92) 100%)' : 'transparent',
                                            color: isActive ? 'var(--color-text)' : 'var(--color-secondary)',
                                            border: isActive ? '1px solid rgba(126,161,255,0.28)' : '1px solid transparent',
                                            boxShadow: isActive ? '0 10px 22px rgba(91,124,255,0.12), inset 0 1px 0 rgba(255,255,255,0.92)' : 'none',
                                            fontSize: 11,
                                            fontWeight: isActive ? 700 : 500,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            minWidth: 92,
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.6 }}>
                                            {p.icon}
                                        </div>
                                        <span style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontWeight: isActive ? 700 : 500
                                        }}>
                                            {p.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: "var(--field-label-color)", marginBottom: 10, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            1. {provider ? providers.find(p => p.id === provider)?.label : "Provider"} API key
                        </label>
                        <input
                            type="password"
                            style={darkInputStyle}
                            placeholder={provider === "stripe" ? "rk_live_..." : provider === "polar" ? "polar_oat_..." : provider === "dodopayments" ? "dp_live_..." : provider === "paddle" ? "pdl_live_..." : provider === "revenuecat" ? "sk_..." : "sk_..."}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            onFocus={(e) => e.currentTarget.style.border = "1px solid rgba(91,124,255,0.55)"}
                            onBlur={(e) => e.currentTarget.style.border = "1px solid rgba(224,232,239,0.14)"}
                            required
                        />

                        {/* API Key Helper Box */}
                        {provider === "stripe" && (
                            <div style={helperBoxStyle}>
                                <a
                                    href="https://dashboard.stripe.com/apikeys/create?name=TrustMRR&permissions%5B%5D=rak_charge_read&permissions%5B%5D=rak_subscription_read&permissions%5B%5D=rak_plan_read&permissions%5B%5D=rak_bucket_connect_read&permissions%5B%5D=rak_file_read&permissions%5B%5D=rak_product_read"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--color-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to create a read-only API key
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 8, fontWeight: 500, lineHeight: 1.55 }}>
                                    <div>1. Scroll down and click 'Create key'</div>
                                    <div>2. Don't change the permissions</div>
                                    <div>3. Don't delete the key or we can't refresh revenue</div>
                                </div>
                            </div>
                        )}

                        {provider === "lemonsqueezy" && (
                            <div style={helperBoxStyle}>
                                <a
                                    href="https://app.lemonsqueezy.com/settings/api"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to create an API key
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Click the + icon next to "API Keys"</div>
                                    <div>2. Set the expiration date to 10+ years from now</div>
                                    <div>3. Copy the generated API key and paste it here</div>
                                </div>
                            </div>
                        )}

                        {provider === "polar" && (
                            <div style={helperBoxStyle}>
                                <a
                                    href="https://polar.sh/dashboard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to create an Organization Access Token
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Click 'Settings' on the left sidebar, then 'General'</div>
                                    <div>2. Scroll to bottom and click 'New Token' button in 'Developer' section</div>
                                    <div>3. Choose 'No expiration'</div>
                                    <div>4. Select 'orders:read', 'subscriptions:read', and 'organizations:read' permissions</div>
                                    <div>5. Create the token and copy/paste it here</div>
                                </div>
                            </div>
                        )}

                        {provider === "dodopayments" && (
                            <div style={helperBoxStyle}>
                                <a
                                    href="https://app.dodopayments.com/developer/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to open your DodoPayment dashboard
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Go to Settings &gt; API Keys or Developer section</div>
                                    <div>2. Create a new Read-only API key</div>
                                    <div>3. Copy the generated API key and paste it here</div>
                                </div>
                            </div>
                        )}

                        {provider === "paddle" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                <div style={{
                                    marginTop: 12,
                                    padding: 16,
                                    border: "1px solid var(--modal-card-border)",
                                    borderRadius: 8,
                                    background: "var(--modal-card-bg)",
                                    position: "relative"
                                }}>
                                    <a
                                        href="https://vendors.paddle.com/authentication"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: "none" }}
                                    >
                                        <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                            Click here to open your Paddle dashboard
                                            <ExternalLink size={14} />
                                        </p>
                                    </a>
                                    <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                        <div>1. Go to Developer Tools &gt; Authentication</div>
                                        <div>2. Generate a new API key and paste it here</div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: "12px 16px",
                                    background: "color-mix(in srgb, #f59e0b 14%, var(--color-surface))",
                                    border: "1px solid color-mix(in srgb, #f59e0b 32%, var(--color-border))",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: "color-mix(in srgb, #f59e0b 72%, var(--color-text))",
                                    fontFamily: "monospace"
                                }}>
                                    <span style={{ fontWeight: 700, color: "color-mix(in srgb, #f59e0b 78%, var(--color-text))" }}>Important:</span> Use an API key from <span style={{ fontWeight: 700, color: "color-mix(in srgb, #f59e0b 78%, var(--color-text))" }}>Paddle Billing</span>, not Paddle Classic.
                                </div>
                            </div>
                        )}

                        {provider === "revenuecat" && (
                            <div style={helperBoxStyle}>
                                <a
                                    href="https://app.revenuecat.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to open your RevenueCat dashboard
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Go to 'API Keys' section</div>
                                    <div>2. Create a new Secret API key (V2 API version + 'Read only' permissions for all)</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RevenueCat Project ID */}
                    {provider === "revenuecat" && (
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)", marginBottom: 8, display: "block", fontFamily: "monospace" }}>
                                2. Project ID
                            </label>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid var(--modal-input-border)',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontFamily: "monospace",
                                    outline: "none",
                                    background: "var(--modal-input-bg)",
                                    color: "var(--color-text)"
                                }}
                                placeholder="e.g., 4f956494"
                                value={revenueCatProjectId}
                                onChange={(e) => setRevenueCatProjectId(e.target.value)}
                                required
                            />
                            <div style={{
                                marginTop: 12,
                                padding: 16,
                                border: "1px solid var(--color-border)",
                                borderRadius: 8,
                                background: "var(--color-surface)",
                                position: "relative"
                            }}>
                                <a
                                    href="https://app.revenuecat.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to open your RevenueCat dashboard
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Go to 'Project Settings' and copy the Project ID</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RevenueCat Share URL */}
                    {provider === "revenuecat" && (
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)", marginBottom: 8, display: "block", fontFamily: "monospace" }}>
                                3. Share URL
                            </label>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid var(--modal-input-border)',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontFamily: "monospace",
                                    outline: "none",
                                    background: "var(--modal-input-bg)",
                                    color: "var(--color-text)"
                                }}
                                placeholder="https://verified.revenuecat.com/habitsgarden"
                                value={revenueCatShareUrl}
                                onChange={(e) => setRevenueCatShareUrl(e.target.value)}
                                required
                            />
                            <div style={{
                                marginTop: 12,
                                padding: 16,
                                border: "1px solid var(--color-border)",
                                borderRadius: 8,
                                background: "var(--color-surface)",
                                position: "relative"
                            }}>
                                <a
                                    href="https://app.revenuecat.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to open your RevenueCat dashboard
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Enable 'Verified Metrics' in 'Project Settings' &gt; 'Share'</div>
                                    <div>2. The Chart must include Sparklines and Visible Metrics must include MRR and Revenue</div>
                                    <div>3. Copy the slug from your verified page URL</div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Polar Org ID */}
                    {provider === "polar" && (
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-secondary)", marginBottom: 8, display: "block", fontFamily: "monospace" }}>
                                2. Organization Identifier
                            </label>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    border: '1px solid var(--modal-input-border)',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    fontFamily: "monospace",
                                    outline: "none",
                                    background: "var(--modal-input-bg)",
                                    color: "var(--color-text)"
                                }}
                                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                                value={polarOrgId}
                                onChange={(e) => setPolarOrgId(e.target.value)}
                                required
                            />
                            <div style={{
                                marginTop: 12,
                                padding: 16,
                                border: "1px solid var(--color-border)",
                                borderRadius: 8,
                                background: "var(--color-surface)",
                                position: "relative"
                            }}>
                                <a
                                    href="https://polar.sh/dashboard"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                >
                                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--color-text)", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 6 }}>
                                        Click here to open your Polar dashboard
                                        <ExternalLink size={14} />
                                    </p>
                                </a>
                                <div style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "var(--color-secondary)", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                                    <div>1. Your organization Identifier in Settings &gt; General &gt; Organization Identifier</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category Selection */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: "var(--field-label-color)", marginBottom: 10, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {provider === "polar" ? "4. " : provider === "revenuecat" ? "5. " : "3. "}Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={darkInputStyle}
                        >
                            <option value="Analytics">Analytics</option>
                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                            <option value="Community">Community</option>
                            <option value="Content Creation">Content Creation</option>
                            <option value="Crypto & Web3">Crypto & Web3</option>
                            <option value="Customer Support">Customer Support</option>
                            <option value="Design">Design</option>
                            <option value="Developer Tools">Developer Tools</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Education">Education</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Fintech">Fintech</option>
                            <option value="Games">Games</option>
                            <option value="Green Tech">Green Tech</option>
                            <option value="Health & Fitness">Health & Fitness</option>
                            <option value="IoT & Hardware">IoT & Hardware</option>
                            <option value="Legal">Legal</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Marketplace">Marketplace</option>
                            <option value="Mobile Apps">Mobile Apps</option>
                            <option value="News & Magazines">News & Magazines</option>
                            <option value="No-Code">No-Code</option>
                            <option value="Productivity">Productivity</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Recruiting & HR">Recruiting & HR</option>
                            <option value="SaaS">SaaS</option>
                            <option value="Sales">Sales</option>
                            <option value="Security">Security</option>
                            <option value="Social Media">Social Media</option>
                            <option value="Travel">Travel</option>
                            <option value="Utilities">Utilities</option>
                        </select>
                    </div>

                    {/* Optional X Handle */}
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: "var(--field-label-color)", marginBottom: 10, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {provider === "polar" ? "5. " : provider === "revenuecat" ? "6. " : "4. "}X handle (optional)
                        </label>
                        <input
                            type="text"
                            style={darkInputStyle}
                            placeholder="username"
                            value={xHandle}
                            onChange={(e) => setXHandle(e.target.value)}
                        />
                    </div>

                    {/* Anonymous toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 2 }}>
                        <label style={{ position: "relative", width: 20, height: 20, borderRadius: "50%", border: isAnonymous ? "6px solid #6366f1" : "1px solid var(--color-border)", cursor: "pointer", display: "inline-block", background: "transparent", transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                style={{ opacity: 0, position: "absolute", margin: 0, width: 0, height: 0 }}
                            />
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", display: 'flex', alignItems: 'center', gap: 6 }}>
                            Anonymous mode
                            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid var(--color-border)", color: "var(--color-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
                                i
                            </div>
                        </span>
                    </div>

                    <div style={{ height: 1, background: "rgba(224,232,239,0.08)", margin: "0 -32px", width: "calc(100% + 64px)" }} />

                    {/* Sale details conditional block */}
                    {isListedForSale && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "var(--color-surface)", padding: 20, borderRadius: 20, border: "1px solid var(--color-border)", marginTop: -8, boxShadow: "var(--shadow-card)" }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 8, display: "block" }}>Asking Price ($)</label>
                                    <input type="number" min="0" step="any" required value={askingPrice} onChange={e => setAskingPrice(e.target.value)} style={{ ...darkInputStyle, borderRadius: 14, padding: '12px 14px' }} placeholder="e.g. 50000" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 8, display: "block" }}>Margin % (30d)</label>
                                    <input type="number" min="0" max="100" step="any" required value={profitMargin} onChange={e => setProfitMargin(e.target.value)} style={{ ...darkInputStyle, borderRadius: 14, padding: '12px 14px' }} placeholder="e.g. 85" />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 8, display: "block" }}>Contact Email (Hidden)</label>
                                <input type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ ...darkInputStyle, borderRadius: 14, padding: '12px 14px' }} placeholder="founder@startup.com" />
                            </div>
                        </div>
                    )}

                    {/* Footer / Submit area */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, paddingTop: 10 }}>
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
                                    backgroundColor: isListedForSale ? "#5b7cff" : "rgba(148,163,184,0.26)",
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", borderRadius: 24
                                }}>
                                    <span style={{
                                        position: "absolute", content: '""', height: 18, width: 18, left: 3, top: 3,
                                        backgroundColor: "white", transition: ".2s", borderRadius: "50%",
                                        transform: isListedForSale ? "translateX(20px)" : "translateX(0)",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                                    }} />
                                </span>
                            </label>
                            <span style={{ fontSize: 13, color: "var(--color-text)", fontWeight: 700 }}>List for sale</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !provider || !apiKey}
                            style={{
                                background: (isSubmitting || !provider || !apiKey) ? "var(--field-input-bg)" : "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                                color: (isSubmitting || !provider || !apiKey) ? "var(--color-secondary)" : "white",
                                border: (isSubmitting || !provider || !apiKey) ? "1px solid var(--field-input-border)" : "1px solid rgba(255,255,255,0.12)",
                                padding: "13px 24px",
                                borderRadius: 18,
                                fontSize: 14,
                                fontWeight: 800,
                                cursor: (isSubmitting || !provider || !apiKey) ? "not-allowed" : "pointer",
                                opacity: 1,
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: (isSubmitting || !provider || !apiKey) ? "var(--field-input-shadow)" : "0 16px 30px rgba(91,124,255,0.24), inset 0 1px 0 rgba(255,255,255,0.24)"
                            }}
                        >
                            {isSubmitting ? "Submitting..." : "Add startup"}
                        </button>
                    </div>
                </form>

                {successData && (
                    <ListingPlanModal
                        isOpen={showListingModal}
                        onClose={() => {
                            setShowListingModal(false);
                            onClose();
                        }}
                        onConfirm={() => {
                            setShowListingModal(false);
                            onClose();
                        }}
                        startupName="Your Startup"
                        startupId={successData.startupId}
                    />
                )}
            </div>
        </div>,
        document.body
    );
}
