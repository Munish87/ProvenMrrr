import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { CATEGORY_MAP } from "@/lib/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  // 1. Static high-level pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://provenmrr.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://provenmrr.com/leaderboard",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://provenmrr.com/browse",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
        url: "https://provenmrr.com/recent",
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.8,
      },
  ];

  // 2. Fetch all public/verified startups using pagination for >1,000 rows
  let allRows: any[] = [];
  let lastId = null;
  while (true) {
    let query = supabase
      .from("startups")
      .select("id, slug, created_at")
      .order("id");

    if (lastId) query = query.gt("id", lastId);

    const { data: chunk, error } = await query.limit(1000);
    if (error || !chunk || chunk.length === 0) break;

    allRows = [...allRows, ...chunk];
    lastId = chunk[chunk.length - 1].id;
    if (chunk.length < 1000) break;
  }

  const startupUrls: MetadataRoute.Sitemap = allRows.map((s) => ({
    url: `https://provenmrr.com/startup/${s.slug || s.id}`,
    lastModified: new Date(s.created_at),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  // 3. Category pages
  const categoryUrls: MetadataRoute.Sitemap = Object.keys(CATEGORY_MAP).map((slug) => ({
    url: `https://provenmrr.com/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryUrls,
    ...startupUrls,
  ];
}
