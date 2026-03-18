"use client";

import { Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface DeleteStartupButtonProps {
    startupId: string;
    startupName: string;
    action: (formData: FormData) => void | Promise<void>;
}

export function DeleteStartupButton({ startupId, startupName, action }: DeleteStartupButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f87171",
                    background: "rgba(248, 113, 113, 0.08)",
                    border: "1px solid rgba(248, 113, 113, 0.16)",
                    cursor: "pointer",
                    padding: "10px 14px",
                    borderRadius: 999,
                }}
            >
                <Trash2 size={14} /> Delete startup
            </button>

            {mounted && isOpen && createPortal(
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "radial-gradient(circle at top, rgba(125, 162, 255, 0.12), transparent 24%), rgba(4, 10, 18, 0.62)",
                        backdropFilter: "blur(18px) saturate(150%)",
                        WebkitBackdropFilter: "blur(18px) saturate(150%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 99999,
                        padding: 24,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 460,
                            background: "linear-gradient(180deg, rgba(214, 223, 230, 0.16), rgba(104, 110, 116, 0.08) 18%, rgba(26, 28, 28, 0.72) 58%, rgba(18, 19, 18, 0.92))",
                            backdropFilter: "blur(30px) saturate(180%)",
                            WebkitBackdropFilter: "blur(30px) saturate(180%)",
                            borderRadius: 28,
                            border: "1px solid rgba(224, 232, 239, 0.22)",
                            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -10px 20px rgba(0,0,0,0.08)",
                            padding: 28,
                            position: "relative",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                background: "rgba(24, 38, 59, 0.7)",
                                border: "1px solid rgba(184, 204, 255, 0.22)",
                                cursor: "pointer",
                                color: "var(--color-secondary)",
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <X size={16} />
                        </button>

                        <div style={{ width: 48, height: 48, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248, 113, 113, 0.12)", border: "1px solid rgba(248, 113, 113, 0.2)", color: "#f87171", marginBottom: 18 }}>
                            <Trash2 size={22} />
                        </div>

                        <h3 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em" }}>
                            Delete startup?
                        </h3>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--color-secondary)", fontWeight: 500 }}>
                            This will permanently delete <span style={{ color: "var(--color-text)", fontWeight: 700 }}>{startupName}</span> and its related data. This action cannot be undone.
                        </p>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>
                            <form action={action}>
                                <input type="hidden" name="id" value={startupId} />
                                <button
                                    type="submit"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: "#fee2e2",
                                        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.26), rgba(127, 29, 29, 0.22) 42%, rgba(45, 12, 12, 0.9) 100%)",
                                        border: "1px solid rgba(248, 113, 113, 0.24)",
                                        cursor: "pointer",
                                        padding: "12px 16px",
                                        borderRadius: 999,
                                        boxShadow: "0 12px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <Trash2 size={14} /> Yes, delete
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
