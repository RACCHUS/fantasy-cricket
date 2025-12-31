// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  contestsPlayed: number;
  createdAt: string;
}

// ============================================
// LEAGUE & TOURNAMENT TYPES
// ============================================

export type LeagueType = 'franchise' | 'international' | 'custom';

export interface League {
  id: string;
  name: string;
  shortName: string;
  type: LeagueType;
  logoUrl: string | null;
  scoringRules: ScoringRules;
  isActive: boolean;
}

export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface Tournament {
  id: string;
  leagueId: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  config: TournamentConfig;
}

export interface TournamentConfig {
  budget: number;
  maxPlayersPerTeam: number;
  minPerRole: Record<PlayerRole, number>;
  maxPerRole: Record<PlayerRole, number>;
}

// ============================================
// PLAYER TYPES
// ============================================

export type PlayerRole = 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';

export interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
  imageUrl?: string | null;
  country?: string;
  role: PlayerRole;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  teamId?: string;
  teamName?: string;
  isActive?: boolean;
  // Fantasy-specific fields
  credits: number;
  points?: number;
}

export interface TournamentPlayer extends Player {
  price: number;
  formRating: number;
  teamName: string;
  teamShortName: string;
}

// ============================================
// CRICKET TEAM TYPES
// ============================================

export interface CricketTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  country: string;
  leagueId: string;
}

// ============================================
// MATCH TYPES
// ============================================

export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface Match {
  id: string;
  tournamentId: string;
  externalId: string | null;
  teamHomeId: string;
  teamAwayId: string;
  teamHome?: CricketTeam;
  teamAway?: CricketTeam;
  venue: string;
  startTime: string;
  status: MatchStatus;
  result: MatchResult | null;
}

export interface MatchResult {
  winnerId: string | null;
  homeScore: string;
  awayScore: string;
  summary: string;
}

export interface PlayerMatchStats {
  id: string;
  matchId: string;
  playerId: string;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens: number;
  catches: number;
  stumpings: number;
  runOuts: number;
  fantasyPoints: number;
}

// ============================================
// FANTASY TEAM TYPES
// ============================================

export interface FantasyTeam {
  id: string;
  userId: string;
  tournamentId: string;
  name: string;
  players: string[]; // Array of player IDs
  captainId: string;
  viceCaptainId: string;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONTEST TYPES
// ============================================

export type ContestType = 'tournament' | 'match' | 'h2h';
export type ContestStatus = 'upcoming' | 'live' | 'completed';

export interface Contest {
  id: string;
  tournamentId: string;
  matchId: string | null;
  name: string;
  type: ContestType;
  maxEntries: number | null;
  currentEntries: number;
  entryFee: number;
  isSystemContest: boolean;
  status: ContestStatus;
  startTime?: string;
  endTime?: string;
  prizeDescription?: string;
  createdAt: string;
  // Joined data
  match?: {
    teamHome: string;
    teamAway: string;
    startTime: string;
  };
}

export interface ContestEntry {
  id: string;
  contestId: string;
  fantasyTeamId: string;
  fantasyTeam?: FantasyTeam;
  userId: string;
  rank: number | null;
  previousRank?: number | null;
  points: number;
  createdAt: string;
  user?: User;
}

export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  teamName: string;
  points: number;
  isCurrentUser: boolean;
}

// ============================================
// SCORING TYPES
// ============================================

export interface ScoringRules {
  batting: {
    run: number;
    four: number;
    six: number;
    halfCentury: number;
    century: number;
    duck: number;
    strikeRateBonus: { threshold: number; points: number };
    strikeRatePenalty: { threshold: number; points: number };
  };
  bowling: {
    wicket: number;
    maiden: number;
    threeWickets: number;
    fiveWickets: number;
    economyBonus: { threshold: number; points: number };
    economyPenalty: { threshold: number; points: number };
  };
  fielding: {
    catch: number;
    stumping: number;
    runOutDirect: number;
    runOutAssist: number;
  };
  multipliers: {
    captain: number;
    viceCaptain: number;
  };
}

// ============================================
// UI TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export type Theme = 'dark' | 'light' | 'system';
