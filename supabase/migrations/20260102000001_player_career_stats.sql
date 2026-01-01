-- Migration: Add career stats storage for players
-- Stores comprehensive stats from API for credit calculation

-- Add career stats columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS career_stats JSONB DEFAULT '{}';
ALTER TABLE players ADD COLUMN IF NOT EXISTS credit_value DECIMAL(3,1) DEFAULT 8.0;

-- Create index for credit value queries
CREATE INDEX IF NOT EXISTS idx_players_credit_value ON players(credit_value);

COMMENT ON COLUMN players.career_stats IS 'Career statistics from CricketData.org API across all formats';
COMMENT ON COLUMN players.credit_value IS 'Calculated player credit value for fantasy (6.0 - 11.5)';
