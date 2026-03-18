import { createClient } from "@/lib/supabase/server";
import { Mail, ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import OfferConversation from "@/components/dashboard/OfferConversation";
import { cookies } from "next/headers";

export const metadata = { title: "Inbox — ProvenMRR" };

interface SearchParams {
    id?: string;
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const resolvedParams = await searchParams;
    const activeOfferId = resolvedParams.id;

    const cookieStore = await cookies();
    const role = (cookieStore.get("dashboard_role")?.value as "buyer" | "seller") || "seller";

    let query = supabase
        .from("offers")
        .select(`
            *,
            startup:startups!inner(id, name, owner_id, is_anonymous),
            buyer:users!offers_buyer_id_fkey(email, name),
            messages:offer_messages(
                id,
                content,
                sender_id,
                created_at
            )
        `);

    if (role === "seller") {
        query = query.eq("startup.owner_id", user.id);
    } else {
        query = query.eq("buyer_id", user.id);
    }

    const { data: offers } = await query.order("created_at", { ascending: false });

    const activeOffer = activeOfferId
        ? offers?.find(o => o.id === activeOfferId)
        : offers?.[0];

    const hasOffers = (offers?.length ?? 0) > 0;

    const isSeller = role === "seller";
    // Role accent colours
    const accentHex = isSeller ? "#6366F1" : "#10B981";
    const accentBg = isSeller ? "#EEF2FF" : "#ECFDF5";
    const accentText = isSeller ? "#4F46E5" : "#059669";

    return (
        <div
            style={{
                display: "flex",
                height: "calc(100vh - 120px)",
                background: "var(--color-surface)",
                borderRadius: 28,
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            {/* ─── Left Sidebar ─────────────────────────────────── */}
            <div
                style={{
                    width: 320,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "1px solid var(--color-border)",
                    background: "var(--glass-bg)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "24px 20px 16px",
                        borderBottom: "1px solid var(--color-border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--color-text)" }}>
                            Messages
                        </h2>
                        {/* Role pill */}
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: role === "seller" ? "#b9c8ff" : "#9df0c9",
                                background: role === "seller" ? "rgba(99, 102, 241, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                padding: "3px 10px",
                                borderRadius: 6,
                                border: `1px solid ${role === "seller" ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                            }}
                        >
                            {isSeller ? "Seller" : "Buyer"}
                        </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-secondary)", fontWeight: 500 }}>
                        {offers?.length || 0} {offers?.[0]?.status === 'cofounder' ? 'connection' : 'conversation'}{(offers?.length || 0) !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Conversation list */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {!hasOffers ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 200,
                                padding: 32,
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: "var(--color-surface)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Mail size={20} color="var(--color-muted)" strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>NO MESSAGES YET</p>
                        </div>
                    ) : (
                        offers?.map((offer) => {
                            const isActive = activeOffer?.id === offer.id;
                            const lastMsg = offer.messages?.at(-1);
                            const preview = lastMsg?.content || "No messages yet";
                            const timeLabel = timeAgo(lastMsg?.created_at || offer.created_at);
                            const startupInitial = offer.startup?.name?.charAt(0)?.toUpperCase() || "?";
                            const otherPartyName = isSeller
                                ? (offer.buyer?.name || offer.buyer?.email?.split("@")[0] || "Buyer")
                                : offer.startup?.name;

                            return (
                                <Link
                                    key={offer.id}
                                    href={`/dashboard/inbox?id=${offer.id}`}
                                    style={{ display: "block", textDecoration: "none" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: "16px 20px",
                                            background: isActive ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent",
                                            borderLeft: isActive ? `3px solid ${accentHex}` : "3px solid transparent",
                                            borderBottom: "1px solid var(--color-stroke-soft)",
                                            transition: "all 0.2s",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 14,
                                                background: isActive ? accentHex : "var(--color-surface-strong)",
                                                color: isActive ? "white" : "var(--color-text)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 16,
                                                fontWeight: 800,
                                                flexShrink: 0,
                                                transition: "background 0.15s, color 0.15s"
                                            }}
                                        >
                                            {startupInitial}
                                        </div>

                                        {/* Text */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                                <span
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        color: "var(--color-text)",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        maxWidth: "65%",
                                                        filter: (offer.startup?.is_anonymous && !isSeller) ? "blur(5px)" : "none"
                                                    }}
                                                >
                                                    {otherPartyName}
                                                </span>
                                                <span style={{ fontSize: 10, color: "var(--color-secondary)", fontWeight: 700, flexShrink: 0 }}>
                                                    {timeLabel}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 13,
                                                        color: "var(--color-secondary)",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        fontWeight: 500,
                                                        flex: 1,
                                                    }}
                                                >
                                                    {preview}
                                                </p>
                                                {offer.status !== 'cofounder' && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            color: "var(--color-text)",
                                                            background: isActive ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "color-mix(in srgb, var(--color-text) 4%, transparent)",
                                                            padding: "3px 8px",
                                                            borderRadius: 6,
                                                            border: "1px solid var(--color-border)",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        ${Number(offer.amount).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ─── Right Pane ───────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--glass-bg-strong)" }}>
                {activeOffer ? (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Conversation Header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "16px 24px",
                                background: "var(--color-surface)",
                                borderBottom: "1px solid var(--color-border)",
                                gap: 16,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                {/* Small square avatar */}
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 8,
                                        background: accentHex,
                                        color: "#FFFFFF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 16,
                                        fontWeight: 800,
                                        flexShrink: 0,
                                        filter: (activeOffer.startup?.is_anonymous && !isSeller) ? "blur(4px)" : "none"
                                    }}
                                >
                                    {activeOffer.startup?.name?.charAt(0)?.toUpperCase()}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: "var(--color-text)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            filter: (activeOffer.startup?.is_anonymous && !isSeller) ? "blur(6px)" : "none"
                                        }}
                                    >
                                        {activeOffer.startup?.name}
                                    </h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                                        {/* Role badge */}
                                        <span
                                            style={{
                                                fontSize: 8,
                                                fontWeight: 800,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                                color: role === "seller" ? "#b9c8ff" : "#9df0c9",
                                                background: role === "seller" ? "rgba(99, 102, 241, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                                border: `1px solid ${role === "seller" ? "rgba(99, 102, 241, 0.18)" : "rgba(16, 185, 129, 0.18)"}`,
                                            }}
                                        >
                                            {activeOffer.status === 'cofounder' 
                                                ? (isSeller ? "Founder view" : "Interested view")
                                                : (isSeller ? "Seller view" : "Buyer view")
                                            }
                                        </span>
                                        {activeOffer.status !== 'cofounder' && (
                                            <span style={{ fontSize: 12, color: "var(--color-secondary)", fontWeight: 500 }}>
                                                - Offer: <strong style={{ color: "var(--color-text)", fontWeight: 700 }}>${Number(activeOffer.amount).toLocaleString()}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* View Listing button */}
                            <Link
                                href={`/startup/${activeOffer.startup?.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{
                                    height: 32,
                                    padding: "0 12px",
                                    fontSize: 11,
                                    borderRadius: 8,
                                    fontWeight: 700
                                }}
                            >
                                <ExternalLink size={12} />
                                View Listing
                            </Link>
                        </div>

                        {/* Chat */}
                        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                            <OfferConversation
                                offerId={activeOffer.id}
                                currentUserId={user.id}
                                initialMessages={(activeOffer.messages || []) as any}
                                otherPartyName={
                                    activeOffer.startup.owner_id === user.id
                                        ? (activeOffer.buyer?.name || activeOffer.buyer?.email?.split("@")[0] || "Buyer")
                                        : "Founder"
                                }
                                accentColor={accentHex}
                            />
                        </div>
                    </div>
                ) : (
                    /* Empty state */
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 48,
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 96,
                                height: 96,
                                borderRadius: 32,
                                background: "var(--color-surface)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 24,
                                border: "1px solid var(--color-border)"
                            }}
                        >
                            <Mail size={32} color="var(--color-muted)" strokeWidth={1.5} />
                        </div>
                        <h3 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.5px" }}>
                            {hasOffers ? "Select a conversation" : "No messages yet"}
                        </h3>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--color-secondary)", fontWeight: 600, maxWidth: 260, lineHeight: 1.5 }}>
                            {hasOffers
                                ? "Choose a conversation from the list to view it"
                                : isSeller
                                    ? "Buyers will reach out when they're interested in your startup"
                                    : "Make an offer on a startup to start a conversation"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
