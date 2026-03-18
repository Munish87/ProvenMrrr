"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddStartupModal } from "./AddStartupModal";

export function DashboardAddButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 4, 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: "var(--color-accent)", 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 6,
                    transition: "background 0.12s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
                <Plus size={15} /> New
            </button>

            <AddStartupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
