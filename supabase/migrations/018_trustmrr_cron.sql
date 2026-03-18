-- Create a function to trigger TrustMRR import
CREATE OR REPLACE FUNCTION public.run_trustmrr_import()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  site_url text;
  cron_secret text;
BEGIN
  -- Retrieve secrets from Vault (already created in 016_hourly_sync.sql)
  SELECT decrypted_secret INTO site_url FROM vault.decrypted_secrets WHERE name = 'site_url';
  SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  -- Make the HTTP POST request (pg_net)
  PERFORM net.http_post(
    url := site_url || '/api/admin/import-trustmrr',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Unschedule if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trustmrr-import-6h') THEN
        PERFORM cron.unschedule('trustmrr-import-6h');
    END IF;
END $$;

-- Schedule the job to run daily at midnight
SELECT cron.schedule(
  'trustmrr-import-daily',
  '0 0 * * *',
  'SELECT public.run_trustmrr_import()'
);

