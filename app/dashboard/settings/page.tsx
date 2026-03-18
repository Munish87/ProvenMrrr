"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Save } from "lucide-react";

export default function SettingsPage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    }, [supabase]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        if (newPassword) {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                setMsg({ type: "error", text: error.message });
                setSaving(false);
                return;
            }
        }

        setMsg({ type: "success", text: "Settings saved." });
        setNewPassword("");
        setSaving(false);
    }

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 64 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", marginBottom: 24, letterSpacing: "-0.02em" }}>Settings</h1>

            <div className="card" style={{ padding: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 24, borderBottom: "1px solid rgba(0,0,0,0.05)", marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 }}>
                        {email ? email.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{email}</p>
                        <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, marginTop: 2, fontWeight: 500 }}>Founder account</p>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label className="field-label" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 10, display: "block" }}>Email address</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="field-input"
                            style={{ opacity: 0.6, cursor: "not-allowed", background: "rgba(0,0,0,0.02)", color: "var(--color-secondary)", border: "1px solid rgba(0,0,0,0.05)" }}
                        />
                        <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 8, fontWeight: 500 }}>Contact support to change your email.</p>
                    </div>

                    <div>
                        <label className="field-label" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 10, display: "block" }}>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                            minLength={8}
                            className="field-input"
                        />
                    </div>

                    {msg && (
                        <div style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 500,
                            background: msg?.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            border: `1px solid ${msg?.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                            color: msg?.type === "success" ? "#10B981" : "#FF6B6B",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            {msg?.text}
                        </div>
                    )}

                    <div style={{ paddingTop: 8 }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ height: 44, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
