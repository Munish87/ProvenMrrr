"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddStartupModal } from "./AddStartupModal";

export function FrictionlessAddWrapper({
    className = "btn btn-primary",
    style,
    text = "Add startup"
}: {
    className?: string;
    style?: React.CSSProperties;
    text?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={className}
                style={style || { height: 44, whiteSpace: "nowrap", background: "#6366F1", color: "white", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "0 16px", fontSize: 14, fontWeight: 500 }}
            >
                <Plus size={16} />
                {text}
            </button>

            <AddStartupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
