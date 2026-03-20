"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactInquiry } from "@/app/actions/contact";

export default function ContactPage() {
    const [email, setEmail] = useState("");
    const [problem, setProblem] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("email", email);
            formData.append("problem", problem);

            const result = await submitContactInquiry(formData);
            
            if (result.success) {
                setStatus("success");
                setEmail("");
                setProblem("");
                setMessage("Thank you! Your message has been sent successfully. We will get back to you soon.");
            } else {
                setStatus("error");
                setMessage(result.error || "Something went wrong. Please try again later.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Something went wrong. Please try again later.");
        }
    };

    return (
        <div className="main-col" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
            <div className="card" style={{ padding: "48px", position: "relative", maxWidth: "600px", width: "100%", boxShadow: "var(--shadow-card)", borderRadius: "24px" }}>
                <Link 
                    href="/" 
                    className="btn btn-secondary" 
                    style={{ position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
                >
                    <X size={20} />
                </Link>

                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.04em" }}>
                        Contact Us
                    </h1>
                    <p style={{ color: "var(--color-secondary)", fontSize: "16px", fontWeight: 500 }}>
                        Have a problem or a question? Send us a message and we'll help you out.
                    </p>
                </div>

                {status === "success" ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ display: "inline-flex", padding: "16px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "50%", marginBottom: "20px" }}>
                            <CheckCircle2 size={48} color="#22c55e" />
                        </div>
                        <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "12px" }}>Message Sent!</h2>
                        <p style={{ color: "var(--color-secondary)", marginBottom: "32px" }}>{message}</p>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => setStatus("idle")}
                            style={{ padding: "12px 32px" }}
                        >
                            Send another message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label htmlFor="email" style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-secondary)", opacity: 0.8 }}>
                                YOUR EMAIL
                            </label>
                            <input 
                                id="email"
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                style={{ 
                                    padding: "16px", 
                                    borderRadius: "12px", 
                                    border: "1px solid var(--color-border)", 
                                    background: "var(--color-surface)", 
                                    fontSize: "16px",
                                    color: "var(--color-text)",
                                    outline: "none"
                                }} 
                                disabled={status === "loading"}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label htmlFor="problem" style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-secondary)", opacity: 0.8 }}>
                                DESCRIBE YOUR PROBLEM
                            </label>
                            <textarea 
                                id="problem"
                                required
                                value={problem}
                                onChange={(e) => setProblem(e.target.value)}
                                placeholder="How can we help you?"
                                rows={6}
                                style={{ 
                                    padding: "16px", 
                                    borderRadius: "12px", 
                                    border: "1px solid var(--color-border)", 
                                    background: "var(--color-surface)", 
                                    fontSize: "16px",
                                    color: "var(--color-text)",
                                    outline: "none",
                                    resize: "none"
                                }} 
                                disabled={status === "loading"}
                            />
                        </div>

                        {status === "error" && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontSize: "14px", fontWeight: 600 }}>
                                <AlertCircle size={16} />
                                {message}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ 
                                padding: "18px", 
                                fontSize: "16px", 
                                fontWeight: "700", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                gap: "10px",
                                marginTop: "8px"
                            }}
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "SENDING..." : (
                                <>
                                    SEND MESSAGE <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}
                
                <p style={{ marginTop: "32px", textAlign: "center", fontSize: "13px", color: "var(--color-secondary)", opacity: 0.6 }}>
                    Our team typically responds within 24-48 hours.
                </p>
            </div>
        </div>
    );
}
