import { createClient } from "@/lib/supabase/server";
import { Mail, ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import OfferConversation from "@/components/dashboard/OfferConversation";
import { cookies } from "next/headers";

export const metadata = { title: "Inbox — Vetra" };

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
            startup:startups!inner(id, name, owner_id),
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
                height: "calc(100vh - 80px)",
                background: "#F8F9FB",
                borderRadius: 24,
                overflow: "hidden",
                border: "1px solid #EAECF0",
                boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
            }}
        >
            {/* ─── Left Sidebar ─────────────────────────────────── */}
            <div
                style={{
                    width: 320,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "1px solid #EAECF0",
                    background: "#FFFFFF",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "24px 20px 16px 20px",
                        borderBottom: "1px solid #F2F4F7",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#0F1117" }}>
                            Messages
                        </h2>
                        {/* Role pill */}
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: accentText,
                                background: accentBg,
                                padding: "4px 10px",
                                borderRadius: 999,
                                border: `1px solid ${accentHex}22`,
                            }}
                        >
                            {isSeller ? "Seller" : "Buyer"}
                        </span>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9EA3AE", fontWeight: 500 }}>
                        {offers?.length || 0} conversation{(offers?.length || 0) !== 1 ? "s" : ""}
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
                                    background: "#F2F4F7",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Mail size={20} color="#C5C8D0" strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: 13, color: "#9EA3AE", fontWeight: 600, margin: 0 }}>No conversations yet</p>
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
                                            padding: "14px 20px",
                                            background: isActive ? accentBg : "transparent",
                                            borderLeft: isActive ? `3px solid ${accentHex}` : "3px solid transparent",
                                            borderBottom: "1px solid #F2F4F7",
                                            transition: "background 0.15s",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 14,
                                                background: isActive ? accentHex : "#F2F4F7",
                                                color: isActive ? "#FFFFFF" : "#6B7280",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 16,
                                                fontWeight: 800,
                                                flexShrink: 0,
                                                transition: "background 0.15s, color 0.15s",
                                            }}
                                        >
                                            {startupInitial}
                                        </div>

                                        {/* Text */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: isActive ? accentText : "#0F1117",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        maxWidth: "65%",
                                                    }}
                                                >
                                                    {otherPartyName}
                                                </span>
                                                <span style={{ fontSize: 10, color: "#B0B7C3", fontWeight: 600, flexShrink: 0 }}>
                                                    {timeLabel}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 12,
                                                        color: "#9EA3AE",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        fontWeight: 500,
                                                        flex: 1,
                                                    }}
                                                >
                                                    {preview}
                                                </p>
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: accentText,
                                                        background: accentBg,
                                                        padding: "2px 7px",
                                                        borderRadius: 999,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    ${Number(offer.amount).toLocaleString()}
                                                </span>
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#FAFBFC" }}>
                {activeOffer ? (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Conversation Header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "16px 24px",
                                background: "#FFFFFF",
                                borderBottom: "1px solid #EAECF0",
                                gap: 16,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                                {/* Large avatar */}
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 16,
                                        background: accentHex,
                                        color: "#FFFFFF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 20,
                                        fontWeight: 800,
                                        flexShrink: 0,
                                        boxShadow: `0 4px 14px ${accentHex}44`,
                                    }}
                                >
                                    {activeOffer.startup?.name?.charAt(0)?.toUpperCase()}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: "#0F1117",
                                            letterSpacing: "-0.3px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {activeOffer.startup?.name}
                                    </h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                        {/* Role badge */}
                                        <span
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 800,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.08em",
                                                color: accentText,
                                                background: accentBg,
                                                padding: "3px 8px",
                                                borderRadius: 999,
                                                border: `1px solid ${accentHex}22`,
                                            }}
                                        >
                                            {isSeller ? "Seller view" : "Buyer view"}
                                        </span>
                                        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#D1D5DB", flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
                                            Offer: <strong style={{ color: "#0F1117" }}>${Number(activeOffer.amount).toLocaleString()}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* View Listing button */}
                            <Link
                                href={`/startup/${activeOffer.startup?.id}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "8px 16px",
                                    background: "#F2F4F7",
                                    color: "#374151",
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    flexShrink: 0,
                                    transition: "background 0.15s",
                                    border: "1px solid #EAECF0",
                                }}
                            >
                                <ExternalLink size={13} strokeWidth={2.5} />
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
                                width: 80,
                                height: 80,
                                borderRadius: 24,
                                background: "#F2F4F7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 20,
                            }}
                        >
                            <Mail size={32} color="#D1D5DB" strokeWidth={1.5} />
                        </div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0F1117", letterSpacing: "-0.3px" }}>
                            {hasOffers ? "Select a conversation" : "No messages yet"}
                        </h3>
                        <p style={{ margin: 0, fontSize: 13, color: "#9EA3AE", fontWeight: 500, maxWidth: 220 }}>
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
