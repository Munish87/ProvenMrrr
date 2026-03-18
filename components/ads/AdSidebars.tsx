"use client";

import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";

// ─── Ad Data ─────────────────────────────────────────────────────────────────

export type AdItem = {
    id: string;
    name: string;
    description: string;
    icon: string;
    bg: string;
    accent: string;
};

export const AD_POOL: AdItem[] = [
    { id: "1", name: "Startup Directories", icon: "📁", description: "Get listed in top directories", bg: "#F0F9FF", accent: "#0EA5E9" },
    { id: "2", name: "FounderPath", icon: "🚀", description: "Roadmap every founder needs", bg: "#F0FDF4", accent: "#22C55E" },
    { id: "3", name: "LaunchHouse", icon: "🏠", description: "Live & build with top founders", bg: "#FFFBEB", accent: "#F59E0B" },
    { id: "4", name: "MRR Academy", icon: "📈", description: "Scale your SaaS to $100K MRR", bg: "#FDF4FF", accent: "#A855F7" },
    { id: "5", name: "StripeApps", icon: "💳", description: "Apps that work natively w/ Stripe", bg: "#FFF7ED", accent: "#F97316" },
    { id: "6", name: "Micro.vc", icon: "💰", description: "Pre-seed funding for bootstrappers", bg: "#FFF1F2", accent: "#F43F5E" },
    { id: "7", name: "Acquire.com", icon: "🛒", description: "Buy & sell profitable SaaS", bg: "#F5F3FF", accent: "#7C3AED" },
    { id: "8", name: "SaaSBoard", icon: "📊", description: "Track every SaaS metric", bg: "#ECFDF5", accent: "#10B981" },
    { id: "9", name: "Communities", icon: "💬", description: "Join communities of builders", bg: "#EFF6FF", accent: "#3B82F6" },
    { id: "10", name: "Design Assets", icon: "🎨", description: "UI kits, icons & design systems", bg: "#FEFCE8", accent: "#CA8A04" },
    { id: "11", name: "Hire Devs", icon: "👩‍💻", description: "Top remote engineering talent", bg: "#F0F9FF", accent: "#38BDF8" },
    { id: "12", name: "Legal Templates", icon: "⚖️", description: "Free contracts & legal docs", bg: "#F0FDF4", accent: "#4ADE80" },
    { id: "13", name: "Launch Checklist", icon: "✅", description: "Never miss a launch step again", bg: "#FFFBEB", accent: "#FBBF24" },
    { id: "14", name: "AI Tools", icon: "🤖", description: "Top AI tools for SaaS builders", bg: "#FDF4FF", accent: "#C026D3" },
    { id: "15", name: "Hosting Deals", icon: "☁️", description: "Deploy in 30 seconds, save more", bg: "#FFF7ED", accent: "#FB923C" },
    { id: "16", name: "Analytics Pro", icon: "📉", description: "Advanced startup analytics", bg: "#FFF1F2", accent: "#E11D48" },
    { id: "17", name: "SEO Boost", icon: "🔍", description: "Rank higher, grow organic", bg: "#F5F3FF", accent: "#8B5CF6" },
    { id: "18", name: "RevOps Hub", icon: "⚙️", description: "Ops tools for revenue teams", bg: "#ECFDF5", accent: "#059669" },
    { id: "19", name: "Founder Forum", icon: "🗣️", description: "Forum for SaaS founders", bg: "#EFF6FF", accent: "#2563EB" },
    { id: "20", name: "Cold Email Pro", icon: "📧", description: "Outbound that actually converts", bg: "#FEFCE8", accent: "#D97706" },
    { id: "21", name: "Product Hunt", icon: "🐱", description: "Launch to early adopters", bg: "#F0F9FF", accent: "#0369A1" },
    { id: "22", name: "Notion Templates", icon: "📝", description: "Startup OS for your whole team", bg: "#FDF4FF", accent: "#9333EA" },
];

function pickRandom9(exclude: string[]): AdItem[] {
    const pool = AD_POOL.filter((a) => !exclude.includes(a.id));
    const source = pool.length >= 9 ? pool : AD_POOL;
    return [...source].sort(() => Math.random() - 0.5).slice(0, 9);
}

// ─── Rotation Context ────────────────────────────────────────────────────────

type AdCtxValue = {
    displayedAds: AdItem[];   // [0-4] → left sidebar, [5-8] → right sidebar
    isFlipping: boolean;
    filledSlots: number;
};

const AdCtx = createContext<AdCtxValue>({
    displayedAds: AD_POOL.slice(0, 9),
    isFlipping: false,
    filledSlots: 0,
});

export function AdRotationProvider({
    children,
    filledSlots = 5,
}: {
    children: ReactNode;
    filledSlots?: number;
}) {
    const [displayedAds, setDisplayedAds] = useState<AdItem[]>(() => pickRandom9([]));
    const [isFlipping, setIsFlipping] = useState(false);
    const currentRef = useRef(displayedAds);

    useEffect(() => { currentRef.current = displayedAds; }, [displayedAds]);

    useEffect(() => {
        const timer = setInterval(() => {
            const next = pickRandom9(currentRef.current.map((a) => a.id));
            setIsFlipping(true);
            // swap content at the 180° mid-flip point
            setTimeout(() => setDisplayedAds(next), 350);
            setTimeout(() => setIsFlipping(false), 700);
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    return (
        <AdCtx.Provider value={{ displayedAds, isFlipping, filledSlots }}>
            {children}
        </AdCtx.Provider>
    );
}

// ─── Rotating Ad Card ────────────────────────────────────────────────────────

function AdCard({ ad, isFlipping }: { ad: AdItem; isFlipping: boolean }) {
    return (
        <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className={`ad-flip-card flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center no-underline w-full flex-shrink-0 cursor-pointer${isFlipping ? " flipping" : ""}`}
            style={{
                background: ad.bg,
                borderColor: `${ad.accent}30`,
                borderTopWidth: "3px",
                borderTopColor: ad.accent,
                minHeight: "100px",
            }}
        >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{ad.icon}</span>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#111827", lineHeight: 1.2 }}>{ad.name}</div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.3 }}>{ad.description}</div>
        </a>
    );
}

// ─── Booking Slot (static) ───────────────────────────────────────────────────

function BookingCard({ filledSlots }: { filledSlots: number }) {
    const [open, setOpen] = useState(false);
    const max = 20;
    const pct = Math.round((filledSlots / max) * 100);
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 p-3 text-center w-full flex-shrink-0 cursor-pointer bg-transparent hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                style={{ minHeight: "100px" }}
            >
                <span style={{ fontSize: 22, lineHeight: 1 }}>📣</span>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#111827" }}>Advertise</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{filledSlots}/{max} spots left</div>
                <div style={{ width: "70%", height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden", margin: "2px 0" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#6366F1", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1" }}>Book a slot →</span>
            </button>
            {open && <AdvertiserModal filledSlots={filledSlots} onClose={() => setOpen(false)} />}
        </>
    );
}

// ─── Advertiser Modal ────────────────────────────────────────────────────────

function AdvertiserModal({ filledSlots, onClose }: { filledSlots: number; onClose: () => void }) {
    const [form, setForm] = useState({ company_name: "", website_url: "", logo_url: "", title: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/advertisers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (res.ok) setSuccess(true);
            else alert((await res.json()).error ?? "Something went wrong.");
        } catch { alert("Network error."); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {success ? (
                    <div style={{ textAlign: "center", padding: "40px 24px" }}>
                        <span style={{ fontSize: 48 }}>🎉</span>
                        <h2 className="modal-title" style={{ margin: "16px 0 8px" }}>Submission received!</h2>
                        <p style={{ color: "#6B7280", fontSize: 14 }}>Your ad will go live after review.</p>
                        <button className="modal-btn-primary" onClick={onClose} style={{ marginTop: 24 }}>Close</button>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <h2 className="modal-title">Advertise on ProvenMRR</h2>
                            <p className="modal-subtitle">{20 - filledSlots} slots available · from $99/week</p>
                            <button className="modal-close" onClick={onClose}>✕</button>
                        </div>
                        <form onSubmit={submit} className="modal-form">
                            <label className="modal-label">Company name<input className="modal-input" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></label>
                            <label className="modal-label">Website URL<input className="modal-input" type="url" required placeholder="https://" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></label>
                            <label className="modal-label">Logo URL (optional)<input className="modal-input" placeholder="https://..." value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></label>
                            <label className="modal-label">Ad title<input className="modal-input" required maxLength={60} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                            <label className="modal-label">Ad description<textarea className="modal-input modal-textarea" required maxLength={120} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
                            <button type="submit" className="modal-btn-primary" disabled={submitting}>
                                {submitting ? "Submitting…" : "Submit & Continue to Payment →"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Left Sidebar — fixed, full height ───────────────────────────────────────

export function LeftSidebar() {
    const { displayedAds, isFlipping } = useContext(AdCtx);
    return (
        <aside className="ad-sidebar-left">
            {displayedAds.slice(0, 5).map((ad, i) => (
                <AdCard key={`l${i}`} ad={ad} isFlipping={isFlipping} />
            ))}
        </aside>
    );
}

// ─── Right Sidebar — fixed, full height ─────────────────────────────────────

export function RightSidebar() {
    const { displayedAds, isFlipping, filledSlots } = useContext(AdCtx);
    return (
        <aside className="ad-sidebar-right">
            {displayedAds.slice(5, 9).map((ad, i) => (
                <AdCard key={`r${i}`} ad={ad} isFlipping={isFlipping} />
            ))}
            <BookingCard filledSlots={filledSlots} />
        </aside>
    );
}

// ─── Mobile Banner — 3 cards horizontally above content ─────────────────────

export function MobileAdBanner() {
    const { displayedAds, isFlipping } = useContext(AdCtx);
    return (
        <div className="mobile-ad-banner-wrap">
            {displayedAds.slice(0, 3).map((ad, i) => (
                <a
                    key={`m${i}`}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className={`ad-flip-card${isFlipping ? " flipping" : ""}`}
                    style={{ flex: 1, minWidth: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 12, padding: "10px 8px", textAlign: "center", textDecoration: "none", cursor: "pointer", background: ad.bg, borderTop: `3px solid ${ad.accent}`, border: `1px solid ${ad.accent}30` }}
                >
                    <span style={{ fontSize: 18 }}>{ad.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#111827" }}>{ad.name}</div>
                </a>
            ))}
        </div>
    );
}
