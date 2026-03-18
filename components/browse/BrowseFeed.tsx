"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, SlidersHorizontal, AlertCircle, Search } from "lucide-react";
import { FrictionlessAddWrapper } from "../startup/FrictionlessAddWrapper";
import { OfferModal } from "../startup/OfferModal";

type StartupBase = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    country: string | null;
    website_url: string | null;
    is_listed_for_sale: boolean;
    is_verified: boolean;
    is_anonymous: boolean;
    created_at: string;
};

type SnapBase = {
    mrr: number;
    growth_rate: number;
};

export type BrowseStartupNode = StartupBase & {
    snap: SnapBase | undefined;
    score: number | undefined;
};

const CATEGORIES = ["All", "SaaS", "AI", "Developer Tools", "E-commerce", "Fintech", "Other"];

function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString('en-US')}k`;
    return `$${n.toLocaleString('en-US')}`;
}

// Pseudo-random deterministic functions based on startup name hash
function getDeterministicAskingPrice(name: string, mrr: number) {
    if (!mrr) return 0;
    const priceMultiplier = 2.5 + ((name.charCodeAt(0) % 20) / 10);
    return Math.round(mrr * 12 * priceMultiplier);
}

function getDeterministicMultiple(name: string) {
    return 2.5 + ((name.charCodeAt(0) % 20) / 10);
}

function getDeterministicProfitMargin(name: string) {
    return 40 + (name.charCodeAt(name.length > 1 ? 1 : 0) % 50); // 40% to 90%
}

function getListedTimeLabel(createdAt: string) {
    const isThisWeek = new Date(createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isThisMonth = new Date(createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (isThisWeek) return "This week";
    if (isThisMonth) return "This month";
    return "Any time";
}


export function BrowseFeed({ initialStartups, initialQuery = "" }: { initialStartups: BrowseStartupNode[], initialQuery?: string }) {
    // Local State Filters
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [category, setCategory] = useState("All");

    // Offer Modal State
    const [offerStartupId, setOfferStartupId] = useState<string | null>(null);
    const [offerStartupName, setOfferStartupName] = useState<string | null>(null);

    const [minMrr, setMinMrr] = useState("");
    const [maxMrr, setMaxMrr] = useState("");

    const [minGrowth, setMinGrowth] = useState("");
    const [maxGrowth, setMaxGrowth] = useState("");

    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [maxMultiple, setMaxMultiple] = useState("Any");

    const [minMargin, setMinMargin] = useState("");
    const [maxMargin, setMaxMargin] = useState("");

    const [timeListed, setTimeListed] = useState("Any time");

    const hasActiveFilters = searchQuery !== "" || category !== "All" || minMrr !== "" || maxMrr !== "" || minGrowth !== "" || maxGrowth !== "" || minPrice !== "" || maxPrice !== "" || maxMultiple !== "Any" || minMargin !== "" || maxMargin !== "" || timeListed !== "Any time";

    // Memoized Sorting & Filtering execution
    const filteredStartups = useMemo(() => {
        return initialStartups.filter(s => {
            // Extracted values
            const mrr = s.snap?.mrr || 0;
            const growth = s.snap?.growth_rate || 0;
            const price = s.is_listed_for_sale ? getDeterministicAskingPrice(s.name, mrr) : 0;
            const multiple = s.is_listed_for_sale ? getDeterministicMultiple(s.name) : 0;
            const margin = getDeterministicProfitMargin(s.name);
            const listedLabel = getListedTimeLabel(s.created_at);

            // 1. Text Search (Name, Description, Category)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matched = s.name.toLowerCase().includes(q) ||
                    (s.description && s.description.toLowerCase().includes(q)) ||
                    (s.category && s.category.toLowerCase().includes(q));
                if (!matched) return false;
            }

            // 2. Category
            if (category !== "All" && s.category !== category) return false;

            // 2. Monthly Revenue (MRR)
            if (minMrr && mrr < Number(minMrr)) return false;
            if (maxMrr && mrr > Number(maxMrr)) return false;

            // 3. Growth (30d)
            if (minGrowth && growth < Number(minGrowth)) return false;
            if (maxGrowth && growth > Number(maxGrowth)) return false;

            // 4. Asking Price (Only applies if startup is for sale, or if the user forces a price query we filter out non-sale items implicitly)
            if (minPrice || maxPrice) {
                if (!s.is_listed_for_sale) return false;
                if (minPrice && price < Number(minPrice)) return false;
                if (maxPrice && price > Number(maxPrice)) return false;
            }

            // 5. Max Multiple
            if (maxMultiple !== "Any") {
                if (!s.is_listed_for_sale) return false;
                const limit = Number(maxMultiple.replace('x', ''));
                if (multiple > limit) return false;
            }

            // 6. Profit Margin
            if (minMargin && margin < Number(minMargin)) return false;
            if (maxMargin && margin > Number(maxMargin)) return false;

            // 7. Time Listed
            if (timeListed === "This week" && listedLabel !== "This week") return false;
            if (timeListed === "This month" && listedLabel !== "This week" && listedLabel !== "This month") return false;

            return true;
        });
    }, [initialStartups, searchQuery, category, minMrr, maxMrr, minGrowth, maxGrowth, minPrice, maxPrice, maxMultiple, minMargin, maxMargin, timeListed]);

    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        const url = new URL(window.location.href);
        if (val) {
            url.searchParams.set("q", val);
        } else {
            url.searchParams.delete("q");
        }
        window.history.replaceState({}, '', url.toString());
    };


    return (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* Sidebar Filters */}
            <div style={{ width: 240, flexShrink: 0 }}>
                <div className="card" style={{ padding: "20px 16px", position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Text Search */}
                    <div style={{ position: "relative" }}>
                        <Search size={16} color="var(--color-secondary)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="text"
                            placeholder="e.g. SaaS over $10K/mo"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px 10px 36px",
                                borderRadius: 10,
                                border: "1px solid var(--color-border)",
                                fontSize: 13,
                                outline: "none",
                                background: "var(--color-bg)",
                                color: "var(--color-text)",
                            }}
                        />
                    </div>

                    {/* Categories Dropdown representation */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: 8, letterSpacing: "0.2px" }}>Categories</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, background: "white", outline: "none", color: "var(--color-text)", appearance: "none", cursor: "pointer" }}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Monthly Revenue */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: 8, letterSpacing: "0.2px" }}>Monthly Revenue</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>$</span>
                                <input type="number" placeholder="Min" value={minMrr} onChange={e => setMinMrr(e.target.value)} style={{ width: "100%", padding: "8px 10px 8px 22px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                            </div>
                            <span style={{ color: "var(--color-secondary)", fontSize: 12 }}>-</span>
                            <div style={{ position: "relative", flex: 1 }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>$</span>
                                <input type="number" placeholder="Max" value={maxMrr} onChange={e => setMaxMrr(e.target.value)} style={{ width: "100%", padding: "8px 10px 8px 22px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                            </div>
                        </div>
                    </div>

                    {/* Growth (30d) */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: 8, letterSpacing: "0.2px" }}>Growth (30d)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <input type="number" placeholder="Min" value={minGrowth} onChange={e => setMinGrowth(e.target.value)} style={{ width: "100%", padding: "8px 24px 8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>%</span>
                            </div>
                            <span style={{ color: "var(--color-secondary)", fontSize: 12 }}>-</span>
                            <div style={{ position: "relative", flex: 1 }}>
                                <input type="number" placeholder="Max" value={maxGrowth} onChange={e => setMaxGrowth(e.target.value)} style={{ width: "100%", padding: "8px 24px 8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>%</span>
                            </div>
                        </div>
                    </div>

                    {/* Asking Price */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: 8, letterSpacing: "0.2px" }}>Asking Price</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>$</span>
                                <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ width: "100%", padding: "8px 10px 8px 22px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                            </div>
                            <span style={{ color: "var(--color-secondary)", fontSize: 12 }}>-</span>
                            <div style={{ position: "relative", flex: 1 }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>$</span>
                                <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ width: "100%", padding: "8px 10px 8px 22px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                            </div>
                        </div>
                    </div>

                    {/* Max Multiple */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: 8, letterSpacing: "0.2px" }}>Max Multiple</label>
                        <select
                            value={maxMultiple}
                            onChange={(e) => setMaxMultiple(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, background: "white", outline: "none", color: "var(--color-secondary)", appearance: "none", cursor: "pointer" }}
                        >
                            {["Any", "2x", "3x", "4x", "5x", "10x"].map(c => <option key={c} value={c}>{c === "Any" ? "Any multiple" : c}</option>)}
                        </select>
                    </div>

                    {/* Profit Margin */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, letterSpacing: "0.2px" }}>
                            Profit Margin <AlertCircle size={12} color="var(--color-secondary)" style={{ opacity: 0.6 }} />
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <input type="number" placeholder="Min" value={minMargin} onChange={e => setMinMargin(e.target.value)} style={{ width: "100%", padding: "8px 24px 8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>%</span>
                            </div>
                            <span style={{ color: "var(--color-secondary)", fontSize: 12 }}>-</span>
                            <div style={{ position: "relative", flex: 1 }}>
                                <input type="number" placeholder="Max" value={maxMargin} onChange={e => setMaxMargin(e.target.value)} style={{ width: "100%", padding: "8px 24px 8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, outline: "none" }} />
                                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-secondary)" }}>%</span>
                            </div>
                        </div>
                    </div>

                    {/* Listed */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", display: "block", marginBottom: 8, letterSpacing: "0.2px" }}>Listed</label>
                        <select
                            value={timeListed}
                            onChange={(e) => setTimeListed(e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, background: "white", outline: "none", color: "var(--color-secondary)", appearance: "none", cursor: "pointer" }}
                        >
                            {["Any time", "This month", "This week"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Clear Filters conditionally rendered */}
                    {hasActiveFilters && (
                        <div style={{ marginTop: 12 }}>
                            <button
                                onClick={() => {
                                    handleSearchChange(""); setCategory("All"); setMinMrr(""); setMaxMrr(""); setMinGrowth(""); setMaxGrowth("");
                                    setMinPrice(""); setMaxPrice(""); setMaxMultiple("Any"); setMinMargin(""); setMaxMargin("");
                                    setTimeListed("Any time");
                                }}
                                className="btn btn-secondary"
                                style={{ width: "100%", justifyContent: "center" }}
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* List Array Map */}
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 500 }}>
                        {filteredStartups.length === 0 ? "No startups found" : `Showing ${filteredStartups.length} startup${filteredStartups.length !== 1 ? 's' : ''}`}
                    </p>
                    <FrictionlessAddWrapper className="btn btn-primary btn-sm" text="Add yours" />
                </div>

                {filteredStartups.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "56px 24px" }}>
                        <p style={{ color: "var(--color-secondary)", margin: 0 }}>No startups match these filters.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filteredStartups.map((s) => {
                            return (
                                <Link key={s.id} href={`/startup/${s.id}`} style={{ textDecoration: "none", display: "block" }}>
                                    <div className="card card-hover" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                                        {/* Logo */}
                                        <div className="startup-card-logo" style={{ width: 44, height: 44, fontSize: 18, flexShrink: 0, filter: s.is_anonymous ? "blur(5px)" : "none" }}>
                                            {s.name.charAt(0)}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                <p style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)", margin: 0, filter: s.is_anonymous ? "blur(5px)" : "none" }}>{s.name}</p>
                                                {s.is_listed_for_sale && <span className="tag-forsale">For Sale</span>}
                                            </div>
                                            <p style={{ fontSize: 13, color: "var(--color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360, margin: 0 }}>
                                                {s.category && <><span style={{ fontWeight: 500 }}>{s.category}</span> · </>}{s.description ?? "No description"}
                                            </p>
                                            {s.is_listed_for_sale && (
                                                <div style={{ marginTop: 10 }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setOfferStartupId(s.id);
                                                            setOfferStartupName(s.name);
                                                        }}
                                                        style={{
                                                            background: "#10B981", color: "white", border: "none", padding: "6px 14px",
                                                            borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer"
                                                        }}
                                                    >
                                                        Make an offer
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Metrics */}
                                        <div style={{ display: "flex", gap: 32, flexShrink: 0 }}>
                                            <div style={{ textAlign: "right" }}>
                                                <p className="metric-label">MRR</p>
                                                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)" }}>{s.snap ? fmtMoney(s.snap.mrr) : "—"}</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p className="metric-label">Score</p>
                                                <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text)" }}>{s.score ?? "—"}</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p className="metric-label">Growth</p>
                                                <p className={s.snap && s.snap.growth_rate >= 0 ? "g-up" : "g-down"} style={{ fontSize: 15 }}>
                                                    {s.snap ? `${s.snap.growth_rate >= 0 ? "↑" : "↓"} ${Math.abs(s.snap.growth_rate).toFixed(1)}%` : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <OfferModal
                isOpen={!!offerStartupId}
                onClose={() => { setOfferStartupId(null); setOfferStartupName(null); }}
                startupId={offerStartupId || ""}
                startupName={offerStartupName || ""}
            />
        </div>
    );
}
