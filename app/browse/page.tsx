import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrowseFeed, BrowseStartupNode } from "@/components/browse/BrowseFeed";

export const metadata = { title: "Browse Verified Startups — Vetra" };
export const dynamic = "force-dynamic";

export default async function BrowsePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const filterQuery = searchParams?.filter;
    const searchQuery = typeof searchParams?.q === "string" ? searchParams.q : "";
    const categoryQuery = typeof searchParams?.category === "string" ? searchParams.category : "All";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: startups } = await supabase
        .from("startups").select("id, name, logo_url, description, category, country, website_url, is_listed_for_sale, is_verified, created_at")
        .eq("is_anonymous", false).eq("is_verified", true)
        .order("created_at", { ascending: false })
        .returns<{ id: string; name: string; logo_url: string | null; description: string | null; category: string | null; country: string | null; website_url: string | null; is_listed_for_sale: boolean; is_verified: boolean; created_at: string }[]>();

    const all = startups ?? [];
    const ids = all.map((s) => s.id);

    const [{ data: snaps }, { data: scores }] = await Promise.all([
        supabase.from("revenue_snapshots").select("startup_id, mrr, growth_rate")
            .in("startup_id", ids.length > 0 ? ids : ["x"]).order("snapshot_date", { ascending: false })
            .returns<{ startup_id: string; mrr: number; growth_rate: number }[]>(),
        supabase.from("health_scores").select("startup_id, score")
            .in("startup_id", ids.length > 0 ? ids : ["x"]).order("created_at", { ascending: false })
            .returns<{ startup_id: string; score: number }[]>(),
    ]);

    const snapMap = new Map<string, { mrr: number; growth_rate: number }>();
    for (const s of snaps ?? []) if (!snapMap.has(s.startup_id)) snapMap.set(s.startup_id, s);
    const scoreMap = new Map<string, number>();
    for (const s of scores ?? []) if (!scoreMap.has(s.startup_id)) scoreMap.set(s.startup_id, s.score);

    // Filter server side ONLY if 'deals' parameter was passed from homepage explicitly
    let baseStartups = [...all];
    if (filterQuery === 'deals') {
        baseStartups = baseStartups.filter(s => s.is_listed_for_sale);
    }
    if (categoryQuery !== "All") {
        baseStartups = baseStartups.filter(s => s.category === categoryQuery);
    }

    // Map into composite BrowseFeed node structure
    const initialStartups: BrowseStartupNode[] = baseStartups.map(s => ({
        ...s,
        snap: snapMap.get(s.id),
        score: scoreMap.get(s.id)
    }));

    // If 'growth', apply server-side presort
    if (filterQuery === 'growth') {
        initialStartups.sort((a, b) => (b.snap?.growth_rate || 0) - (a.snap?.growth_rate || 0));
    }


    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
            {/* Header */}
            <header className="site-header">
                <div className="site-header-inner">
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        <Link href="/" className="site-logo">
                            <span className="site-logo-dot" />
                            Vetra
                        </Link>
                        <nav style={{ display: "flex", gap: 24 }}>
                            <Link href="/browse" className="nav-link active">Browse</Link>
                            <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
                            <Link href="/co-founders" className="nav-link">Co-founders</Link>
                        </nav>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {!user ? (
                            <>
                                <Link href="/login" className="nav-link">Sign in</Link>
                                <Link href="/login" className="btn btn-secondary btn-sm">Sign up</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/dashboard" className="nav-link">Dashboard</Link>
                                <form action="/auth/signout" method="POST">
                                    <button type="submit" className="btn btn-secondary btn-sm" style={{ background: "transparent", border: "1px solid var(--color-border)", cursor: "pointer" }}>
                                        Sign out
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="page-container" style={{ paddingTop: 40, paddingBottom: 80 }}>
                <BrowseFeed initialStartups={initialStartups} initialQuery={searchQuery} />
            </div>
        </div>
    );
}
