"use client";

import { CheckCircle, X, ExternalLink, Link as LinkIcon, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    startupId: string;
    slug?: string | null;
    claimToken: string | null;
}

export function SuccessModal({ isOpen, onClose, startupId, slug, claimToken }: SuccessModalProps) {
    const [copied, setCopied] = useState(false);
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

    const claimUrl = claimToken ? `${window.location.origin}/claim?token=${claimToken}` : null;

    const copyClaimLink = () => {
        if (!claimUrl) return;
        navigator.clipboard.writeText(claimUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at top, rgba(125, 162, 255, 0.12), transparent 24%), rgba(4, 10, 18, 0.58)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24,
    };

    const contentStyle: React.CSSProperties = {
        width: 520,
        maxWidth: '92%',
        background: 'linear-gradient(180deg, rgba(214, 223, 230, 0.16), rgba(104, 110, 116, 0.08) 18%, rgba(26, 28, 28, 0.72) 58%, rgba(18, 19, 18, 0.92))',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: 30,
        border: '1px solid rgba(224, 232, 239, 0.22)',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 20px rgba(0,0,0,0.08)',
        padding: '48px 32px',
        position: 'relative',
        maxHeight: '85vh',
        overflowY: 'auto',
        textAlign: 'center'
    };

    return createPortal(
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={contentStyle}>
                <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(24, 38, 59, 0.7)", border: "1px solid rgba(184, 204, 255, 0.22)", cursor: "pointer", color: "var(--color-secondary)", width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={20} />
                </button>

                <CheckCircle size={64} color="#10B981" style={{ margin: "0 auto 24px", filter: "drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))" }} />

                <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px", color: "var(--color-text)", letterSpacing: "-0.02em" }}>Your startup is now live!</h2>
                <p style={{ margin: "0 0 32px", color: "var(--color-secondary)", fontSize: 16, lineHeight: 1.6, fontWeight: 500 }}>
                    We&apos;ve verified your revenue and placed you in the database.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Link 
                        href={`/startup/${slug || startupId}`} 
                        className="btn btn-primary" 
                        style={{ 
                            padding: "14px 24px", 
                            fontSize: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            background: "linear-gradient(135deg, #7da2ff 0%, #5b7cff 45%, #4465f5 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: 18,
                            fontWeight: 800,
                            textDecoration: "none"
                        }}
                    >
                        <ExternalLink size={18} />
                        View live listing
                    </Link>

                    {claimToken && (
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: 18, marginTop: 12, textAlign: "left", border: "1px solid rgba(224,232,239,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <Briefcase size={18} color="#8eaaff" />
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>Save your claim link</h3>
                            </div>
                            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-secondary)", lineHeight: 1.5, fontWeight: 500 }}>
                                You created this listing securely without an account. Save this link to attach the startup to your profile later.
                            </p>

                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={claimUrl!}
                                    style={{ 
                                        flex: 1,
                                        fontSize: 12, 
                                        padding: "10px 14px",
                                        background: "rgba(0,0,0,0.2)", 
                                        border: "1px solid rgba(224,232,239,0.1)", 
                                        color: "var(--color-text)", 
                                        borderRadius: 12,
                                        outline: "none"
                                    }}
                                />
                                <button
                                    onClick={copyClaimLink}
                                    className="btn btn-secondary"
                                    style={{ 
                                        padding: "0 16px", 
                                        flexShrink: 0, 
                                        minWidth: 88,
                                        height: 38,
                                        fontSize: 13,
                                        fontWeight: 700
                                    }}
                                >
                                    {copied ? "Copied!" : <LinkIcon size={16} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
