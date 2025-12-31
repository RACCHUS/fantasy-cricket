-- ============================================
-- BASE SCHEMA FOR FANTASY CRICKET
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  contests_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- LEAGUES
-- ============================================

CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('franchise', 'international', 'custom')),
  logo_url TEXT,
  scoring_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leagues are viewable by everyone" ON leagues
  FOR SELECT USING (true);

-- ============================================
-- TOURNAMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  config JSONB DEFAULT '{"budget": 100, "maxPlayersPerTeam": 11}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone" ON tournaments
  FOR SELECT USING (true);

-- ============================================
-- CRICKET TEAMS
-- ============================================

CREATE TABLE IF NOT EXISTS cricket_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  country TEXT,
  league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cricket_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cricket teams are viewable by everyone" ON cricket_teams
  FOR SELECT USING (true);

-- ============================================
-- PLAYERS
-- ============================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  photo_url TEXT,
  country TEXT,
  role TEXT NOT NULL CHECK (role IN ('batsman', 'bowler', 'all-rounder', 'wicket-keeper')),
  batting_style TEXT,
  bowling_style TEXT,
  team_id UUID REFERENCES cricket_teams(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

-- ============================================
-- TOURNAMENT PLAYERS (Player pricing per tournament)
-- ============================================

CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL DEFAULT 8.0,
  credits DECIMAL(10,2) NOT NULL DEFAULT 8.0,
  form_rating DECIMAL(3,2) DEFAULT 0.00,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- Enable RLS
ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournament players are viewable by everyone" ON tournament_players
  FOR SELECT USING (true);

-- ============================================
-- MATCHES
-- ============================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  external_id TEXT,
  team_home_id UUID REFERENCES cricket_teams(id),
  team_away_id UUID REFERENCES cricket_teams(id),
  venue TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone" ON matches
  FOR SELECT USING (true);

-- ============================================
-- PLAYER MATCH STATS
-- ============================================

CREATE TABLE IF NOT EXISTS player_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  overs_bowled DECIMAL(4,1) DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  catches INTEGER DEFAULT 0,
  stumpings INTEGER DEFAULT 0,
  run_outs INTEGER DEFAULT 0,
  fantasy_points DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Enable RLS
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player match stats are viewable by everyone" ON player_match_stats
  FOR SELECT USING (true);

-- ============================================
-- FANTASY TEAMS
-- ============================================

CREATE TABLE IF NOT EXISTS fantasy_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  players UUID[] NOT NULL DEFAULT '{}',
  captain_id UUID REFERENCES players(id),
  vice_captain_id UUID REFERENCES players(id),
  total_points DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fantasy_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fantasy teams" ON fantasy_teams
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own fantasy teams" ON fantasy_teams
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fantasy teams" ON fantasy_teams
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fantasy teams" ON fantasy_teams
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CONTESTS
-- ============================================

CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tournament', 'match', 'h2h')),
  max_entries INTEGER,
  current_entries INTEGER DEFAULT 0,
  entry_fee INTEGER DEFAULT 0,
  prize_description TEXT,
  is_system_contest BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contests are viewable by everyone" ON contests
  FOR SELECT USING (true);

CREATE POLICY "Users can create contests" ON contests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- CONTEST ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  fantasy_team_id UUID REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER,
  previous_rank INTEGER,
  points DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, fantasy_team_id)
);

-- Enable RLS
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contest entries are viewable by everyone" ON contest_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can create own entries" ON contest_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON contest_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Deferred policy for fantasy_teams (needed contest_entries to exist first)
CREATE POLICY "Users can view fantasy teams in same contests" ON fantasy_teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contest_entries ce1
      JOIN contest_entries ce2 ON ce1.contest_id = ce2.contest_id
      WHERE ce1.fantasy_team_id = fantasy_teams.id
      AND ce2.user_id = auth.uid()
    )
  );

-- Function to update contest entry count
CREATE OR REPLACE FUNCTION update_contest_entry_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contests SET current_entries = current_entries + 1 WHERE id = NEW.contest_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contests SET current_entries = current_entries - 1 WHERE id = OLD.contest_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contest_entry_count_trigger
  AFTER INSERT OR DELETE ON contest_entries
  FOR EACH ROW EXECUTE FUNCTION update_contest_entry_count();

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Achievements can be inserted by system" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tournaments_league ON tournaments(league_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON matches(start_time);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_user ON fantasy_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_fantasy_teams_tournament ON fantasy_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_contests_tournament ON contests(tournament_id);
CREATE INDEX IF NOT EXISTS idx_contests_match ON contests(match_id);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contest_entries_contest ON contest_entries(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_user ON contest_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id);

-- ============================================
-- SEED DATA: DEFAULT LEAGUES
-- ============================================

INSERT INTO leagues (id, name, short_name, type, scoring_rules, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Indian Premier League', 'IPL', 'franchise', 
   '{"runs": 1, "fours": 1, "sixes": 2, "wickets": 25, "catches": 8, "stumpings": 12, "runOuts": 6, "maidens": 8, "halfCentury": 8, "century": 16, "fiveWickets": 16}', 
   true),
  ('22222222-2222-2222-2222-222222222222', 'Caribbean Premier League', 'CPL', 'franchise',
   '{"runs": 1, "fours": 1, "sixes": 2, "wickets": 25, "catches": 8, "stumpings": 12, "runOuts": 6, "maidens": 8, "halfCentury": 8, "century": 16, "fiveWickets": 16}',
   true),
  ('33333333-3333-3333-3333-333333333333', 'International Cricket', 'INTL', 'international',
   '{"runs": 1, "fours": 1, "sixes": 2, "wickets": 25, "catches": 8, "stumpings": 12, "runOuts": 6, "maidens": 8, "halfCentury": 8, "century": 16, "fiveWickets": 16}',
   true),
  ('44444444-4444-4444-4444-444444444444', 'Backyard Cricket League', 'BCL', 'custom',
   '{"runs": 1, "fours": 1, "sixes": 2, "wickets": 20, "catches": 10, "stumpings": 10, "runOuts": 5}',
   true)
ON CONFLICT DO NOTHING;
