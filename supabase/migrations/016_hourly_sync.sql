-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create secrets in Supabase Vault for the sync job
-- NOTE: Replace 'YOUR_SITE_URL' with your actual production URL (e.g., https://your-site.vercel.app)
-- Replace '7f9b8c2a3e1d4b5a6c7d8e9f0a1b2c3d' with your CRON_SECRET if different.

SELECT vault.create_secret('http://localhost:3000', 'site_url');
SELECT vault.create_secret('7f9b8c2a3e1d4b5a6c7d8e9f0a1b2c3d', 'cron_secret');

-- Create a function to run the sync job
CREATE OR REPLACE FUNCTION public.run_hourly_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  site_url text;
  cron_secret text;
BEGIN
  -- Retrieve secrets from Vault
  SELECT decrypted_secret INTO site_url FROM vault.decrypted_secrets WHERE name = 'site_url';
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  -- Make the HTTP request
  PERFORM net.http_get(
    url := site_url || '/api/sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret
    )
  );
END;
$$;

-- Unschedule if exists to avoid errors on reapplying
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hourly-provider-sync') THEN
        PERFORM cron.unschedule('hourly-provider-sync');
    END IF;
END $$;

-- Schedule the job to run every hour at the start of the hour
SELECT cron.schedule(
  'hourly-provider-sync',
  '0 * * * *',
  'SELECT public.run_hourly_sync()'
);
