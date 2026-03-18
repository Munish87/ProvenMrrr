-- Add columns for TrustMRR integration
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS monthly_revenue numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS growth_rate numeric(8,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS customer_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_30d numeric(12,2) DEFAULT 0;

-- Index for slug search
CREATE INDEX IF NOT EXISTS idx_startups_slug ON public.startups(slug);
CREATE INDEX IF NOT EXISTS idx_startups_source ON public.startups(source);
