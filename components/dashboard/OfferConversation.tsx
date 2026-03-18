"use client";

import { useState, useEffect, useRef } from "react";
import { sendOfferMessage } from "@/app/actions/user";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

interface OfferConversationProps {
    offerId: string;
    currentUserId: string;
    initialMessages: Message[];
    otherPartyName: string;
    accentColor?: string;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

/** Group messages by calendar day */
function groupByDay(messages: Message[]) {
    const groups: { label: string; messages: Message[] }[] = [];
    let currentDay = "";
    for (const msg of messages) {
        const day = new Date(msg.created_at).toDateString();
        if (day !== currentDay) {
            groups.push({ label: formatDateLabel(msg.created_at), messages: [] });
            currentDay = day;
        }
        groups[groups.length - 1].messages.push(msg);
    }
    return groups;
}

export default function OfferConversation({
    offerId,
    currentUserId,
    initialMessages,
    otherPartyName,
    accentColor = "#6366F1",
}: OfferConversationProps) {
    const [messages, setMessages] = useState<Message[]>(
        [...initialMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    );
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        const sorted = [...initialMessages].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted);
    }, [initialMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        // Optimistic update
        const optimistic: Message = {
            id: `optimistic-${Date.now()}`,
            content: newMessage.trim(),
            sender_id: currentUserId,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        const sent = newMessage;
        setNewMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        setIsSending(true);
        try {
            await sendOfferMessage(offerId, sent);
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setNewMessage(sent);
        } finally {
            setIsSending(false);
        }
    };

    const adjustTextarea = (el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
    };

    const dayGroups = groupByDay(messages);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F8F9FB" }}>
            {/* ── Messages ── */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "24px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                }}
            >
                {messages.length === 0 ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            opacity: 0.4,
                            textAlign: "center",
                            paddingBottom: 60,
                        }}
                    >
                        <MessageSquare size={40} strokeWidth={1} color="#94A3B8" style={{ marginBottom: 12 }} />
                        <p style={{ fontSize: 13, color: "#64748B", fontWeight: 600, margin: 0 }}>
                            No messages yet.
                        </p>
                        <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0", fontWeight: 500 }}>
                            Start the conversation!
                        </p>
                    </div>
                ) : (
                    dayGroups.map((group, gi) => (
                        <div key={gi}>
                            {/* Day divider */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    margin: "20px 0 16px",
                                }}
                            >
                                <div style={{ flex: 1, height: 1, background: "#EAECF0" }} />
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#9EA3AE",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {group.label}
                                </span>
                                <div style={{ flex: 1, height: 1, background: "#EAECF0" }} />
                            </div>

                            {/* Messages in this day */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {group.messages.map((msg, mi) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const prevMsg = group.messages[mi - 1];
                                    const nextMsg = group.messages[mi + 1];
                                    const isFirstInRun = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                    const isLastInRun = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                                    // Bubble border radii: iOS tail on last bubble in run
                                    const br = 18;
                                    const tail = 4;
                                    const borderRadius = isMe
                                        ? `${br}px ${isFirstInRun ? br : br}px ${isLastInRun ? tail : br}px ${br}px`
                                        : `${isFirstInRun ? br : br}px ${br}px ${br}px ${isLastInRun ? tail : br}px`;

                                    return (
                                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                                            {/* Sender label on first bubble in run (other party only) */}
                                            {!isMe && isFirstInRun && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: "#9EA3AE",
                                                        marginBottom: 4,
                                                        marginLeft: 4,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                    }}
                                                >
                                                    {otherPartyName}
                                                </span>
                                            )}

                                            <div
                                                style={{
                                                    maxWidth: "68%",
                                                    padding: "10px 14px",
                                                    borderRadius,
                                                    fontSize: 14,
                                                    lineHeight: 1.55,
                                                    whiteSpace: "pre-wrap",
                                                    wordBreak: "break-word",
                                                    ...(isMe
                                                        ? {
                                                            background: accentColor,
                                                            color: "#FFFFFF",
                                                            boxShadow: `0 2px 12px ${accentColor}44`,
                                                        }
                                                        : {
                                                            background: "#FFFFFF",
                                                            color: "#0F1117",
                                                            border: "1px solid #EAECF0",
                                                            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                                        }),
                                                }}
                                            >
                                                {msg.content}
                                            </div>

                                            {/* Timestamp after last bubble in run */}
                                            {isLastInRun && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: "#B0B7C3",
                                                        fontWeight: 600,
                                                        marginTop: 3,
                                                        marginLeft: isMe ? 0 : 4,
                                                        marginRight: isMe ? 4 : 0,
                                                    }}
                                                >
                                                    {isMounted ? formatTime(msg.created_at) : "···"}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ── */}
            <div
                style={{
                    padding: "12px 20px 16px",
                    background: "#FFFFFF",
                    borderTop: "1px solid #EAECF0",
                }}
            >
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#F2F4F7",
                        borderRadius: 20,
                        padding: "8px 8px 8px 16px",
                        border: "1px solid #EAECF0",
                        transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = accentColor + "66")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#EAECF0")}
                >
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            adjustTextarea(e.target);
                        }}
                        placeholder="Message…"
                        rows={1}
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            fontSize: 14,
                            color: "#0F1117",
                            lineHeight: 1.5,
                            maxHeight: 140,
                            overflowY: "auto",
                            fontFamily: "inherit",
                            padding: "2px 0",
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: newMessage.trim() ? accentColor : "#E2E8F0",
                            border: "none",
                            cursor: newMessage.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "background 0.2s, transform 0.1s",
                            boxShadow: newMessage.trim() ? `0 2px 8px ${accentColor}55` : "none",
                        }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.93)"; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                    >
                        {isSending ? (
                            <Loader2 size={16} color="#FFFFFF" className="animate-spin" />
                        ) : (
                            <Send size={16} color={newMessage.trim() ? "#FFFFFF" : "#B0B7C3"} strokeWidth={2.5} />
                        )}
                    </button>
                </form>

                {/* Hint */}
                <p
                    style={{
                        margin: "6px 0 0",
                        fontSize: 10,
                        color: "#C5C8D0",
                        fontWeight: 500,
                        textAlign: "center",
                        letterSpacing: "0.02em",
                    }}
                >
                    Press Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
