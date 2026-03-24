CREATE TABLE IF NOT EXISTS public.cron_state (
    id TEXT PRIMARY KEY,
    last_page INTEGER DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cron_state ENABLE ROW LEVEL SECURITY;
