"use client";

import { useState, useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

export function DeferredAnalytics({ gaId }: { gaId: string }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;
    return <GoogleAnalytics gaId={gaId} />;
}
