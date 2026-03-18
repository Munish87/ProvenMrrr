"use client";

import { useState } from "react";
import { replyToOffer } from "@/app/actions/user";
import { Send, CheckCircle2 } from "lucide-react";

interface OfferReplyFormProps {
    offerId: string;
    existingReply?: string | null;
}

export function OfferReplyForm({ offerId, existingReply }: OfferReplyFormProps) {
    const [message, setMessage] = useState(existingReply || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(!!existingReply);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await replyToOffer(offerId, message);
            setShowSuccess(true);
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Failed to send reply:", error);
            alert("Failed to send reply. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div style={{
                marginTop: 16,
                padding: "16px 20px",
                background: "rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 10
            }}>
                <CheckCircle2 size={18} color="var(--color-positive)" />
                <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-positive)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reply Sent to Buyer</p>
                    <p style={{ fontSize: 13, color: "white", opacity: 0.8, margin: 0, marginTop: 4, fontWeight: 500 }}>
                        "{message}"
                    </p>
                </div>
                {!existingReply && (
                    <button 
                        onClick={() => setShowSuccess(false)}
                        style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "white", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", transition: "all 0.2s" }}
                    >
                        Edit
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div style={{ position: "relative" }}>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message or counter-offer to send to the buyer..."
                    style={{
                        width: "100%",
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        fontSize: 15,
                        color: "white",
                        minHeight: 100,
                        resize: "vertical",
                        outline: "none",
                        transition: "all 0.25s"
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "var(--color-accent)";
                        e.target.style.background = "rgba(255,255,255,0.08)";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.05)";
                        e.target.style.background = "rgba(255,255,255,0.03)";
                    }}
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="btn btn-primary btn-sm"
                    style={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: isSubmitting || !message.trim() ? 0.5 : 1
                    }}
                >
                    {isSubmitting ? "Sending..." : (
                        <>
                            <Send size={14} />
                            Send Reply
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
