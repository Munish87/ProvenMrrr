"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus, SlidersHorizontal, AlertCircle, Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FrictionlessAddWrapper } from "../startup/FrictionlessAddWrapper";
import { OfferModal } from "../startup/OfferModal";
import { CATEGORY_MAP } from "@/lib/categories";
import { StatusBadge } from "../startup/StatusBadge";
import type { StartupSaleStatus } from "@/lib/startup-sale-status";

type StartupBase = {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    category: string | null;
    country: string | null;
    website_url: string | null;
    is_listed_for_sale: boolean;
    is_verified: boolean;
    is_anonymous: boolean;
    created_at: string;
    slug?: string | null;
    asking_price?: number | null;
    sale_status?: StartupSaleStatus | null;
    monthly_revenue?: number | null;
    revenue_30d?: number | null;
    growth_rate?: number | null;
};

type SnapBase = {
    mrr: number;
    arr: number;
    growth_rate: number;
    all_time_revenue: number;
};

export type BrowseStartupNode = StartupBase & {
    snap: SnapBase | undefined;
    score: number | undefined;
};

const CATEGORIES = ["All", ...new Set(Object.values(CATEGORY_MAP))].sort();
const MULTIPLE_OPTIONS = ["Any", "2x", "3x", "4x", "5x", "10x"];

function FilterDropdown({
    label,
    value,
    options,
    onChange,
    formatOption,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (next: string) => void;
    formatOption?: (option: string) => string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        function updatePosition() {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuStyle({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }

        function handleClickOutside(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("click", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        if (open) {
            updatePosition();
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open]);

    return (
        <div ref={ref}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10, opacity: 0.7 }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <button
                    type="button"
                    ref={buttonRef}
                    onClick={() => setOpen((current) => !current)}
                    style={{
                        width: "100%",
                        padding: "0 16px",
                        height: 44,
                        borderRadius: 12,
                        border: "1px solid var(--field-input-border)",
                        background: "var(--field-input-bg)",
                        outline: "none",
                        color: "var(--color-text)",
                        cursor: "pointer",
                        fontWeight: 500,
                        boxShadow: "var(--field-input-shadow)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        textAlign: "left",
                    }}
                >
                    <span>{formatOption ? formatOption(value) : value}</span>
                    <ChevronDown size={16} color="var(--color-secondary)" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease" }} />
                </button>

                {open && menuStyle
                    ? createPortal(
                        <div
                            style={{
                                position: "fixed",
                                top: menuStyle.top,
                                left: menuStyle.left,
                                width: menuStyle.width,
                                maxHeight: 280,
                                overflowY: "auto",
                                borderRadius: 14,
                                border: "1px solid var(--field-input-border)",
                                background: "var(--color-surface-strong)",
                                boxShadow: "var(--shadow-card)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                padding: 6,
                                zIndex: 2000,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {options.map((option) => {
                                const active = option === value;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => {
                                            onChange(option);
                                            setOpen(false);
                                        }}
                                        style={{
                                            width: "100%",
                                            border: "none",
                                            borderRadius: 10,
                                            padding: "10px 12px",
                                            background: active ? "linear-gradient(135deg, #7da2ff 0%, #5b7cff 46%, #3e58d8 100%)" : "transparent",
                                            color: active ? "#fff" : "var(--color-text)",
                                            fontSize: 14,
                                            textAlign: "left",
                                            cursor: "pointer",
                                            opacity: active ? 1 : 0.9,
                                        }}
                                    >
                                        {formatOption ? formatOption(option) : option}
                                    </button>
                                );
                            })}
                        </div>,
                        document.body
                    )
                    : null}
            </div>
        </div>
    );
}

function fmtMoney(n: number) {
    if (n === undefined || n === null || isNaN(n)) return "—";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
    return `$${Math.round(n).toLocaleString()}`;
}

function fmtMultiple(price: number, mrr: number) {
    if (!mrr) return "-";
    return `${(price / (mrr * 12)).toFixed(1)}x`;
}

function getDeterministicAskingPrice(name: string, mrr: number) {
    if (!mrr) return 0;
    const priceMultiplier = 2.5 + ((name.charCodeAt(0) % 20) / 10);
    return Math.round(mrr * 12 * priceMultiplier);
}

function getDeterministicMultiple(name: string) {
    return 2.5 + ((name.charCodeAt(0) % 20) / 10);
}

function getDeterministicProfitMargin(name: string) {
    return 40 + (name.charCodeAt(name.length > 1 ? 1 : 0) % 50);
}

function getListedTimeLabel(createdAt: string) {
    const isThisWeek = new Date(createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const isThisMonth = new Date(createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (isThisWeek) return "This week";
    if (isThisMonth) return "This month";
    return "Any time";
}


export function BrowseFeed({
    initialStartups,
    totalCount,
    initialQuery = "",
    initialCategory = "All",
    initialCountry = "All",
    initialOnlyForSale = false,
    initialMinMrr = "",
    initialMaxMrr = "",
    initialMinGrowth = "",
    initialMaxGrowth = "",
    initialMinPrice = "",
    initialMaxPrice = "",
    initialMaxMultiple = "Any",
}: {
    initialStartups: BrowseStartupNode[],
    totalCount: number,
    initialQuery?: string,
    initialCategory?: string,
    initialCountry?: string,
    initialOnlyForSale?: boolean,
    initialMinMrr?: string,
    initialMaxMrr?: string,
    initialMinGrowth?: string,
    initialMaxGrowth?: string,
    initialMinPrice?: string,
    initialMaxPrice?: string,
    initialMaxMultiple?: string,
}) {
    const router = useRouter();
    const fieldShellStyle = {
        padding: "0 12px",
        height: 40,
        display: "flex",
        alignItems: "center",
        background: "var(--field-input-bg)",
        border: "1px solid var(--field-input-border)",
        borderRadius: "10px",
        boxShadow: "var(--field-input-shadow)",
    } as const;

    const fieldInputStyle = {
        width: "100%",
        background: "none",
        border: "none",
        fontSize: 13,
        outline: "none",
        color: "var(--color-text)",
    } as const;

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [category, setCategory] = useState(initialCategory);
    const [country, setCountry] = useState(initialCountry);
    const [onlyForSale, setOnlyForSale] = useState(initialOnlyForSale);

    const [offerStartupId, setOfferStartupId] = useState<string | null>(null);
    const [offerStartupName, setOfferStartupName] = useState<string | null>(null);

    const [minMrr, setMinMrr] = useState(initialMinMrr);
    const [maxMrr, setMaxMrr] = useState(initialMaxMrr);

    const [minGrowth, setMinGrowth] = useState(initialMinGrowth);
    const [maxGrowth, setMaxGrowth] = useState(initialMaxGrowth);

    const [minMargin, setMinMargin] = useState("");
    const [maxMargin, setMaxMargin] = useState("");

    const [minPrice, setMinPrice] = useState(initialMinPrice);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
    const [maxMultiple, setMaxMultiple] = useState(initialMaxMultiple);

    const [timeListed, setTimeListed] = useState("Any time");

    const [startups, setStartups] = useState<BrowseStartupNode[]>(initialStartups);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setStartups(initialStartups);
        setPage(1);
        setSearchQuery(initialQuery || "");
        setCategory(initialCategory || "All");
        setCountry(initialCountry || "All");
        setOnlyForSale(initialOnlyForSale ?? false);
        setMinMrr(initialMinMrr || "");
        setMaxMrr(initialMaxMrr || "");
        setMinGrowth(initialMinGrowth || "");
        setMaxGrowth(initialMaxGrowth || "");
        setMinPrice(initialMinPrice || "");
        setMaxPrice(initialMaxPrice || "");
        setMaxMultiple(initialMaxMultiple || "Any");
    }, [
        initialStartups, initialQuery, initialCategory, initialCountry, initialOnlyForSale,
        initialMinMrr, initialMaxMrr, initialMinGrowth, initialMaxGrowth,
        initialMinPrice, initialMaxPrice, initialMaxMultiple
    ]);

    // Filter logic is now on Server, so filteredStartups just uses the startups state
    const filteredStartups = startups;
    const displayedStartups = startups;

    const updateUrl = (params: Record<string, string | null>) => {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([key, val]) => {
            if (val === null || val === "" || val === "All" || val === "Any" || val === "Any time") {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, val);
            }
        });
        // Reset page when filters change
        url.searchParams.delete("page");
        router.replace(url.toString(), { scroll: false });
    };

    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        updateUrl({ q: val });
    };

    const handleCategoryChange = (val: string) => {
        setCategory(val);
        updateUrl({ category: val });
    };

    const handleOnlyForSaleChange = (val: boolean) => {
        setOnlyForSale(val);
        updateUrl({ filter: val ? "deals" : "all" });
    };

    const handleNumericFilterChange = (key: string, val: string, setter: (v: string) => void) => {
        setter(val);
        updateUrl({ [key]: val });
    };

    const handleLoadMore = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        
        try {
            const more = await import("@/app/actions/browse").then(m => m.fetchMoreStartups({
                page: nextPage,
                searchQuery,
                category,
                country,
                onlyForSale,
                minMrr,
                maxMrr,
                minPrice,
                maxPrice,
                sort: initialOnlyForSale ? undefined : "growth" // Simplified example
            }));
            
            if (more.length > 0) {
                setStartups(prev => [...prev, ...more]);
                setPage(nextPage);
            }
        } catch (e) {
            console.error("Failed to load more:", e);
        } finally {
            setLoadingMore(false);
        }
    };

    const hasActiveFilters = searchQuery !== "" || category !== "All" || country !== "All" || !onlyForSale || minMrr !== "" || maxMrr !== "" || minGrowth !== "" || maxGrowth !== "" || minMargin !== "" || maxMargin !== "" || timeListed !== "Any time" || minPrice !== "" || maxPrice !== "" || maxMultiple !== "Any";


    return (
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
            {/* Sidebar Filters */}
            <div style={{ width: 280, flexShrink: 0 }}>
                <div className="card" style={{ padding: "24px", position: "sticky", top: 100, display: "flex", flexDirection: "column", gap: 24 }}>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text)", marginBottom: 4 }}>
                        <SlidersHorizontal size={18} />
                        <span style={{ fontWeight: 600, fontSize: 16 }}>Filters</span>
                    </div>

                    {/* Text Search */}
                    <div style={{ display: "flex", alignItems: "center", padding: "0 12px", height: 44, background: "var(--field-input-bg)", border: "1px solid var(--field-input-border)", borderRadius: "12px", boxShadow: "var(--field-input-shadow)" }}>
                        <Search size={18} color="var(--color-secondary)" style={{ flexShrink: 0, opacity: 0.7 }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0 12px",
                                background: "none",
                                border: "none",
                                outline: "none",
                                fontSize: 14,
                                color: "var(--color-text)",
                            }}
                        />
                    </div>

                    {/* Only For Sale Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Only for sale</span>
                            <span style={{ fontSize: 11, color: "var(--color-secondary)", opacity: 0.7 }}>Marketplace view</span>
                        </div>
                        <button
                            onClick={() => handleOnlyForSaleChange(!onlyForSale)}
                            style={{
                                width: 44,
                                height: 24,
                                borderRadius: 12,
                                background: onlyForSale ? "#10b981" : "rgba(255,255,255,0.1)",
                                border: "none",
                                position: "relative",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <div style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#fff",
                                position: "absolute",
                                top: 3,
                                left: onlyForSale ? 23 : 3,
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                            }} />
                        </button>
                    </div>

                    <FilterDropdown
                        label="Category"
                        value={category}
                        options={CATEGORIES}
                        onChange={handleCategoryChange}
                    />

                    {/* Monthly Revenue */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10, opacity: 0.7 }}>MRR</label>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
                            <div style={fieldShellStyle}>
                                <span style={{ fontSize: 13, color: "var(--color-secondary)", marginRight: 4 }}>$</span>
                                <input type="number" placeholder="Min" value={minMrr} onChange={e => handleNumericFilterChange("minMrr", e.target.value, setMinMrr)} style={fieldInputStyle} />
                            </div>
                            <div style={fieldShellStyle}>
                                <span style={{ fontSize: 13, color: "var(--color-secondary)", marginRight: 4 }}>$</span>
                                <input type="number" placeholder="Max" value={maxMrr} onChange={e => handleNumericFilterChange("maxMrr", e.target.value, setMaxMrr)} style={fieldInputStyle} />
                            </div>
                        </div>
                    </div>

                    {/* Asking Price */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10, opacity: 0.7 }}>Asking Price</label>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
                            <div style={fieldShellStyle}>
                                <span style={{ fontSize: 13, color: "var(--color-secondary)", marginRight: 4 }}>$</span>
                                <input type="number" placeholder="Min" value={minPrice} onChange={e => handleNumericFilterChange("minPrice", e.target.value, setMinPrice)} style={fieldInputStyle} />
                            </div>
                            <div style={fieldShellStyle}>
                                <span style={{ fontSize: 13, color: "var(--color-secondary)", marginRight: 4 }}>$</span>
                                <input type="number" placeholder="Max" value={maxPrice} onChange={e => handleNumericFilterChange("maxPrice", e.target.value, setMaxPrice)} style={fieldInputStyle} />
                            </div>
                        </div>
                    </div>

                    <FilterDropdown
                        label="Max Multiple"
                        value={maxMultiple}
                        options={MULTIPLE_OPTIONS}
                        onChange={(val) => {
                            setMaxMultiple(val);
                            updateUrl({ maxMultiple: val });
                        }}
                    />

                    {/* Growth (30d) */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10, opacity: 0.7 }}>Growth (30d)</label>
                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12 }}>
                            <div style={fieldShellStyle}>
                                <input type="number" placeholder="Min" value={minGrowth} onChange={e => handleNumericFilterChange("minGrowth", e.target.value, setMinGrowth)} style={fieldInputStyle} />
                                <span style={{ fontSize: 13, color: "var(--color-secondary)", marginLeft: 4 }}>%</span>
                            </div>
                            <div style={fieldShellStyle}>
                                <input type="number" placeholder="Max" value={maxGrowth} onChange={e => handleNumericFilterChange("maxGrowth", e.target.value, setMaxGrowth)} style={fieldInputStyle} />
                                <span style={{ fontSize: 13, color: "var(--color-secondary)", marginLeft: 4 }}>%</span>
                            </div>
                        </div>
                    </div>


                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={() => {
                                handleSearchChange(""); handleCategoryChange("All"); handleOnlyForSaleChange(true); setMinMrr(""); setMaxMrr(""); setMinGrowth(""); setMaxGrowth("");
                                setMinMargin(""); setMaxMargin("");
                                setMinPrice(""); setMaxPrice(""); setMaxMultiple("Any");
                                setTimeListed("Any time");
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ width: "100%", justifyContent: "center", height: 40, fontSize: 13 }}
                        >
                            Reset all filters
                        </button>
                    )}
                </div>
            </div>

            {/* List Array Map */}
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <p style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 500 }}>
                        {startups.length === 0 ? "No startups found" : `Showing ${startups.length} of ${totalCount} startups`}
                    </p>
                    <FrictionlessAddWrapper className="btn btn-primary btn-sm" text="List your startup" />
                </div>

                {filteredStartups.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "80px 40px" }}>
                        <div style={{ background: "rgba(0,0,0,0.03)", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                            <Search size={32} color="var(--color-secondary)" style={{ opacity: 0.4 }} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>No results found</h3>
                        <p style={{ color: "var(--color-secondary)", margin: 0, fontSize: 15 }}>Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {displayedStartups.map((s) => {
                                const rawMrr = s.snap?.mrr ?? s.monthly_revenue;
                                const mrr = typeof rawMrr === "string" ? parseFloat(rawMrr) : (rawMrr || 0);

                                const rawArr = s.snap?.arr || s.snap?.all_time_revenue || 0;
                                const arr = typeof rawArr === "string" ? parseFloat(rawArr) : (rawArr || 0);

                                const rawGrowth = s.snap?.growth_rate ?? s.growth_rate;
                                const growth = typeof rawGrowth === "string" ? parseFloat(rawGrowth) : (rawGrowth || 0);

                                return (
                                    <Link key={s.id} href={`/startup/${s.slug || s.id}`} style={{ textDecoration: "none", display: "block" }}>
                                        <div className="card card-hover" style={{ padding: "24px", display: "flex", alignItems: "center", gap: 24, minHeight: 146, position: "relative", overflow: "hidden" }}>
                                            {/* Premium subtle gradient background for verified */}
                                            {s.is_verified && (
                                                <div style={{ position: "absolute", top: 0, right: 0, width: "30%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(125,162,255,0.03))", pointerEvents: "none" }} />
                                            )}

                                            {/* Logo */}
                                            <div style={{ width: 64, height: 64, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                                                {s.logo_url && !s.is_anonymous ? (
                                                    <img
                                                        src={s.logo_url}
                                                        alt={s.name}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: 28, fontWeight: 700, color: "var(--color-primary)" }}>{s.name.charAt(0)}</span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, overflow: "hidden" }}>
                                                    <p style={{ 
                                                        fontWeight: 700, 
                                                        fontSize: 18, 
                                                        color: "var(--color-text)", 
                                                        margin: 0, 
                                                        filter: s.is_anonymous ? "blur(5px)" : "none", 
                                                        letterSpacing: "-0.02em", 
                                                        overflow: "hidden", 
                                                        textOverflow: "ellipsis", 
                                                        whiteSpace: "nowrap" 
                                                    }}>{s.name}</p>
                                                    {s.is_listed_for_sale && <div style={{ flexShrink: 0 }}><StatusBadge status={s.sale_status ?? "sale"} /></div>}
                                                </div>
                                                <p style={{ fontSize: 14, color: "var(--color-secondary)", margin: 0, opacity: 0.8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                    {s.category && <span style={{ fontWeight: 600, color: "var(--color-text)", opacity: 0.7 }}>{s.category} · </span>}{s.description ?? "No description provided"}
                                                </p>

                                                {s.is_listed_for_sale && s.sale_status !== "sold" && (
                                                    <div style={{ marginTop: 14 }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setOfferStartupId(s.id);
                                                                setOfferStartupName(s.name);
                                                            }}
                                                            className="btn btn-primary btn-sm"
                                                            style={{
                                                                padding: "6px 16px",
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                borderRadius: "20px"
                                                            }}
                                                        >
                                                            Make an offer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Metrics - Enhanced Visibility */}
                                            <div style={{ display: "flex", gap: 32, flexShrink: 0, paddingLeft: 32, borderLeft: "1px solid var(--color-border)", minWidth: 220 }}>
                                                <div style={{ textAlign: "right", flex: 1 }}>
                                                    <p className="metric-label" style={{ marginBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-secondary)", textTransform: "uppercase" }}>MRR</p>
                                                    <p style={{ fontWeight: 800, fontSize: 18, color: "var(--color-text)", margin: 0 }}>{s.is_verified || mrr > 0 ? fmtMoney(mrr) : "—"}</p>
                                                    {growth > 0 && (
                                                        <p style={{ fontSize: 11, color: "#10b981", fontWeight: 600, margin: "2px 0 0" }}>+{parseFloat(growth as any).toFixed(1)}%</p>
                                                    )}
                                                </div>
                                                <div style={{ textAlign: "right", flex: 1 }}>
                                                    <p className="metric-label" style={{ marginBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-secondary)", textTransform: "uppercase" }}>ATR</p>
                                                    <p style={{ fontWeight: 800, fontSize: 18, color: "var(--color-text)", margin: 0 }}>{s.is_verified || (s.snap?.all_time_revenue ?? 0) > 0 ? fmtMoney(s.snap?.all_time_revenue || 0) : "—"}</p>
                                                    {s.asking_price && (arr || mrr) && (
                                                        <p style={{ fontSize: 11, color: "var(--color-secondary)", fontWeight: 500, margin: "2px 0 0" }}>{fmtMultiple(Number(s.asking_price), arr || (mrr * 12))} multiplier</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Load More Button */}
                        {startups.length < totalCount && (
                            <div style={{ display: "flex", justifyContent: "center", marginTop: 32, paddingBottom: 40 }}>
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="btn btn-secondary"
                                    style={{
                                        padding: "12px 32px",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        borderRadius: "12px",
                                        background: "var(--color-surface-strong)",
                                        border: "1px solid var(--color-border)",
                                        color: "var(--color-text)",
                                        cursor: loadingMore ? "default" : "pointer",
                                        transition: "all 0.2s ease",
                                        boxShadow: "var(--shadow-card)",
                                        opacity: loadingMore ? 0.6 : 1
                                    }}
                                >
                                    {loadingMore ? "Loading..." : `Load more startups (${totalCount - startups.length} remaining)`}
                                </button>
                            </div>
                        )}
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
