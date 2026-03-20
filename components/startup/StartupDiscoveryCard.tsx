import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/startup/StatusBadge";
import type { StartupSaleStatus } from "@/lib/startup-sale-status";

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
    sale_status?: StartupSaleStatus | null;
    slug?: string | null;
    asking_price?: number | null;
};

type SnapBase = {
    mrr: number;
    arr?: number;
    growth_rate: number;
    all_time_revenue?: number;
};

export function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `$${Math.round(n)}`;
}

export function fmtMultiple(price: number, mrr: number) {
    if (!mrr) return "-";
    return `${(price / (mrr * 12)).toFixed(1)}x`;
}

export function StartupDiscoveryCard({ s, snap }: { s: StartupBase; snap?: SnapBase }) {
    const saleStatus = s.sale_status === "sold" ? "sold" : (s.is_listed_for_sale ? (s.sale_status ?? "sale") : null);

    const metrics = [
        { label: "MRR", value: snap ? fmtMoney(snap.mrr) : "-" },
        { label: "ATR", value: (snap && snap.all_time_revenue !== undefined) ? fmtMoney(snap.all_time_revenue) : "-" },
        { label: "MULTIPLE", value: (s.asking_price && snap?.mrr) ? fmtMultiple(s.asking_price, snap.mrr) : "-" }
    ];

    const surfaceByStatus = {
        sale: {
            background: "var(--listing-card-sale-bg)",
            border: "1px solid var(--listing-card-sale-border)",
            shadow: "var(--listing-card-sale-shadow)",
            divider: "1px solid var(--listing-card-sale-divider)",
            accent: "var(--listing-card-sale-accent)",
            title: "#ffffff",
            body: "rgba(255, 255, 255, 0.96)",
            meta: "rgba(236, 253, 245, 0.96)",
            value: "#ffffff",
        },
        offers: {
            background: "var(--listing-card-offers-bg)",
            border: "1px solid var(--listing-card-offers-border)",
            shadow: "var(--listing-card-offers-shadow)",
            divider: "1px solid var(--listing-card-offers-divider)",
            accent: "var(--listing-card-offers-accent)",
            title: "#ffffff",
            body: "rgba(255, 251, 235, 0.96)",
            meta: "rgba(255, 237, 213, 0.96)",
            value: "#ffffff",
        },
        sold: {
            background: "var(--listing-card-sold-bg)",
            border: "1px solid var(--listing-card-sold-border)",
            shadow: "var(--listing-card-sold-shadow)",
            divider: "1px solid var(--listing-card-sold-divider)",
            accent: "var(--listing-card-sold-accent)",
            title: "#ffffff",
            body: "rgba(255, 241, 242, 0.96)",
            meta: "rgba(254, 226, 226, 0.96)",
            value: "#ffffff",
        },
    } as const;

    const surface = saleStatus ? surfaceByStatus[saleStatus] : null;

    return (
        <Link
            href={`/startup/${s.slug || s.id}`}
            className={`card card-hover sc-card${saleStatus ? " sc-card-status" : ""}`}
            style={{
                textDecoration: "none",
                background: surface?.background ?? "var(--listing-card-default-bg)",
                border: surface?.border ?? "1px solid var(--listing-card-default-border)",
                boxShadow: surface?.shadow ?? "var(--listing-card-default-shadow)",
                minHeight: 160,
                position: "relative",
                padding: "20px",
                display: "flex",
                flexDirection: "column"
            }}
        >
            {/* Absolute Status Badge */}
            <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                {(s.is_listed_for_sale || saleStatus === "sold") && <StatusBadge status={saleStatus ?? "sale"} />}
            </div>

            {/* Header: Logo + Title Column */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                {s.logo_url && !s.is_anonymous ? (
                    <div
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            flexShrink: 0,
                            position: "relative",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <Image src={s.logo_url} alt={s.name} fill className="object-cover" unoptimized />
                    </div>
                ) : (
                    <div
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #2D3436 0%, #000000 100%)",
                            fontSize: "16px",
                            fontWeight: 800,
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(255,255,255,0.1)",
                            filter: s.is_anonymous ? "blur(5px)" : "none"
                        }}
                    >
                        {s.name.charAt(0).toUpperCase()}
                    </div>
                )}

                <div style={{ overflow: s.is_anonymous ? "visible" : "hidden", textAlign: "left", flex: 1, paddingRight: "50px" }}>
                    <h3
                        style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: "17px",
                            color: surface?.title ?? "var(--color-text)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            overflow: s.is_anonymous ? "visible" : "hidden",
                            textOverflow: s.is_anonymous ? "unset" : "ellipsis",
                            filter: s.is_anonymous ? "blur(6px)" : "none"
                        }}
                    >
                        {s.name}
                    </h3>
                    <p
                        style={{
                            margin: "4px 0 0",
                            fontSize: "11px",
                            color: saleStatus ? surface?.meta : "var(--color-secondary)",
                            fontWeight: 500,
                            lineHeight: 1,
                            opacity: 0.7,
                            letterSpacing: "0.01em"
                        }}
                    >
                        {s.category || "Software Platform"}
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginTop: "auto",
                    paddingTop: "16px",
                    borderTop: surface?.divider ?? "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {metrics.map((m, idx) => (
                    <div key={m.label} style={{ textAlign: idx === 0 ? "left" : (idx === 1 ? "center" : "right"), minWidth: 0 }}>
                        <p style={{
                            margin: "0 0 6px",
                            fontSize: "8px",
                            fontWeight: 600,
                            color: saleStatus ? surface?.meta : "var(--color-muted)",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            opacity: 0.8
                        }}>
                            {m.label}
                        </p>
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 800,
                                fontSize: "16px",
                                color: surface?.value ?? "var(--color-text)",
                                lineHeight: 1,
                                letterSpacing: "-0.02em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {m.value}
                        </p>
                    </div>
                ))}
            </div>
        </Link>
    );
}
