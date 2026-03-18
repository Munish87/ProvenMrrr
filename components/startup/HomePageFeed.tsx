"use client";

import { useState, useEffect } from "react";
import { StartupDiscoveryCard } from "./StartupDiscoveryCard";

export function HomePageFeed({ sectionTitle, initialData, snapMapData }: { sectionTitle: string, initialData: any[], snapMapData?: Record<string, any> }) {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        if (sectionTitle !== "Recently listed") return;

        const handleNewStartup = (e: Event) => {
            const customEvent = e as CustomEvent;
            setData(prev => [customEvent.detail, ...prev].slice(0, 4));
        };

        window.addEventListener("new-startup", handleNewStartup);
        return () => window.removeEventListener("new-startup", handleNewStartup);
    }, [sectionTitle]);

    if (data.length === 0) {
        return <p style={{ color: "var(--color-secondary)", fontSize: 14 }}>No startups found.</p>;
    }

    return (
        <div className="startups-grid">
            {data.map((s: any) => {
                const snap = s.snap || (snapMapData && snapMapData[s.id]);
                return <StartupDiscoveryCard key={s.id} s={s} snap={snap} />;
            })}
        </div>
    );
}
