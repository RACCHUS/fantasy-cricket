-- Add last_synced_at and api_id columns for cache tracking
-- This enables the lazy-loading cache pattern

-- Tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS api_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tournaments_api_id ON tournaments(api_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_last_synced ON tournaments(last_synced_at);

-- Matches  
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_matches_last_synced ON matches(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_matches_status_synced ON matches(status, last_synced_at);

-- Players
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_players_last_synced ON players(last_synced_at);

-- Cricket Teams
ALTER TABLE cricket_teams
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cricket_teams_last_synced ON cricket_teams(last_synced_at);

-- Create a table for generic API response caching (fallback)
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL, -- 'tournament', 'match', 'player', 'team', 'live_score'
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_type ON api_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- Auto-cleanup expired cache entries (optional - run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM api_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the caching strategy
COMMENT ON TABLE api_cache IS 
'Generic cache for API responses. Used for:
- Data that does not fit structured tables
- Temporary caching of live data
- Fallback when main tables are not suitable

Cache strategy:
- Completed matches/tournaments: never expire
- Active matches: 30 second TTL
- Upcoming matches: 1 hour TTL
- Player data: 24 hour TTL';
