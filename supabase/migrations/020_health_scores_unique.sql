-- Add unique constraint to health_scores(startup_id)
-- First, ensure there are no duplicates (we already checked, but for safety in production)
DELETE FROM public.health_scores a USING (
      SELECT MIN(ctid) as ctid, startup_id
      FROM public.health_scores 
      GROUP BY startup_id HAVING COUNT(*) > 1
) b
WHERE a.startup_id = b.startup_id 
AND a.ctid <> b.ctid;

-- Add the unique constraint
ALTER TABLE public.health_scores 
ADD CONSTRAINT health_scores_startup_id_key UNIQUE (startup_id);
