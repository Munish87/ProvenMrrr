-- ============================================================
-- ProvenMRR: Row Level Security Policies
-- Migration 002 — RLS
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.startups enable row level security;
alter table public.stripe_connections enable row level security;
alter table public.revenue_snapshots enable row level security;
alter table public.health_scores enable row level security;
alter table public.watchlists enable row level security;

-- ─── USERS ────────────────────────────────────────────────────────────────────
-- Users can only view and update their own profile
create policy "users: view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ─── STARTUPS ─────────────────────────────────────────────────────────────────
-- Public: anyone can view non-anonymous startups
create policy "startups: public read non-anonymous"
  on public.startups for select
  using (is_anonymous = false);

-- Owner can always view their own startup (even if anonymous)
create policy "startups: owner read own"
  on public.startups for select
  using (auth.uid() = owner_id);

-- Only authenticated users can insert, and they must be the owner
create policy "startups: owner insert"
  on public.startups for insert
  with check (auth.uid() = owner_id);

create policy "startups: owner update"
  on public.startups for update
  using (auth.uid() = owner_id);

create policy "startups: owner delete"
  on public.startups for delete
  using (auth.uid() = owner_id);

-- ─── STRIPE CONNECTIONS ────────────────────────────────────────────────────────
-- Strictly private — only startup owner can operate
create policy "stripe_connections: owner only select"
  on public.stripe_connections for select
  using (
    auth.uid() = (select owner_id from public.startups where id = startup_id)
  );

create policy "stripe_connections: owner only insert"
  on public.stripe_connections for insert
  with check (
    auth.uid() = (select owner_id from public.startups where id = startup_id)
  );

create policy "stripe_connections: owner only update"
  on public.stripe_connections for update
  using (
    auth.uid() = (select owner_id from public.startups where id = startup_id)
  );

create policy "stripe_connections: owner only delete"
  on public.stripe_connections for delete
  using (
    auth.uid() = (select owner_id from public.startups where id = startup_id)
  );

-- ─── REVENUE SNAPSHOTS ────────────────────────────────────────────────────────
-- Public: MRR, ARR, growth_rate visible to all (on non-anonymous startups)
-- Private metrics (churn, volatility, customer_count, refund_rate) owner-only
-- We use a view-based approach — simple policy: all can SELECT but premium fields
-- are controlled at the application layer (API route filters columns)
create policy "revenue_snapshots: public read"
  on public.revenue_snapshots for select
  using (
    exists (
      select 1 from public.startups
      where id = startup_id and is_anonymous = false
    )
  );

create policy "revenue_snapshots: owner read own"
  on public.revenue_snapshots for select
  using (
    auth.uid() = (select owner_id from public.startups where id = startup_id)
  );

-- Only service role via API routes can insert snapshots
create policy "revenue_snapshots: service role insert"
  on public.revenue_snapshots for insert
  with check (false); -- Block direct client inserts; use API routes

-- ─── HEALTH SCORES ────────────────────────────────────────────────────────────
-- Public: score + risk_level visible; ai_summary is premium (app-layer gated)
create policy "health_scores: public read"
  on public.health_scores for select
  using (
    exists (
      select 1 from public.startups
      where id = startup_id and is_anonymous = false
    )
  );

create policy "health_scores: owner read own"
  on public.health_scores for select
  using (
    auth.uid() = (select owner_id from public.startups where id = startup_id)
  );

create policy "health_scores: service role insert"
  on public.health_scores for insert
  with check (false); -- Only via API routes using service role

-- ─── WATCHLISTS ───────────────────────────────────────────────────────────────
create policy "watchlists: user owns rows"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "watchlists: user insert"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "watchlists: user delete"
  on public.watchlists for delete
  using (auth.uid() = user_id);
