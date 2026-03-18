export default function Loading() {
    return (
        <div className="page-container" style={{ paddingTop: 100, paddingBottom: 80 }}>
            {/* Breadcrumb Skeleton */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, padding: "0 12px" }}>
                <div className="skeleton" style={{ width: 40, height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 80, height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 4 }} />
            </div>

            {/* Profile Card Skeleton */}
            <div className="card" style={{ padding: "48px", marginBottom: "40px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                        <div className="skeleton" style={{ width: 88, height: 88, borderRadius: "50%" }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: "40%", height: 32, marginBottom: 12, borderRadius: 6 }} />
                            <div className="skeleton" style={{ width: "20%", height: 16, borderRadius: 4 }} />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <div className="skeleton" style={{ width: 100, height: 40, borderRadius: 12 }} />
                        <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 12 }} />
                    </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18, marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton" style={{ height: 138, borderRadius: 20 }} />
                    ))}
                </div>

                {/* Chart Skeleton */}
                <div style={{ marginBottom: 40 }}>
                    <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 20, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 400, borderRadius: 24 }} />
                </div>
            </div>
        </div>
    );
}
