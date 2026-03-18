"use client";

import { useEffect, useRef, useState } from "react";
import { sendOfferMessage } from "@/app/actions/user";
import { Loader2, MessageSquare, Send } from "lucide-react";

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
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

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

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const sorted = [...initialMessages].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(sorted);
    }, [initialMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const optimistic: Message = {
            id: `optimistic-${Date.now()}`,
            content: newMessage.trim(),
            sender_id: currentUserId,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimistic]);
        const sent = newMessage;
        setNewMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        setIsSending(true);
        try {
            await sendOfferMessage(offerId, sent);
        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            setNewMessage(sent);
        } finally {
            setIsSending(false);
        }
    }

    function adjustTextarea(el: HTMLTextAreaElement) {
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }

    const dayGroups = groupByDay(messages);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-surface)" }}>
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "24px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    background:
                        "radial-gradient(circle at top left, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 18%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--color-positive) 7%, transparent), transparent 18%)",
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
                            opacity: 0.72,
                            textAlign: "center",
                            paddingBottom: 60,
                        }}
                    >
                        <MessageSquare size={40} strokeWidth={1} color="var(--color-muted)" style={{ marginBottom: 16, opacity: 0.45 }} />
                        <p style={{ fontSize: 13, color: "var(--color-muted)", fontWeight: 600, margin: 0 }}>
                            No messages yet.
                        </p>
                        <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "6px 0 0", fontWeight: 500 }}>
                            Start the conversation!
                        </p>
                    </div>
                ) : (
                    dayGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    margin: "20px 0 16px",
                                }}
                            >
                                <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: "var(--color-muted)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {group.label}
                                </span>
                                <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {group.messages.map((msg, messageIndex) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const prevMsg = group.messages[messageIndex - 1];
                                    const nextMsg = group.messages[messageIndex + 1];
                                    const isFirstInRun = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                    const isLastInRun = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                                    const br = 18;
                                    const tail = 4;
                                    const borderRadius = isMe
                                        ? `${br}px ${br}px ${isLastInRun ? tail : br}px ${br}px`
                                        : `${br}px ${br}px ${br}px ${isLastInRun ? tail : br}px`;

                                    return (
                                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                                            {!isMe && isFirstInRun && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: "var(--color-muted)",
                                                        marginBottom: 6,
                                                        marginLeft: 4,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.08em",
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
                                                              background: "var(--color-surface-strong)",
                                                              color: "var(--color-text)",
                                                              border: "1px solid var(--color-border)",
                                                              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                                                          }),
                                                }}
                                            >
                                                {msg.content}
                                            </div>

                                            {isLastInRun && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        color: "var(--color-muted)",
                                                        fontWeight: 700,
                                                        marginTop: 3,
                                                        marginLeft: isMe ? 0 : 4,
                                                        marginRight: isMe ? 4 : 0,
                                                    }}
                                                >
                                                    {isMounted ? formatTime(msg.created_at) : "..."}
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

            <div
                style={{
                    padding: "16px 20px 24px",
                    background: "transparent",
                    borderTop: "1px solid var(--color-border)",
                }}
            >
                <form
                    onSubmit={handleSendMessage}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "var(--color-surface-strong)",
                        borderRadius: 24,
                        padding: "10px 10px 10px 20px",
                        border: "1px solid var(--color-border)",
                        transition: "all 0.25s",
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = accentColor;
                        e.currentTarget.style.background = "var(--color-surface)";
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-border)";
                        e.currentTarget.style.background = "var(--color-surface-strong)";
                    }}
                >
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            adjustTextarea(e.target);
                        }}
                        placeholder="Message..."
                        rows={1}
                        style={{
                            flex: 1,
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            resize: "none",
                            fontSize: 15,
                            color: "var(--color-text)",
                            lineHeight: 1.5,
                            maxHeight: 140,
                            overflowY: "auto",
                            fontFamily: "inherit",
                            padding: "2px 0",
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void handleSendMessage(e);
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: newMessage.trim() ? accentColor : "color-mix(in srgb, var(--color-text) 6%, transparent)",
                            border: "none",
                            cursor: newMessage.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "background 0.2s, transform 0.1s",
                            boxShadow: newMessage.trim() ? `0 2px 8px ${accentColor}55` : "none",
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = "scale(0.93)";
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        {isSending ? (
                            <Loader2 size={16} color="#FFFFFF" className="animate-spin" />
                        ) : (
                            <Send size={16} color={newMessage.trim() ? "#FFFFFF" : "#B0B7C3"} strokeWidth={2.5} />
                        )}
                    </button>
                </form>

                <p
                    style={{
                        margin: "6px 0 0",
                        fontSize: 10,
                        color: "var(--color-muted)",
                        fontWeight: 700,
                        textAlign: "center",
                        letterSpacing: "0.05em",
                    }}
                >
                    Press Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
