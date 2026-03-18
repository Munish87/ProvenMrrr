-- ============================================================
-- Vetra: Full Database Schema
-- Migration 001 — Tables & Indexes
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── USERS ────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        text not null default 'founder' check (role in ('founder', 'buyer', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-create user record on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'founder')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── STARTUPS ─────────────────────────────────────────────────────────────────
create table if not exists public.startups (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.users(id) on delete cascade,
  name               text not null,
  description        text,
  website_url        text,
  logo_url           text,
  category           text,
  country            text,
  founded_date       date,
  is_anonymous       boolean not null default false,
  is_listed_for_sale boolean not null default false,
  is_verified        boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists idx_startups_owner_id on public.startups(owner_id);
create index if not exists idx_startups_is_listed on public.startups(is_listed_for_sale) where is_listed_for_sale = true;

-- ─── STRIPE CONNECTIONS ────────────────────────────────────────────────────────
create table if not exists public.stripe_connections (
  id                uuid primary key default gen_random_uuid(),
  startup_id        uuid not null references public.startups(id) on delete cascade,
  encrypted_api_key text not null,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  unique (startup_id)   -- one connection per startup
);

-- ─── REVENUE SNAPSHOTS ────────────────────────────────────────────────────────
create table if not exists public.revenue_snapshots (
  id              uuid primary key default gen_random_uuid(),
  startup_id      uuid not null references public.startups(id) on delete cascade,
  mrr             numeric(12,2) not null default 0,
  arr             numeric(12,2) not null default 0,
  churn_rate      numeric(6,3) not null default 0,   -- percentage
  growth_rate     numeric(8,3) not null default 0,   -- MoM %
  volatility_score numeric(6,2) not null default 0,  -- 0-100
  customer_count  integer not null default 0,
  refund_rate     numeric(6,3) not null default 0,   -- percentage
  snapshot_date   date not null default current_date,
  created_at      timestamptz not null default now()
);

-- Composite index for time-series queries
create index if not exists idx_revenue_snapshots_startup_date
  on public.revenue_snapshots(startup_id, snapshot_date desc);

-- ─── HEALTH SCORES ────────────────────────────────────────────────────────────
create table if not exists public.health_scores (
  id          uuid primary key default gen_random_uuid(),
  startup_id  uuid not null references public.startups(id) on delete cascade,
  score       smallint not null check (score between 0 and 100),
  risk_level  text not null check (risk_level in ('low', 'medium', 'high')),
  ai_summary  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_health_scores_startup_id on public.health_scores(startup_id);
create index if not exists idx_health_scores_score on public.health_scores(score desc);

-- ─── WATCHLISTS ───────────────────────────────────────────────────────────────
create table if not exists public.watchlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  startup_id  uuid not null references public.startups(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, startup_id)
);

create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
