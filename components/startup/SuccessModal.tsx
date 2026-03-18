"use client";

import { CheckCircle, X, ExternalLink, Link as LinkIcon, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function SuccessModal({ isOpen, onClose, startupId, claimToken }: { isOpen: boolean; onClose: () => void; startupId: string; claimToken: string | null }) {
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
        padding: '40px 32px',
        position: 'relative',
        maxHeight: '85vh',
        overflowY: 'auto',
        textAlign: 'center'
    };

    return createPortal(
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={contentStyle}>
                <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--color-secondary)" }}>
                    <X size={20} />
                </button>

                <CheckCircle size={64} color="#10B981" style={{ margin: "0 auto 24px" }} />

                <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "var(--color-text)" }}>Your startup is now live!</h2>
                <p style={{ margin: "0 0 32px", color: "var(--color-secondary)", fontSize: 16, lineHeight: 1.5 }}>
                    We&apos;ve verified your revenue and placed you in the database.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Link href={`/startup/${startupId}`} className="btn btn-primary" style={{ padding: "14px 24px", fontSize: 16 }}>
                        <ExternalLink size={18} />
                        View live listing
                    </Link>

                    {claimToken ? (
                        <div style={{ background: "#F3F4F6", padding: "20px", borderRadius: 12, marginTop: 12, textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <Briefcase size={18} color="#4F46E5" />
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>Save your claim link</h3>
                            </div>
                            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#4B5563", lineHeight: 1.4 }}>
                                You created this listing securely without an account. Save this link to attach the startup to your profile later.
                            </p>

                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={claimUrl!}
                                    className="form-input"
                                    style={{ fontSize: 12, background: "white" }}
                                />
                                <button
                                    onClick={copyClaimLink}
                                    className="btn btn-secondary"
                                    style={{ padding: "0 16px", flexShrink: 0 }}
                                >
                                    {copied ? "Copied!" : <LinkIcon size={16} />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/dashboard" className="btn btn-secondary" style={{ padding: "14px 24px", fontSize: 16 }}>
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
