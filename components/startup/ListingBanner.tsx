"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ListingPlanModal } from "./ListingPlanModal";

interface ListingBannerProps {
    id: string;
    name: string;
    isListedForSale: boolean;
    hasPaidListing: boolean;
    onToggle: (id: string, currentStatus: boolean, markListingAsPaid?: boolean) => Promise<void>;
}

export function ListingBanner({ id, name, isListedForSale, hasPaidListing, onToggle }: ListingBannerProps) {
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [listingUnlocked, setListingUnlocked] = useState(hasPaidListing);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedPaidStatus = window.localStorage.getItem(`provenmrr-listing-paid:${id}`) === "true";
        setListingUnlocked(hasPaidListing || storedPaidStatus);
    }, [hasPaidListing, id]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (hasPaidListing) {
            window.localStorage.setItem(`provenmrr-listing-paid:${id}`, "true");
        }
    }, [id, hasPaidListing]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`startup-banner-realtime-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "startups",
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    const updatedStartup = payload.new as any;
                    if (updatedStartup.listing_fee_paid) {
                        setListingUnlocked(true);
                        if (typeof window !== "undefined") {
                            window.localStorage.setItem(`provenmrr-listing-paid:${id}`, "true");
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("list") === "true" && !isListedForSale) {
            if (listingUnlocked) {
                onToggle(id, false);
            } else {
            setShowModal(true);
            }
            const newUrl = window.location.pathname + window.location.search.replace(/[?&]list=true/, "").replace(/^&/, "?");
            window.history.replaceState({}, "", newUrl);
        }
    }, [id, isListedForSale, listingUnlocked, onToggle]);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isListedForSale) {
            if (listingUnlocked) {
                setIsLoading(true);
                await onToggle(id, isListedForSale);
                setIsLoading(false);
                return;
            }
            setShowModal(true);
            return;
        }

        setIsLoading(true);
        await onToggle(id, isListedForSale);
        setIsLoading(false);
    };

    const handleConfirmListing = async () => {
        setShowModal(false);
        setIsLoading(true);
        await onToggle(id, isListedForSale, true);
        setListingUnlocked(true);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(`provenmrr-listing-paid:${id}`, "true");
        }
        setIsLoading(false);
    };

    return (
        <>
            <div
                style={{
                    marginBottom: 16,
                    padding: "16px 20px",
                    borderRadius: 18,
                    border: `1px solid ${isListedForSale ? "color-mix(in srgb, #f59e0b 28%, var(--color-border))" : "var(--color-border)"}`,
                    background: isListedForSale
                        ? "linear-gradient(135deg, color-mix(in srgb, #facc15 24%, transparent), color-mix(in srgb, #facc15 8%, var(--color-surface)) 30%, var(--color-surface) 100%)"
                        : "var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow-card)",
                    transition: "all 0.2s ease",
                }}
            >
                <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: isListedForSale ? "color-mix(in srgb, #f59e0b 70%, var(--color-text))" : "var(--color-text)", margin: 0 }}>
                        {isListedForSale ? "Listed for sale" : "Sell your startup?"}
                    </p>
                    <p style={{ fontSize: 12, color: isListedForSale ? "color-mix(in srgb, #f59e0b 52%, var(--color-text))" : "var(--color-secondary)", margin: "4px 0 0" }}>
                        {isListedForSale
                            ? "Buyers can now see this listing in the marketplace."
                            : "List securely through ProvenMRR and reach thousands of verified buyers."}
                    </p>
                </div>

                <form onSubmit={handleAction}>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={isListedForSale ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                        style={{
                            minWidth: 100,
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? "not-allowed" : "pointer",
                        }}
                    >
                        {isLoading ? "Wait..." : isListedForSale ? "Delist" : "List for sale"}
                    </button>
                </form>
            </div>

            <ListingPlanModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirmListing}
                startupId={id}
                startupName={name}
            />
        </>
    );
}
