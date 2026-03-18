-- Up Migration
-- Add avatar_url to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Down Migration (Optional)
-- ALTER TABLE public.users DROP COLUMN IF NOT EXISTS avatar_url;
