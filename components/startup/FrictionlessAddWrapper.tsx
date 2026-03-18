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
                style={style || { 
                    height: 48, 
                    whiteSpace: "nowrap", 
                    padding: "0 24px", 
                    fontSize: "14px", 
                    fontWeight: 700,
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                    borderRadius: "12px",
                }}
            >
                <Plus size={18} strokeWidth={2.5} />
                {text}
            </button>

            <AddStartupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
