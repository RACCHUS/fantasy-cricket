-- Fix: Add unique constraint on players.external_id for upsert to work
-- The previous migration added the column but we need an explicit unique constraint

-- Drop the existing index if it exists (it's not a constraint)
DROP INDEX IF EXISTS idx_players_external_id;

-- Add unique constraint (this also creates an index)
ALTER TABLE players ADD CONSTRAINT players_external_id_unique UNIQUE (external_id);

-- Also ensure cricket_teams can be upserted by shortname
ALTER TABLE cricket_teams ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE cricket_teams ADD CONSTRAINT cricket_teams_external_id_unique UNIQUE (external_id);

COMMENT ON COLUMN cricket_teams.external_id IS 'External ID for API matching';
