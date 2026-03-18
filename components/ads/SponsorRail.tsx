"use client";

// Left rail — static sponsor cards (no rotation)
// Can be wired to real data; uses hardcoded fallbacks for now.

const SPONSORS = [
    { id: "s1", icon: "🚀", title: "FounderPath", desc: "The roadmap every founder needs", bg: "#F0F9FF", accent: "#0EA5E9" },
    { id: "s2", icon: "🏠", title: "LaunchHouse", desc: "Live and build with top founders", bg: "#F0FDF4", accent: "#22C55E" },
    { id: "s3", icon: "📈", title: "MRR Academy", desc: "Scale your SaaS to $100K MRR", bg: "#FFFBEB", accent: "#F59E0B" },
    { id: "s4", icon: "💳", title: "StripeApps", desc: "Apps that work natively with Stripe", bg: "#FDF4FF", accent: "#A855F7" },
    { id: "s5", icon: "💰", title: "Micro.vc", desc: "Pre-seed funding for bootstrappers", bg: "#FFF7ED", accent: "#F97316" },
];

export function SponsorRail() {
    return (
        <aside className="sponsor-rail">
            <div className="sponsor-rail-label">Sponsored</div>
            {SPONSORS.map((s) => (
                <div
                    key={s.id}
                    className="sponsor-card-static"
                    style={{ background: s.bg, borderTop: `3px solid ${s.accent}` }}
                >
                    <span className="sponsor-card-icon">{s.icon}</span>
                    <div className="sponsor-card-title">{s.title}</div>
                    <div className="sponsor-card-desc">{s.desc}</div>
                </div>
            ))}
        </aside>
    );
}
