import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Search Verified Startups — Vetra",
    description: "Search the database of verified startup revenues, MRR, and valuations.",
};

export default async function SearchPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
            {/* Header */}
            <header className="page-header">
                <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                        <Link href="/" style={{ fontWeight: 800, fontSize: 18, color: "var(--color-text)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, background: "#6366F1", borderRadius: "50%" }} />
                            Vetra
                        </Link>
                        <nav style={{ display: "flex", gap: 24 }}>
                            <Link href="/browse" className="nav-link">Browse</Link>
                            <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
                            <Link href="/co-founders" className="nav-link">Co-founders</Link>
                        </nav>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

            {/* Main Search Hero */}
            <main style={{ padding: "120px 24px 64px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
                <h1 style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "var(--color-text)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: 24
                }}>
                    Search verified startups
                </h1>
                <p style={{ color: "var(--color-secondary)", fontSize: 18, marginBottom: 48, lineHeight: 1.5 }}>
                    Find the exact startup, founder, or niche you're looking for across our entire verified database.
                </p>

                {/* Big Search Input Form redirecting to Browse logic */}
                <div style={{ maxWidth: 640, margin: "0 auto" }}>
                    <form action="/browse" method="GET" style={{ position: "relative" }}>
                        <Search
                            size={24}
                            color="var(--color-secondary)"
                            style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)" }}
                        />
                        <input
                            name="q"
                            type="text"
                            placeholder="e.g. &quot;SaaS over $10K/mo&quot;"
                            autoFocus
                            style={{
                                width: "100%",
                                padding: "24px 24px 24px 64px",
                                fontSize: 20,
                                borderRadius: 16,
                                border: "1px solid var(--color-border)",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                                outline: "none",
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "var(--color-accent)",
                                color: "white",
                                border: "none",
                                padding: "12px 24px",
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            Search
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
