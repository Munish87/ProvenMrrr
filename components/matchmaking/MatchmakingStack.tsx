"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SwipeCard } from "./SwipeCard";
import { X, Heart, RotateCcw } from "lucide-react";

interface MatchmakingStackProps {
    matches: any[];
    onSwipe: (startupId: string, direction: "interested" | "skipped") => void;
}

export function MatchmakingStack({ matches, onSwipe }: MatchmakingStackProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [exitDirection, setExitDirection] = useState<"right" | "left" | null>(null);

    const activeIndex = currentIndex;
    const currentMatch = matches[activeIndex];

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const touch = "touches" in e ? e.touches[0] : e;
        setDragStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const touch = "touches" in e ? e.touches[0] : e;
        const offsetX = touch.clientX - dragStart.x;
        const offsetY = touch.clientY - dragStart.y;
        setDragOffset({ x: offsetX, y: offsetY });
    }, [isDragging, dragStart]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 120;
        if (dragOffset.x > threshold) {
            handleComplete("right");
        } else if (dragOffset.x < -threshold) {
            handleComplete("left");
        } else {
            setDragOffset({ x: 0, y: 0 });
        }
    }, [isDragging, dragOffset, currentMatch]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleDragMove);
            window.addEventListener("mouseup", handleDragEnd);
            window.addEventListener("touchmove", handleDragMove);
            window.addEventListener("touchend", handleDragEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
            window.removeEventListener("touchmove", handleDragMove);
            window.removeEventListener("touchend", handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    const handleComplete = (direction: "right" | "left") => {
        setExitDirection(direction);
        const swipeType = direction === "right" ? "interested" : "skipped";
        
        setTimeout(() => {
            if (currentMatch) {
                onSwipe(currentMatch.startup.id, swipeType);
            }
            setCurrentIndex(prev => prev + 1);
            setDragOffset({ x: 0, y: 0 });
            setExitDirection(null);
        }, 300);
    };

    if (currentIndex >= matches.length) {
        return (
            <div className="card" style={{ 
                height: 620, width: "100%", maxWidth: 420, 
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: 40
            }}>
                <div style={{ 
                    width: 80, height: 80, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, 
                    background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" 
                }}>
                    <RotateCcw size={32} color="var(--color-secondary)" style={{ opacity: 0.6 }} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", marginBottom: 12 }}>All caught up!</h3>
                <p style={{ color: "var(--color-secondary)", fontSize: 16, marginBottom: 32, fontWeight: 500, lineHeight: 1.6 }}>
                    You&apos;ve seen all startups matching your preferences. Check back later for new opportunities.
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                    style={{ padding: "12px 32px" }}
                >
                    Refresh Stack
                </button>
            </div>
        );
    }

    const rotation = dragOffset.x / 10;
    const opacityRight = Math.min(dragOffset.x / 120, 1);
    const opacityLeft = Math.min(-dragOffset.x / 120, 1);

    return (
        <div style={{ position: "relative", width: "100%", maxWidth: 420, height: 760, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div 
                style={{ position: "relative", width: "100%", height: 620, cursor: isDragging ? "grabbing" : "grab" }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                {/* Visual Stack (Behind Card) */}
                {matches.slice(currentIndex + 1, currentIndex + 3).map((match, idx) => (
                    <div 
                        key={match.startup.id}
                        style={{
                            position: "absolute", top: (idx + 1) * 12, left: 0, right: 0,
                            transform: `scale(${1 - (idx + 1) * 0.04})`,
                            zIndex: 5 - idx, opacity: 1 - (idx + 1) * 0.3,
                            pointerEvents: "none"
                        }}
                    >
                        <SwipeCard {...match} />
                    </div>
                ))}

                {/* Active Card */}
                {currentMatch && (
                    <SwipeCard 
                        key={currentMatch.startup.id}
                        {...currentMatch}
                        style={{
                            transform: exitDirection 
                                ? `translateX(${exitDirection === "right" ? 1000 : -1000}px) rotate(${exitDirection === "right" ? 45 : -45}deg)`
                                : `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
                            transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                            zIndex: 10
                        }}
                        opacityRight={opacityRight}
                        opacityLeft={opacityLeft}
                    />
                )}
            </div>

            {/* Bottom Controls */}
            <div style={{ display: "flex", gap: 32, marginTop: 40, zIndex: 20 }}>
                <button 
                    onClick={() => handleComplete("left")}
                    className="btn btn-secondary"
                    style={{ 
                        width: 72, height: 72, padding: 0,
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#FF4D4D", cursor: "pointer",
                        transition: "all 0.2s",
                        background: "rgba(255, 77, 77, 0.05)",
                        border: "1px solid rgba(255, 77, 77, 0.1)",
                        borderRadius: "50%"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255, 77, 77, 0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255, 77, 77, 0.05)")}
                >
                    <X size={36} />
                </button>
                <button 
                    onClick={() => handleComplete("right")}
                    className="btn btn-secondary"
                    style={{ 
                        width: 72, height: 72, padding: 0,
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#10B981", cursor: "pointer",
                        transition: "all 0.2s",
                        background: "rgba(16, 185, 129, 0.05)",
                        border: "1px solid rgba(16, 185, 129, 0.1)",
                        borderRadius: "50%"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)")}
                >
                    <Heart size={36} fill="currentColor" />
                </button>
            </div>
        </div>
    );
}
