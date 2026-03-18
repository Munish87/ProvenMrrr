-- Migration 014 - Manual startup sale status override
-- Adds a persisted owner-controlled sale status for sold listings.

ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS sale_status_override TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'startups_sale_status_override_check'
    ) THEN
        ALTER TABLE public.startups
        ADD CONSTRAINT startups_sale_status_override_check
        CHECK (sale_status_override IS NULL OR sale_status_override IN ('sold'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_startups_sale_status_override
ON public.startups (sale_status_override)
WHERE sale_status_override IS NOT NULL;
