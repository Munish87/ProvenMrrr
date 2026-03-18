-- =====================================================
-- Migration: create advertisers table v2
-- Run this in Supabase SQL Editor or via CLI
-- =====================================================

-- Drop old table if exists
DROP TABLE IF EXISTS advertisers CASCADE;

-- Create advertisers table
CREATE TABLE advertisers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name      text        NOT NULL,
  logo_url          text,
  title             text        NOT NULL,
  description       text,
  website_url       text        NOT NULL,
  plan_type         text        NOT NULL CHECK (plan_type IN ('weekly', 'monthly')) DEFAULT 'weekly',
  status            text        NOT NULL CHECK (status IN ('active', 'pending', 'expired')) DEFAULT 'pending',
  stripe_session_id text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz
);

-- Indexes
CREATE INDEX advertisers_status_idx   ON advertisers (status);
CREATE INDEX advertisers_expires_idx  ON advertisers (expires_at);

-- Row-Level Security
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;

-- Public: read active ads only
CREATE POLICY "public_read_active" ON advertisers
  FOR SELECT USING (status = 'active');

-- Service role bypasses RLS automatically — no extra policy needed

-- ─── Seed Data: 15 active advertisers ────────────────
INSERT INTO advertisers
  (company_name, title, description, website_url, plan_type, status, expires_at)
VALUES
  ('Startup Directories', 'Get Listed',          'Submit to 50+ startup directories',        'https://startupdir.io',        'monthly', 'active', now() + interval '30 days'),
  ('Tools for Founders',  'Best SaaS Tools',     'Curated software for bootstrappers',        'https://toolsforfounders.com', 'monthly', 'active', now() + interval '30 days'),
  ('Indie Communities',   'Join Builders',        'Connect with 10k+ indie founders',         'https://indiehackers.com',     'monthly', 'active', now() + interval '30 days'),
  ('Sponsor Partners',    'Exclusive Deals',      'Discounts & perks for SaaS builders',      'https://sponsorpartners.io',   'monthly', 'active', now() + interval '30 days'),
  ('FinanceOS',           'Manage Revenue',       'Revenue dashboards for bootstrappers',     'https://financeos.app',        'monthly', 'active', now() + interval '30 days'),
  ('SEO Boost Pro',       'Rank Higher',          'Backlinks & SEO for indie SaaS',           'https://seoboost.pro',         'monthly', 'active', now() + interval '30 days'),
  ('LaunchHouse',         'Live & Build',         'Co-living for serious founders',           'https://launchhouse.com',      'monthly', 'active', now() + interval '30 days'),
  ('MRR Academy',         'Scale to $100K MRR',  'Revenue growth course for SaaS founders',  'https://mrracademy.com',       'monthly', 'active', now() + interval '30 days'),
  ('Acquire.com',         'Buy & Sell SaaS',      'Marketplace for profitable startups',      'https://acquire.com',          'monthly', 'active', now() + interval '30 days'),
  ('Cold Email Pro',      'Outbound That Works',  'AI-powered cold email sequences',          'https://coldemailpro.io',      'monthly', 'active', now() + interval '30 days'),
  ('Notion Templates',    'Startup OS',           'All-in-one Notion workspace',              'https://notionforstartups.io', 'monthly', 'active', now() + interval '30 days'),
  ('RevOps Hub',          'Revenue Operations',   'Tools for your go-to-market team',         'https://revopshub.io',         'monthly', 'active', now() + interval '30 days'),
  ('Hiring.dev',          'Hire Top Devs',        'Vetted remote engineers on demand',        'https://hiring.dev',           'monthly', 'active', now() + interval '30 days'),
  ('Design Assets Pro',   'Premium UI Kits',      'Icons, illustrations & UI components',     'https://designassets.pro',     'monthly', 'active', now() + interval '30 days'),
  ('FounderPath',         'Roadmap to $1M',       'Step-by-step playbook for indie hackers',  'https://founderpath.com',      'monthly', 'active', now() + interval '30 days');
