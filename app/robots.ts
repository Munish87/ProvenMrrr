import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://provenmrr.com";
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/dashboard/",
                    "/api/",
                    "/login",
                    "/auth/",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
