-- ==========================================
-- Fantasy Cricket Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES TABLE
-- Extended user profile linked to auth.users
-- ==========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_contests INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (for leaderboards, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ==========================================
-- FUNCTION: Handle new user signup
-- Creates a profile when a new user signs up
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- FUNCTION: Update updated_at timestamp
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- LEAGUES TABLE
-- ==========================================
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  country TEXT,
  league_type TEXT NOT NULL CHECK (league_type IN ('domestic', 'international', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Everyone can view leagues
CREATE POLICY "Leagues are viewable by everyone"
  ON leagues FOR SELECT
  USING (true);

-- ==========================================
-- TOURNAMENTS TABLE
-- ==========================================
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tournaments_league ON tournaments(league_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Everyone can view tournaments
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (true);

-- ==========================================
-- TEAMS TABLE (Cricket Teams)
-- ==========================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Everyone can view teams
CREATE POLICY "Teams are viewable by everyone"
  ON teams FOR SELECT
  USING (true);

-- ==========================================
-- PLAYERS TABLE
-- ==========================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  role TEXT NOT NULL CHECK (role IN ('batsman', 'bowler', 'all-rounder', 'wicket-keeper')),
  batting_style TEXT,
  bowling_style TEXT,
  image_url TEXT,
  credit_value DECIMAL(3,1) NOT NULL DEFAULT 8.0,
  is_playing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_role ON players(role);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Everyone can view players
CREATE POLICY "Players are viewable by everyone"
  ON players FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- MATCHES TABLE
-- ==========================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_a_id UUID REFERENCES teams(id) NOT NULL,
  team_b_id UUID REFERENCES teams(id) NOT NULL,
  venue TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('T20', 'ODI', 'Test')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  result TEXT,
  team_a_score TEXT,
  team_b_score TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Everyone can view matches
CREATE POLICY "Matches are viewable by everyone"
  ON matches FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- PLAYER_STATS TABLE (Per-match stats)
-- ==========================================
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  
  -- Batting stats
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  is_out BOOLEAN DEFAULT false,
  
  -- Bowling stats
  overs_bowled DECIMAL(4,1) DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  dot_balls INTEGER DEFAULT 0,
  
  -- Fielding stats
  catches INTEGER DEFAULT 0,
  stumpings INTEGER DEFAULT 0,
  run_outs_direct INTEGER DEFAULT 0,
  run_outs_indirect INTEGER DEFAULT 0,
  
  -- Calculated points
  fantasy_points DECIMAL(6,1) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(player_id, match_id)
);

-- Indexes
CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_match ON player_stats(match_id);

-- Enable RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view player stats
CREATE POLICY "Player stats are viewable by everyone"
  ON player_stats FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- CONTESTS TABLE
-- ==========================================
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contest_type TEXT NOT NULL CHECK (contest_type IN ('mega', 'head-to-head', 'practice', 'private')),
  entry_fee INTEGER DEFAULT 0,
  prize_pool INTEGER DEFAULT 0,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'live', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contests_match ON contests(match_id);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_type ON contests(contest_type);

-- Enable RLS
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Everyone can view public contests
CREATE POLICY "Public contests are viewable by everyone"
  ON contests FOR SELECT
  USING (contest_type != 'private' OR created_by = auth.uid());

-- Authenticated users can create contests
CREATE POLICY "Authenticated users can create contests"
  ON contests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- FANTASY_TEAMS TABLE
-- ==========================================
CREATE TABLE fantasy_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES players(id),
  vice_captain_id UUID REFERENCES players(id),
  total_credits DECIMAL(4,1) NOT NULL,
  total_points DECIMAL(8,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fantasy_teams_user ON fantasy_teams(user_id);
CREATE INDEX idx_fantasy_teams_match ON fantasy_teams(match_id);

-- Enable RLS
ALTER TABLE fantasy_teams ENABLE ROW LEVEL SECURITY;

-- Users can view their own teams
CREATE POLICY "Users can view their own fantasy teams"
  ON fantasy_teams FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own teams
CREATE POLICY "Users can create their own fantasy teams"
  ON fantasy_teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own teams
CREATE POLICY "Users can update their own fantasy teams"
  ON fantasy_teams FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own teams
CREATE POLICY "Users can delete their own fantasy teams"
  ON fantasy_teams FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER fantasy_teams_updated_at
  BEFORE UPDATE ON fantasy_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FANTASY_TEAM_PLAYERS (Junction table)
-- ==========================================
CREATE TABLE fantasy_team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fantasy_team_id UUID REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  
  UNIQUE(fantasy_team_id, player_id)
);

-- Indexes
CREATE INDEX idx_ftp_team ON fantasy_team_players(fantasy_team_id);
CREATE INDEX idx_ftp_player ON fantasy_team_players(player_id);

-- Enable RLS
ALTER TABLE fantasy_team_players ENABLE ROW LEVEL SECURITY;

-- Users can manage their own team players (via fantasy_teams ownership)
CREATE POLICY "Users can view their team players"
  ON fantasy_team_players FOR SELECT
  USING (
    fantasy_team_id IN (
      SELECT id FROM fantasy_teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add players to their teams"
  ON fantasy_team_players FOR INSERT
  WITH CHECK (
    fantasy_team_id IN (
      SELECT id FROM fantasy_teams WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove players from their teams"
  ON fantasy_team_players FOR DELETE
  USING (
    fantasy_team_id IN (
      SELECT id FROM fantasy_teams WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- CONTEST_ENTRIES TABLE
-- ==========================================
CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  fantasy_team_id UUID REFERENCES fantasy_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER,
  points DECIMAL(8,1) DEFAULT 0,
  prize_won INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contest_id, user_id) -- One entry per user per contest
);

-- Indexes
CREATE INDEX idx_contest_entries_contest ON contest_entries(contest_id);
CREATE INDEX idx_contest_entries_user ON contest_entries(user_id);
CREATE INDEX idx_contest_entries_rank ON contest_entries(rank);

-- Enable RLS
ALTER TABLE contest_entries ENABLE ROW LEVEL SECURITY;

-- Users can view all entries in contests they're part of
CREATE POLICY "Users can view contest entries"
  ON contest_entries FOR SELECT
  USING (true);

-- Users can create entries for themselves
CREATE POLICY "Users can create contest entries"
  ON contest_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- SEED DATA: Default Leagues
-- ==========================================
INSERT INTO leagues (name, short_name, league_type, country) VALUES
  ('Indian Premier League', 'IPL', 'domestic', 'India'),
  ('International Cricket', 'INT', 'international', NULL),
  ('Caribbean Premier League', 'CPL', 'domestic', 'Caribbean'),
  ('Backyard Cricket', 'BYC', 'custom', NULL);
