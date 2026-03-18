"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Save, AlertCircle } from "lucide-react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

export default function ProfilePage() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [xHandle, setXHandle] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
                setEmail(user.email ?? "");
                const { data } = await supabase.from("users").select("name, x_handle, avatar_url").eq("id", user.id)
                    .returns<{ name: string | null; x_handle: string | null; avatar_url: string | null }[]>().single();
                if (data) {
                    setName(data.name || "");
                    setXHandle(data.x_handle || "");
                    setAvatarUrl(data.avatar_url);
                }
            }
        });
    }, [supabase]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await (supabase as any)
            .from("users")
            .update({
                name,
                x_handle: xHandle,
            })
            .eq("id", user.id);

        if (error) {
            setMsg({ type: "error", text: error.message });
            setSaving(false);
            return;
        }

        setMsg({ type: "success", text: "Profile saved." });
        setSaving(false);
    }

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 64 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 24 }}>Profile</h1>

            <div className="card" style={{ padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 24, borderBottom: "1px solid var(--color-border)", marginBottom: 24 }}>
                    {userId ? (
                        <AvatarUpload
                            userId={userId}
                            userName={name || email}
                            currentAvatarUrl={avatarUrl}
                            onUploadSuccess={(url) => setAvatarUrl(url)}
                        />
                    ) : (
                        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                            <User size={30} />
                        </div>
                    )}
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>{name || "Anonymous Founder"}</p>
                        <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, marginTop: 2 }}>{email}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label className="field-label" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 8, display: "block" }}>Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="field-input"
                        />
                    </div>

                    <div>
                        <label className="field-label" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 8, display: "block" }}>X / Twitter Handle</label>
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, display: "flex", alignItems: "center", color: "var(--color-secondary)", fontSize: 14, fontWeight: 500 }}>
                                x.com/
                            </div>
                            <input
                                type="text"
                                value={xHandle}
                                onChange={(e) => setXHandle(e.target.value.replace(/^@/, "").replace(/https?:\/\/(www\.)?(x\.com|twitter\.com)\//, ""))}
                                placeholder="username"
                                className="field-input"
                                style={{ paddingLeft: 60 }}
                            />
                        </div>
                        <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 6 }}>This is used to display your founder profile on startups.</p>
                    </div>

                    {msg && (
                        <div style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 500,
                            background: msg.type === "success" ? "#ECFDF5" : "#FEF2F2",
                            border: `1px solid ${msg.type === "success" ? "#A7F3D0" : "#FECACA"}`,
                            color: msg.type === "success" ? "#059669" : "#DC2626",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            {msg.type === "error" && <AlertCircle size={18} />}
                            {msg.text}
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
                            {saving ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
