export function CategoryBadge({ category }: { category: string }) {
    let color = "#9CA3AF"; // default

    switch (category) {
        case "Developer Tools":
            color = "#3B82F6"; // blue
            break;
        case "SaaS":
            color = "#10B981"; // green
            break;
        case "E-commerce":
            color = "#F97316"; // orange
            break;
        case "Fintech":
            color = "#6366F1"; // indigo
            break;
        case "AI":
            color = "#8B5CF6"; // purple
            break;
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: color,
                flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                {category}
            </span>
        </div>
    );
}
