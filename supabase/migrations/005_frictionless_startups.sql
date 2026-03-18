-- ============================================================
-- ProvenMRR: Frictionless Startup Submissions
-- Migration 005 — Claim Tokens, Providers, Anonymous Mode
-- ============================================================

-- 1. Modify the `startups` table
ALTER TABLE public.startups
  ALTER COLUMN owner_id DROP NOT NULL,
  ADD COLUMN claim_token text UNIQUE,
  ADD COLUMN provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN x_handle text;

-- 2. Modify `stripe_connections` to support any provider generically
ALTER TABLE public.stripe_connections
  ADD COLUMN provider text NOT NULL DEFAULT 'stripe';

-- 3. RLS Changes for unauthenticated insertions
-- We need to allow unauthenticated (or anon) roles to insert into startups if they are using the frictionless flow,
-- OR we can just handle the insert securely in a server action using the service_role key (Admin client).
-- Since the application layer uses `createAdminClient()`, RLS bypasses it. We don't strictly need to open RLS to `anon`.

-- However, we should ensure users can only UPDATE/DELETE their own startups, which is already handled in 002_rls.sql.
-- For viewing, everyone can view verified/listed startups.
