import { fetchAllAdvertisers, approveAdvertiser, disableAdvertiser, deleteAdvertiser } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisersPage() {
    const advertisers = await fetchAllAdvertisers();

    const groups = {
        active: advertisers.filter((a) => a.status === "active"),
        pending: advertisers.filter((a) => a.status === "pending"),
        expired: advertisers.filter((a) => a.status === "expired"),
    };

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>Advertiser Management</h1>
                <p style={{ color: "#6B7280", marginTop: 4 }}>
                    {groups.active.length} active · {groups.pending.length} pending · {groups.expired.length} expired
                </p>
            </div>

            {/* ── Pending ─────────────────────────────────── */}
            {groups.pending.length > 0 && (
                <Section title="⏳ Pending Review" count={groups.pending.length} color="#FEF9C3">
                    <AdTable rows={groups.pending} formatDate={formatDate} showApprove showDelete />
                </Section>
            )}

            {/* ── Active ──────────────────────────────────── */}
            <Section title="✅ Active" count={groups.active.length} color="#DCFCE7">
                <AdTable rows={groups.active} formatDate={formatDate} showDisable showDelete />
            </Section>

            {/* ── Expired ─────────────────────────────────── */}
            {groups.expired.length > 0 && (
                <Section title="🔴 Expired" count={groups.expired.length} color="#FEE2E2">
                    <AdTable rows={groups.expired} formatDate={formatDate} showApprove showDelete />
                </Section>
            )}
        </div>
    );
}

function Section({
    title, count, color, children,
}: {
    title: string; count: number; color: string; children: React.ReactNode;
}) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</h2>
                <span style={{ background: color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700, color: "#374151" }}>{count}</span>
            </div>
            <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                {children}
            </div>
        </div>
    );
}

type TableRow = {
    id: string;
    company_name: string;
    title: string;
    website_url: string;
    plan_type: string;
    status: string;
    created_at: string;
    expires_at: string | null;
};

function AdTable({
    rows, formatDate, showApprove, showDisable, showDelete,
}: {
    rows: TableRow[];
    formatDate: (d: string | null) => string;
    showApprove?: boolean;
    showDisable?: boolean;
    showDelete?: boolean;
}) {
    return (
        <table className="admin-table">
            <thead>
                <tr>
                    <th>Company</th>
                    <th>Headline</th>
                    <th>Plan</th>
                    <th>Expires</th>
                    <th>Added</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id}>
                        <td>
                            <div style={{ fontWeight: 600, color: "#111827" }}>{row.company_name}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                <a href={row.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#6366F1" }}>
                                    {row.website_url.replace(/^https?:\/\//, "")}
                                </a>
                            </div>
                        </td>
                        <td style={{ color: "#374151" }}>{row.title}</td>
                        <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", background: "#F5F3FF", padding: "2px 8px", borderRadius: 12 }}>
                                {row.plan_type}
                            </span>
                        </td>
                        <td style={{ color: "#6B7280", fontSize: 13 }}>{formatDate(row.expires_at)}</td>
                        <td style={{ color: "#6B7280", fontSize: 13 }}>{formatDate(row.created_at)}</td>
                        <td>
                            <div style={{ display: "flex", gap: 6 }}>
                                {showApprove && (
                                    <form action={approveAdvertiser.bind(null, row.id)}>
                                        <button type="submit" style={{ padding: "4px 10px", background: "#DCFCE7", color: "#15803D", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                            Approve
                                        </button>
                                    </form>
                                )}
                                {showDisable && (
                                    <form action={disableAdvertiser.bind(null, row.id)}>
                                        <button type="submit" style={{ padding: "4px 10px", background: "#FEF9C3", color: "#A16207", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                            Disable
                                        </button>
                                    </form>
                                )}
                                {showDelete && (
                                    <form action={deleteAdvertiser.bind(null, row.id)}>
                                        <button type="submit" style={{ padding: "4px 10px", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                            Delete
                                        </button>
                                    </form>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr><td colSpan={6} style={{ color: "#9CA3AF", textAlign: "center", padding: 24 }}>No entries</td></tr>
                )}
            </tbody>
        </table>
    );
}
