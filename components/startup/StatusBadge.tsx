// StatusBadge — reusable status chip for startup cards
// Usage: <StatusBadge status="sale" /> | "sold" | "offers" | "new"

interface StatusBadgeProps {
    status: "sale" | "sold" | "offers" | "new";
    label?: string;
}

type BadgeConfig = { label: string; background: string; color: string };

const CONFIG: Record<string, BadgeConfig> = {
    sale: { label: "FOR SALE", background: "#FEF3C7", color: "#92400E" },
    sold: { label: "SOLD", background: "#FEE2E2", color: "#991B1B" },
    offers: { label: "OFFERS", background: "#DBEAFE", color: "#1E40AF" },
    new: { label: "NEW", background: "#DCFCE7", color: "#166534" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
    const cfg = CONFIG[status];
    if (!cfg) return null;
    return (
        <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            background: cfg.background,
            color: cfg.color,
            whiteSpace: "nowrap",
            flexShrink: 0,
        }}>
            {label ?? cfg.label}
        </span>
    );
}
