-- ============================================================
-- ProvenMRR: All-Time Revenue Tracking
-- Migration 006 — Support for All-Time historical extraction 
-- ============================================================

-- 1. Modify the `revenue_snapshots` table to persistently track all-time volumes
ALTER TABLE public.revenue_snapshots
  ADD COLUMN IF NOT EXISTS all_time_revenue numeric NOT NULL DEFAULT 0;
