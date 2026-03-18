import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://provenmrr.com";

    // Static pages
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
        { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${baseUrl}/recent`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
        { url: `${baseUrl}/stats`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
        { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
        { url: `${baseUrl}/co-founders`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    ];

    // Dynamic startup pages (only public, non-anonymous)
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: startups } = await supabase
            .from("startups")
            .select("id, slug, created_at")
            .eq("is_anonymous", false)
            .not("slug", "is", null)
            .order("created_at", { ascending: false })
            .limit(5000);

        const startupRoutes: MetadataRoute.Sitemap = (startups || []).map((s) => ({
            url: `${baseUrl}/startup/${s.slug ?? s.id}`,
            lastModified: new Date(s.created_at),
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }));

        return [...staticRoutes, ...startupRoutes];
    } catch {
        // Return static routes if DB fetch fails
        return staticRoutes;
    }
}
