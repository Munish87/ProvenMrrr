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
            console.error("Failed to send reply:", error);
            alert("Failed to send reply. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div style={{
                marginTop: 16,
                padding: "12px 16px",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 10
            }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", margin: 0 }}>Reply Sent to Buyer</p>
                    <p style={{ fontSize: 13, color: "#166534", opacity: 0.8, margin: 0, marginTop: 2 }}>
                        "{message}"
                    </p>
                </div>
                {!existingReply && (
                    <button 
                        onClick={() => setShowSuccess(false)}
                        style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#166534", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
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
                        padding: "12px 16px",
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        fontSize: 14,
                        minHeight: 80,
                        resize: "vertical",
                        outline: "none",
                        transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
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
