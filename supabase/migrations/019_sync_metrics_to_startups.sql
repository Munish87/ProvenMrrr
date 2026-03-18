-- Sync latest revenue metrics to startups table for performance
WITH LatestSnaps AS (
    SELECT DISTINCT ON (startup_id)
        startup_id,
        mrr,
        growth_rate,
        arr
    FROM public.revenue_snapshots
    ORDER BY startup_id, snapshot_date DESC
)
UPDATE public.startups s
SET 
    monthly_revenue = COALESCE(l.mrr, s.monthly_revenue),
    growth_rate = COALESCE(l.growth_rate, s.growth_rate),
    revenue_30d = COALESCE(l.arr, s.revenue_30d)
FROM LatestSnaps l
WHERE s.id = l.startup_id;
