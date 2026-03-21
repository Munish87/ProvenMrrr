"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StartupSuggestion {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  category: string | null;
}

export function HomePageSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StartupSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      
      // Fetch name matches and category matches in parallel
      const [nameRes, catRes] = await Promise.all([
        supabase
          .from("startups")
          .select("id, name, slug, logo_url, category")
          .eq("is_verified", true)
          .ilike("name", `${query}%`)
          .order("monthly_revenue", { ascending: false, nullsFirst: false })
          .limit(5),
        supabase
          .from("startups")
          .select("id, name, slug, logo_url, category")
          .eq("is_verified", true)
          .ilike("category", `${query}%`)
          .order("monthly_revenue", { ascending: false, nullsFirst: false })
          .limit(5)
      ]);

      const nameMatches = nameRes.data || [];
      const catMatches = catRes.data || [];

      // Prioritize name matches, then fill the rest with category matches up to 5
      const combined = [...nameMatches];
      for (const item of catMatches) {
        if (combined.length >= 5) break;
        if (!combined.find((c) => c.id === item.id)) {
          combined.push(item);
        }
      }

      setSuggestions(combined);
      setIsLoading(false);
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/browse?q=${encodeURIComponent(query)}`);
    } else {
        router.push('/browse');
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: "1 1 340px", minWidth: 260 }}>
      <form onSubmit={handleSubmit} className="search-box" style={{ width: "100%", margin: 0 }}>
        <Search size={16} color="var(--color-secondary)" />
        <input 
          name="q" 
          type="text" 
          placeholder='e.g. "SaaS over $10K/mo"' 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <button type="submit" style={{ display: "none" }}>Search</button>
      </form>

      {isOpen && query.length >= 2 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "8px",
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(20px)",
          zIndex: 50,
          overflow: "hidden",
          textAlign: "left"
        }}>
          {isLoading ? (
            <div style={{ padding: "12px 16px", color: "var(--color-secondary)", fontSize: "13px" }}>
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              {suggestions.map((startup) => (
                <Link 
                  key={startup.id} 
                  href={`/startup/${startup.slug}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 16px",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--color-border-subtle)"
                  }}
                  className="hover:bg-[var(--color-bg-soft)] transition-colors"
                >
                  <img 
                    src={startup.logo_url || "https://wgffzscswwttvjohihwq.supabase.co/storage/v1/object/public/logos/default.png"} 
                    alt={startup.name}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ 
                      color: "var(--color-text)", 
                      fontSize: "14px", 
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {startup.name}
                    </span>
                    {startup.category && (
                      <span style={{ color: "var(--color-secondary)", fontSize: "12px" }}>
                        {startup.category}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              <Link 
                href={`/browse?q=${encodeURIComponent(query)}`}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  color: "var(--color-accent)",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "center",
                  textDecoration: "none",
                  backgroundColor: "var(--color-bg-soft)"
                }}
                className="hover:bg-[var(--color-border-subtle)] transition-colors"
              >
                View all results for "{query}" &rarr;
              </Link>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", color: "var(--color-secondary)", fontSize: "13px" }}>
              No startups found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
