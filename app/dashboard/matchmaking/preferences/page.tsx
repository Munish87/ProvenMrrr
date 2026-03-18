"use client";

import { useEffect, useState } from "react";
import { getBuyerPreferences, saveBuyerPreferences, BuyerPreferences } from "@/app/actions/matchmaking";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
    "AI", "SaaS", "Fintech", "Marketing", "Developer Tools", 
    "E-commerce", "Healthtech", "Edtech", "Marketplace", "Web3"
];

export default function PreferencesPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [preferences, setPreferences] = useState<BuyerPreferences>({
        min_budget: null,
        max_budget: null,
        categories: [],
        min_mrr: null,
        min_growth_rate: null,
        min_profit_margin: null,
        requires_mobile_app: false,
        min_team_size: null,
    });
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        async function fetchPrefs() {
            const res = await getBuyerPreferences();
            if (res.success && res.preferences) {
                setPreferences({
                    min_budget: res.preferences.min_budget,
                    max_budget: res.preferences.max_budget,
                    categories: res.preferences.categories || [],
                    min_mrr: res.preferences.min_mrr,
                    min_growth_rate: res.preferences.min_growth_rate,
                    min_profit_margin: res.preferences.min_profit_margin,
                    requires_mobile_app: res.preferences.requires_mobile_app ?? false,
                    min_team_size: res.preferences.min_team_size,
                });
            }
            setIsLoading(false);
        }
        fetchPrefs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);
        const res = await saveBuyerPreferences(preferences);
        setIsSaving(false);
        if (res.success) {
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                router.push('/dashboard/matchmaking');
            }, 1000);
        } else {
            alert("Error saving preferences. Please try again.");
        }
    };

    const toggleCategory = (cat: string) => {
        setPreferences(prev => {
            if (prev.categories.includes(cat)) {
                return { ...prev, categories: prev.categories.filter(c => c !== cat) };
            }
            return { ...prev, categories: [...prev.categories, cat] };
        });
    };

    if (isLoading) return <div>Loading preferences...</div>;

    return (
        <form onSubmit={handleSubmit} className="card" style={{
            padding: 40,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            position: "relative"
        }}>
            {saveSuccess && (
                <div style={{
                    position: "fixed", top: 20, right: 20, 
                    background: "#10B981", color: "white", 
                    padding: "12px 24px", borderRadius: 12, 
                    fontWeight: 600, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    zIndex: 1000, animation: "slideIn 0.3s ease-out"
                }}>
                    Preferences saved successfully!
                </div>
            )}

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
                Acquisition Criteria
            </h2>

            {/* Budget */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 8 }}>Min Budget ($)</label>
                    <input 
                        type="number" 
                        value={preferences.min_budget ?? ""}
                        onChange={(e) => setPreferences({ ...preferences, min_budget: e.target.value ? Number(e.target.value) : null })}
                        className="field-input"
                        placeholder="e.g. 10000"
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 8 }}>Max Budget ($)</label>
                    <input 
                        type="number" 
                        value={preferences.max_budget ?? ""}
                        onChange={(e) => setPreferences({ ...preferences, max_budget: e.target.value ? Number(e.target.value) : null })}
                        className="field-input"
                        placeholder="e.g. 150000"
                    />
                </div>
            </div>

            {/* Financials */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-secondary)", marginBottom: 6 }}>Min MRR ($)</label>
                    <input 
                        type="number" 
                        value={preferences.min_mrr ?? ""}
                        onChange={(e) => setPreferences({ ...preferences, min_mrr: e.target.value ? Number(e.target.value) : null })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", fontSize: 14 }}
                        placeholder="e.g. 500"
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-secondary)", marginBottom: 6 }}>Min Growth Rate (%)</label>
                    <input 
                        type="number" 
                        value={preferences.min_growth_rate ?? ""}
                        onChange={(e) => setPreferences({ ...preferences, min_growth_rate: e.target.value ? Number(e.target.value) : null })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", fontSize: 14 }}
                        placeholder="e.g. 10"
                    />
                </div>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-secondary)", marginBottom: 6 }}>Min Profit Margin (%)</label>
                    <input 
                        type="number" 
                        value={preferences.min_profit_margin ?? ""}
                        onChange={(e) => setPreferences({ ...preferences, min_profit_margin: e.target.value ? Number(e.target.value) : null })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", fontSize: 14 }}
                        placeholder="e.g. 60"
                    />
                </div>
            </div>

            {/* Categories */}
            <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", marginBottom: 12 }}>Preferred Categories</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {CATEGORIES.map(cat => {
                        const isSelected = preferences.categories.includes(cat);
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: 100,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    border: `1px solid ${isSelected ? "var(--color-accent)" : "rgba(0,0,0,0.05)"}`,
                                    background: isSelected ? "rgba(99, 102, 241, 0.05)" : "rgba(0,0,0,0.02)",
                                    color: isSelected ? "var(--color-accent)" : "var(--color-secondary)",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {cat}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Other */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-secondary)", marginBottom: 6 }}>Min Team Size (optional)</label>
                    <input 
                        type="number" 
                        value={preferences.min_team_size ?? ""}
                        onChange={(e) => setPreferences({ ...preferences, min_team_size: e.target.value ? Number(e.target.value) : null })}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", fontSize: 14 }}
                        placeholder="e.g. 2"
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
                    <div 
                        onClick={() => setPreferences({ ...preferences, requires_mobile_app: !preferences.requires_mobile_app })}
                        style={{
                            width: 36, height: 20, 
                            background: preferences.requires_mobile_app ? "var(--color-accent)" : "rgba(0,0,0,0.1)", 
                            borderRadius: 10, position: "relative", cursor: "pointer", transition: "0.2s"
                        }}
                    >
                        <div style={{
                            width: 16, height: 16, background: "white", borderRadius: "50%", 
                            position: "absolute", top: 2, left: preferences.requires_mobile_app ? 18 : 2, 
                            transition: "0.2s"
                        }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>Must have Mobile App</span>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isSaving}
                className="btn btn-primary"
                style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer", marginTop: 16, border: "none"
                }}
            >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Preferences"}
            </button>
        </form>
    );
}
