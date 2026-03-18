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
        <div style={{ maxWidth: 760, margin: 0, paddingBottom: 64 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 32 }}>Profile</h1>

            <div className="card" style={{ padding: 40, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 24, borderBottom: "1px solid rgba(224,232,239,0.1)", marginBottom: 32 }}>
                    {userId ? (
                        <div style={{ transform: "scale(1.1)", transformOrigin: "left" }}>
                            <AvatarUpload
                                userId={userId}
                                userName={name || email}
                                currentAvatarUrl={avatarUrl}
                                onUploadSuccess={(url) => setAvatarUrl(url)}
                            />
                        </div>
                    ) : (
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                            <User size={24} />
                        </div>
                    )}
                    <div>
                        <p style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{name || "Anonymous Founder"}</p>
                        <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: 0, marginTop: 4, fontWeight: 500 }}>{email}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div>
                        <label className="field-label" style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text)", marginBottom: 10, display: "block" }}>Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="field-input"
                        />
                    </div>

                    <div>
                        <label className="field-label" style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text)", marginBottom: 10, display: "block" }}>X / Twitter Handle</label>
                        <input
                            type="text"
                            value={xHandle}
                            onChange={(e) => setXHandle(e.target.value)}
                            placeholder="x.com/username"
                            className="field-input"
                        />
                        <p style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 8, fontWeight: 500 }}>This is used to display your founder profile on startups.</p>
                    </div>

                    {msg && (
                        <div style={{
                            padding: "12px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            background: msg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            color: msg.type === "success" ? "#10B981" : "#EF4444",
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            <AlertCircle size={16} />
                            {msg.text}
                        </div>
                    )}

                    <div style={{ paddingTop: 8 }}>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ 
                                height: 44, 
                                padding: "0 24px", 
                                fontSize: 13, 
                                fontWeight: 800, 
                                display: "flex", 
                                alignItems: "center", 
                                gap: 10, 
                                opacity: saving ? 0.7 : 1, 
                                cursor: saving ? "not-allowed" : "pointer",
                                boxShadow: "none"
                            }}
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
