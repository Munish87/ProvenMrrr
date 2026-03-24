"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toggleWatchlist } from "@/app/actions/startup";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface WatchlistButtonProps {
    startupId: string;
    initialSaved: boolean;
}

export function WatchlistButton({ startupId, initialSaved }: WatchlistButtonProps) {
    const [saved, setSaved] = useState(initialSaved);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkStatus = async () => {
            if (!user) return;
            const { data } = await supabase
                .from("watchlists")
                .select("id")
                .eq("startup_id", startupId)
                .eq("user_id", user.id)
                .maybeSingle();
            
            if (data) setSaved(true);
        };
        checkStatus();
    }, [user, startupId, supabase]);

    const handleToggle = async () => {
        if (loading) return;
        setLoading(true);

        const previousState = saved;

        // Optimistic UI toggle
        setSaved(!saved);

        const result = await toggleWatchlist(startupId);

        if (!result.success && result.error === "You must be signed in to save startups.") {
            // Revert state on unauthenticated, redirect to login
            setSaved(previousState);
            router.push(`/login?next=${encodeURIComponent(`/startup/${startupId}`)}`);
        } else if (!result.success) {
            // Revert on random error
            setSaved(previousState);
        } else {
            // Synchronize exact db state just in case
            setSaved(result.saved);
        }

        setLoading(false);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                borderColor: saved ? "var(--color-accent)" : "var(--color-border)",
                background: saved ? "rgba(99, 102, 241, 0.05)" : "transparent",
                color: saved ? "var(--color-accent)" : "var(--color-text)",
                opacity: loading ? 0.7 : 1,
            }}
        >
            <Heart
                size={14}
                fill={saved ? "var(--color-accent)" : "transparent"}
                color={saved ? "var(--color-accent)" : "currentColor"}
            />
            {saved ? "Saved" : "Save"}
        </button>
    );
}
