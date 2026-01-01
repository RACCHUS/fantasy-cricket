-- Migration: Add API sync tracking for players
-- This allows us to cache player data from external API and refresh periodically

-- Add external API ID to players table (for matching with CricketData.org)
ALTER TABLE players ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Create index for external_id lookups
CREATE INDEX IF NOT EXISTS idx_players_external_id ON players(external_id);

-- Create a table to track API sync status per tournament/series
CREATE TABLE IF NOT EXISTS api_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'players', 'matches', 'squads'
  external_id TEXT NOT NULL, -- tournament/series ID from API
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  records_synced INTEGER DEFAULT 0,
  next_sync_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  
  UNIQUE(sync_type, external_id)
);

-- Create index for checking if sync is needed
CREATE INDEX IF NOT EXISTS idx_api_sync_next ON api_sync_log(sync_type, next_sync_at);

-- Add recent performance tracking to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS recent_matches INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS recent_runs INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS recent_wickets INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS recent_points DECIMAL(6,1) DEFAULT 0;

-- Enable RLS on sync log
ALTER TABLE api_sync_log ENABLE ROW LEVEL SECURITY;

-- Only service role can modify sync log
CREATE POLICY "Service role can manage sync log"
  ON api_sync_log FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE api_sync_log IS 'Tracks when data was last synced from external cricket APIs';
COMMENT ON COLUMN players.external_id IS 'Player ID from CricketData.org API';
COMMENT ON COLUMN players.last_synced_at IS 'When this player record was last updated from API';
