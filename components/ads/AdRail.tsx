"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Advertiser = {
    id: string;
    company_name: string;
    logo_url: string | null;
    title: string;
    description: string | null;
    website_url: string;
    status: string;
};

// ─── Fallback pool for when there are fewer than 9 real advertisers ─────────

const FALLBACK_ADS: Advertiser[] = [
    { id: "f1", company_name: "Startup Directories", logo_url: null, title: "Submit Your Startup", description: "Get listed in top directories.", website_url: "#", status: "active" },
    { id: "f2", company_name: "Tools for Founders", logo_url: null, title: "Best Software Picks", description: "Curated tools for builders.", website_url: "#", status: "active" },
    { id: "f3", company_name: "Communities", logo_url: null, title: "Join Other Builders", description: "Connect with founders.", website_url: "#", status: "active" },
    { id: "f4", company_name: "Sponsor Partners", logo_url: null, title: "Discounts & Deals", description: "Exclusive partner offers.", website_url: "#", status: "active" },
    { id: "f5", company_name: "Finance Tools", logo_url: null, title: "Manage Cash Flow", description: "Track your runway.", website_url: "#", status: "active" },
    { id: "f6", company_name: "Design Assets", logo_url: null, title: "UI Kits & Icons", description: "Ship beautiful products.", website_url: "#", status: "active" },
    { id: "f7", company_name: "Hire Developers", logo_url: null, title: "Remote Engineers", description: "Top talent, fast.", website_url: "#", status: "active" },
    { id: "f8", company_name: "Legal Templates", logo_url: null, title: "Free Legal Docs", description: "Contracts & agreements.", website_url: "#", status: "active" },
    { id: "f9", company_name: "Launch Checklist", logo_url: null, title: "Ship Confidently", description: "Never miss a step.", website_url: "#", status: "active" },
];

const ICONS: Record<string, string> = {
    "Startup Directories": "📁", "Tools for Founders": "🛠️", "Communities": "💬",
    "Sponsor Partners": "🤝", "Finance Tools": "📊", "Design Assets": "🎨",
    "Hire Developers": "👩‍💻", "Legal Templates": "⚖️", "Launch Checklist": "✅",
    "FounderPath": "🚀", "LaunchHouse": "🏠", "MRR Academy": "📈",
    "StripeApps": "💳", "Micro.vc": "💰", "Acquire.com": "🛒",
    "SaaSBoard": "📊",
};

const PASTEL_COLORS = [
    { bg: "#F0F9FF", accent: "#0EA5E9" },
    { bg: "#F0FDF4", accent: "#22C55E" },
    { bg: "#FDF4FF", accent: "#A855F7" },
    { bg: "#FFFBEB", accent: "#F59E0B" },
    { bg: "#FFF7ED", accent: "#F97316" },
    { bg: "#FFF1F2", accent: "#F43F5E" },
    { bg: "#F5F3FF", accent: "#7C3AED" },
    { bg: "#ECFDF5", accent: "#10B981" },
    { bg: "#EFF6FF", accent: "#3B82F6" },
    { bg: "#FEFCE8", accent: "#CA8A04" },
];

function getColor(index: number) {
    return PASTEL_COLORS[index % PASTEL_COLORS.length];
}

function getIcon(name: string): string {
    return ICONS[name] ?? "📢";
}

// ─── Single Rotating Ad Card (3D flip) ───────────────────────────────────────

function AdCard({ pool, index }: { pool: Advertiser[]; index: number }) {
    const [front, setFront] = useState<Advertiser>(pool[index % pool.length]);
    const [back, setBack] = useState<Advertiser>(pool[(index + 5) % pool.length]);
    const [showBack, setShowBack] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const delay = 3000 + index * 1200; // stagger

        const schedule = (ms: number) => {
            timerRef.current = setTimeout(() => {
                // load a random ad onto the hidden face
                const currentId = showBack ? back.id : front.id;
                const candidates = pool.filter(a => a.id !== currentId);
                const next = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

                if (showBack) setFront(next);
                else setBack(next);

                setShowBack(prev => !prev);
                schedule(8000 + Math.random() * 4000); // 8–12s
            }, ms);
        };

        schedule(delay);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const renderFace = (ad: Advertiser, isFront: boolean, colorIdx: number) => {
        const { bg, accent } = getColor(colorIdx);
        const icon = getIcon(ad.company_name);
        return (
            <a
                href={ad.website_url !== "#" ? ad.website_url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="ad-card-face"
                style={{
                    transform: isFront ? "rotateY(0deg)" : "rotateY(180deg)",
                    background: bg,
                    borderTop: `3px solid ${accent}`,
                }}
            >
                <span className="ad-card-icon">{icon}</span>
                <div className="ad-card-title">{ad.title}</div>
                <div className="ad-card-desc">{ad.description ?? ad.company_name}</div>
            </a>
        );
    };

    return (
        <div className="ad-card-container">
            <div
                className="ad-card-inner"
                style={{ transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
                {renderFace(front, true, index)}
                {renderFace(back, false, index + 5)}
            </div>
        </div>
    );
}

// ─── Booking Slot (fixed - never rotates) ────────────────────────────────────

function BookingSlot({ filledSlots }: { filledSlots: number }) {
    const [modalOpen, setModalOpen] = useState(false);
    const maxSlots = 9;
    const left = Math.max(0, maxSlots - filledSlots);
    const isFull = left === 0;

    return (
        <>
            <div className="booking-slot" onClick={() => !isFull && setModalOpen(true)}>
                <span className="booking-slot-icon">📣</span>
                <span className="booking-slot-title">
                    {isFull ? "Slots full" : "Advertise here"}
                </span>
                <span className="booking-slot-counter">
                    {filledSlots} / {maxSlots} slots {isFull ? "filled" : "left"}
                </span>
            </div>

            {modalOpen && (
                <AdvertiserSignupModal
                    filledSlots={filledSlots}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </>
    );
}

// ─── Advertiser Signup Modal ────────────────────────────────────────────────

function AdvertiserSignupModal({
    filledSlots,
    onClose,
}: {
    filledSlots: number;
    onClose: () => void;
}) {
    const [form, setForm] = useState({
        company_name: "",
        website_url: "",
        logo_url: "",
        title: "",
        description: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/advertisers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                alert(data.error ?? "Something went wrong.");
            }
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {success ? (
                    <div style={{ textAlign: "center", padding: "40px 24px" }}>
                        <span style={{ fontSize: 48 }}>🎉</span>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "16px 0 8px", color: "#111827" }}>
                            Submission received!
                        </h2>
                        <p style={{ color: "#6B7280", fontSize: 14 }}>
                            Your ad will go live after review. We&apos;ll notify you by email.
                        </p>
                        <button className="modal-btn-primary" onClick={onClose} style={{ marginTop: 24 }}>
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <h2 className="modal-title">Advertise on Vetra</h2>
                            <p className="modal-subtitle">
                                {9 - filledSlots} slot{9 - filledSlots !== 1 ? "s" : ""} available
                            </p>
                            <button className="modal-close" onClick={onClose}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <label className="modal-label">
                                Company name
                                <input
                                    className="modal-input"
                                    required
                                    value={form.company_name}
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                />
                            </label>

                            <label className="modal-label">
                                Website URL
                                <input
                                    className="modal-input"
                                    type="url"
                                    required
                                    placeholder="https://"
                                    value={form.website_url}
                                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                                />
                            </label>

                            <label className="modal-label">
                                Logo URL (optional)
                                <input
                                    className="modal-input"
                                    placeholder="https://example.com/logo.png"
                                    value={form.logo_url}
                                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                                />
                            </label>

                            <label className="modal-label">
                                Ad title
                                <input
                                    className="modal-input"
                                    required
                                    maxLength={60}
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </label>

                            <label className="modal-label">
                                Ad description
                                <textarea
                                    className="modal-input modal-textarea"
                                    required
                                    maxLength={120}
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </label>

                            <button
                                type="submit"
                                className="modal-btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Submitting…" : "Submit & Continue to Payment →"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Ad Rail (main export) ──────────────────────────────────────────────────

const AD_SLOTS = 9;

export function AdRail({ advertisers }: { advertisers: Advertiser[] }) {
    // Build the pool: real advertisers first, then fill with fallbacks
    const pool: Advertiser[] = [
        ...advertisers.filter(a => a.status === "active"),
    ];
    // Pad with fallbacks if fewer than 9 real advertisers
    let fi = 0;
    while (pool.length < AD_SLOTS && fi < FALLBACK_ADS.length) {
        pool.push(FALLBACK_ADS[fi++]);
    }

    const filledSlots = advertisers.filter(a => a.status === "active").length;

    return (
        <aside className="ad-rail">
            <div className="ad-rail-label">Sponsored</div>
            {Array.from({ length: AD_SLOTS }).map((_, i) => (
                <AdCard key={i} pool={pool} index={i} />
            ))}
            <BookingSlot filledSlots={filledSlots} />
        </aside>
    );
}
