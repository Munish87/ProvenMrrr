"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ListingPlanModal } from "./ListingPlanModal";

interface ListingToggleProps {
    id: string;
    name: string;
    initialValue: boolean;
    initialHasPaidListing: boolean;
    onToggle: (id: string, currentStatus: boolean, markListingAsPaid?: boolean) => Promise<void>;
}

export function ListingToggle({ id, name, initialValue, initialHasPaidListing, onToggle }: ListingToggleProps) {
    const [isListed, setIsListed] = useState(initialValue);
    const [hasPaidListing, setHasPaidListing] = useState(initialHasPaidListing);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [priceDisplay, setPriceDisplay] = useState("$1.00");

    useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset();
        const locale = typeof window !== "undefined" ? window.navigator.language : "";

        console.log(`[Currency Detection Toggle] TZ: ${tz}, Offset: ${offset}, Locale: ${locale}`);

        if (tz.includes("Asia/Calcutta") || tz.includes("Asia/Kolkata") || tz.includes("India") || offset === -330 || locale === "en-IN" || locale === "hi-IN") {
            setPriceDisplay("₹100");
        } else if (tz.includes("Canada")) {
            setPriceDisplay("$1.40");
        } else if (tz.includes("Europe") || tz.includes("Paris") || tz.includes("Berlin") || tz.includes("London")) {
            setPriceDisplay(tz.includes("London") ? "£0.80" : "€0.95");
        } else {
            setPriceDisplay("$1.00");
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedPaidStatus = window.localStorage.getItem(`provenmrr-listing-paid:${id}`) === "true";
        setHasPaidListing(initialHasPaidListing || storedPaidStatus);
    }, [id, initialHasPaidListing]);

    useEffect(() => {
        setIsListed(initialValue);
    }, [initialValue, id]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (initialHasPaidListing) {
            window.localStorage.setItem(`provenmrr-listing-paid:${id}`, "true");
        }
    }, [id, initialHasPaidListing]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`startup-realtime-${id}`)
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
                    if (updatedStartup.listing_paid) {
                        setHasPaidListing(true);
                        setIsListed(updatedStartup.is_listed_for_sale);
                        if (typeof window !== "undefined") {
                            window.localStorage.setItem(`provenmrr-listing-paid:${id}`, "true");
                        }
                    } else {
                        setHasPaidListing(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleToggle = async () => {
        if (isLoading) return;

        if (!isListed) {
            if (hasPaidListing) {
                setIsLoading(true);
                await onToggle(id, isListed);
                setIsListed(true);
                setIsLoading(false);
                return;
            }
            setShowModal(true);
        } else {
            setIsLoading(true);
            await onToggle(id, isListed);
            setIsListed(false);
            setIsLoading(false);
        }
    };

    const handleConfirmListing = async () => {
        setIsLoading(true);
        setShowModal(false);
        await onToggle(id, isListed, true);
        setIsListed(true);
        setHasPaidListing(true);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(`provenmrr-listing-paid:${id}`, "true");
        }
        setIsLoading(false);
    };

    return (
        <>
            <div style={{ 
                padding: "16px 20px", 
                background: isListed
                    ? "linear-gradient(135deg, color-mix(in srgb, #34d399 24%, transparent), color-mix(in srgb, #34d399 8%, var(--color-surface)) 34%, var(--color-surface) 100%)"
                    : "var(--color-surface)",
                borderRadius: 18, 
                border: `1px solid ${isListed ? "rgba(52, 211, 153, 0.3)" : "var(--color-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s",
                boxShadow: "var(--shadow-card)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                        width: 40, 
                        height: 40, 
                        background: isListed
                            ? "linear-gradient(135deg, #34d399, #059669)"
                            : "var(--color-surface-strong)",
                        borderRadius: 10, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        color: isListed ? "white" : "rgba(241, 241, 236, 0.78)",
                        transition: "all 0.2s",
                        border: `1px solid ${isListed ? "rgba(255,255,255,0.16)" : "var(--color-border)"}`
                    }}>
                        <Zap size={20} fill={isListed ? "white" : "none"} />
                    </div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>List for Sale ({priceDisplay})</p>
                        <p style={{ fontSize: 12, color: isListed ? "color-mix(in srgb, #10b981 58%, var(--color-text))" : "var(--color-secondary)", margin: "2px 0 0" }}>
                            {isListed ? "Currently active in marketplace" : "One-time payment to reach buyers"}
                        </p>
                    </div>
                </div>
                
                <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, opacity: isLoading ? 0.6 : 1 }}>
                    <input
                        type="checkbox"
                        checked={isListed}
                        onChange={handleToggle}
                        disabled={isLoading}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: "absolute", cursor: isLoading ? "not-allowed" : "pointer", top: 0, left: 0, right: 0, bottom: 0,
                        background: isListed ? "linear-gradient(135deg, #34d399, #059669)" : "var(--color-surface-strong)",
                        transition: ".2s", borderRadius: 24,
                        border: "1px solid var(--color-border)"
                    }}>
                        <span style={{
                            position: "absolute", content: '""', height: 18, width: 18, left: 3, top: 3,
                            backgroundColor: "white", transition: ".2s", borderRadius: "50%",
                            transform: isListed ? "translateX(20px)" : "translateX(0)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                        }} />
                    </span>
                </label>
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
