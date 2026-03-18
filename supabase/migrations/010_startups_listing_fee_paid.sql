-- ============================================================
-- Migration 010 - Persist one-time startup sale listing unlock
-- ============================================================

ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS listing_fee_paid boolean NOT NULL DEFAULT false;
