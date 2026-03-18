-- ============================================================
-- Migration 008 — Startup Sale Data Expansion
-- Adds asking_price, profit_margin_30d, and contact_email
-- ============================================================

-- Safely add the columns
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS asking_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS profit_margin_30d NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Create an index to quickly find listed startups with pricing constraints
CREATE INDEX IF NOT EXISTS idx_startups_asking_price
ON public.startups(asking_price)
WHERE is_listed_for_sale = true;
