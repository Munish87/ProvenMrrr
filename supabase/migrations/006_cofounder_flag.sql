-- Add looking_for_cofounder flag to startups table
ALTER TABLE startups ADD COLUMN IF NOT EXISTS looking_for_cofounder BOOLEAN DEFAULT false;

-- Create an index for faster querying
CREATE INDEX IF NOT EXISTS idx_startups_looking_for_cofounder ON startups(looking_for_cofounder) WHERE looking_for_cofounder = true;
