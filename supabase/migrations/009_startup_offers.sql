-- ============================================================
-- ProvenMRR: Full Database Schema
-- Migration 009 — Startup Offers Inbox
-- ============================================================

create table if not exists public.offers (
    id          uuid primary key default gen_random_uuid(),
    startup_id  uuid not null references public.startups(id) on delete cascade,
    buyer_id    uuid not null references public.users(id) on delete cascade,
    amount      numeric(12,2) not null,
    message     text not null,
    status      text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at  timestamptz not null default now()
);

-- Index for faster queries on a founder's startups and a buyer's outbox
create index if not exists idx_offers_startup_id on public.offers(startup_id);
create index if not exists idx_offers_buyer_id on public.offers(buyer_id);

-- Setup RLS
alter table public.offers enable row level security;

-- Buyers can read their own offers
create policy "Buyers can view their own offers"
    on public.offers for select
    using (auth.uid() = buyer_id);

-- Founders can read offers made to their startups
create policy "Founders can view offers for their startups"
    on public.offers for select
    using (
        exists (
            select 1 from public.startups
            where startups.id = offers.startup_id
            and startups.owner_id = auth.uid()
        )
    );

-- Buyers can insert their own offers
create policy "Authenticated users can create offers"
    on public.offers for insert
    with check (auth.uid() = buyer_id);

-- Note: RLS guarantees secure client-side checks, but our edge function will utilize
-- the admin key to insert directly, meaning it bypasses these policies for the actual insertion.
