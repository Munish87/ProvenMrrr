import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/startup/StatusBadge";
import { CategoryBadge } from "@/components/startup/CategoryBadge";
import type { Database } from "@/lib/supabase/types";

type StartupBase = {
    id: string;
    name: string;
    logo_url?: string | null;
    category: string | null;
    description: string | null;
    is_listed_for_sale: boolean;
    is_verified: boolean;
    is_anonymous?: boolean;
    created_at: string;
};

type SnapBase = {
    mrr: number;
    growth_rate: number;
    all_time_revenue?: number;
};

export function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString('en-US')}k`;
    return `$${n.toLocaleString('en-US')}`;
}

export function fmtMultiple(price: number, mrr: number) {
    if (!mrr) return "—";
    return `${(price / (mrr * 12)).toFixed(1)}x`;
}

export function StartupDiscoveryCard({ s, snap }: { s: StartupBase; snap?: SnapBase }) {
    const priceMultiplier = 2.5 + ((s.name.charCodeAt(0) % 20) / 10);
    const price = snap ? Math.round(snap.mrr * 12 * priceMultiplier) : 0;

    const metric1 = { label: "REVENUE (30D)", value: snap ? fmtMoney(snap.mrr) : "—", color: "#111827" };
    let metric2: { label: string; value: string; color: string };
    let metric3: { label: string; value: string; color: string };

    if (s.is_listed_for_sale) {
        metric2 = { label: "MRR", value: price ? fmtMoney(price) : "—", color: "#111827" };
        metric3 = { label: "TOTAL", value: snap ? fmtMultiple(price, snap.mrr) : "—", color: "#111827" };
    } else if (snap) {
        metric2 = { label: "MRR", value: snap.mrr ? fmtMoney(snap.mrr) : "—", color: "#111827" };
        metric3 = { label: s.category === "Ecommerce" ? "GMV" : "TOTAL", value: snap.all_time_revenue ? fmtMoney(snap.all_time_revenue) : "—", color: "#111827" };
    } else {
        metric2 = { label: "MRR", value: "—", color: "#111827" };
        metric3 = { label: "TOTAL", value: "—", color: "#111827" };
    }

    return (
        <Link href={`/startup/${s.id}`} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>
            <div style={{
                position: "relative",
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "24px 20px 20px 20px",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                transition: "box-shadow 0.15s ease",
            }} className="trust-card-hover">
                {s.is_listed_for_sale && (
                    <div style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "#FEF3C7",
                        color: "#D97706",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        padding: "4px 8px",
                        borderTopRightRadius: "11px",
                        borderBottomLeftRadius: "6px",
                        textTransform: "uppercase"
                    }}>
                        For Sale
                    </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    {s.logo_url && !s.is_anonymous ? (
                        <div style={{ width: 42, height: 42, borderRadius: "8px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                            <Image src={s.logo_url} alt={s.name} fill className="object-cover" unoptimized />
                        </div>
                    ) : (
                        <div style={{ width: 42, height: 42, borderRadius: "8px", background: s.name.length % 2 === 0 ? "#14b8a6" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "white", flexShrink: 0, filter: s.is_anonymous ? "blur(5px)" : "none" }}>
                            {s.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", filter: s.is_anonymous ? "blur(5px)" : "none" }}>
                        {s.name}
                    </p>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", flexGrow: 1 }}>
                    {s.description || `${s.category || 'Software'} Platform`}
                </p>

                <div style={{ marginTop: 20, marginBottom: 16, borderTop: "1px dashed #E5E7EB", width: "100%" }} />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {[metric1, metric2, metric3].map((m) => (
                        <div key={m.label} style={{ display: "flex", flexDirection: "column" }}>
                            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, lineHeight: 1, textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.05em", fontFamily: "monospace" }}>{m.label}</p>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, lineHeight: 1.2, color: m.color, whiteSpace: "nowrap" }}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .trust-card-hover:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                }
            `}} />
        </Link>
    );
}
