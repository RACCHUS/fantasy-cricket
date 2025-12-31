/**
 * Cricket API Types
 * Types for external cricket data API responses
 */

// Match status types
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type MatchFormat = 'T20' | 'ODI' | 'Test';

// Team information from API
export interface APITeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  country?: string;
}

// Player information from API
export interface APIPlayer {
  id: string;
  name: string;
  teamId: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: string;
  bowlingStyle?: string;
  imageUrl?: string;
  country?: string;
}

// Match information from API
export interface APIMatch {
  id: string;
  name: string;
  format: MatchFormat;
  status: MatchStatus;
  venue: string;
  startTime: Date;
  teamA: APITeam;
  teamB: APITeam;
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
  result?: string;
  // Current score (if live or completed)
  score?: {
    teamA: APIScorecard;
    teamB: APIScorecard;
  };
}

// Scorecard for a team
export interface APIScorecard {
  runs: number;
  wickets: number;
  overs: number;
  runRate: number;
  innings: number;
}

// Live match details
export interface APILiveMatch extends APIMatch {
  currentBatsmen: APIBatsmanLive[];
  currentBowler: APIBowlerLive;
  recentOvers: string[]; // e.g., ["1", "4", "W", "0", "6", "2"]
  lastWicket?: string;
  partnership?: {
    runs: number;
    balls: number;
  };
}

// Current batsman stats (live)
export interface APIBatsmanLive {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOnStrike: boolean;
}

// Current bowler stats (live)
export interface APIBowlerLive {
  playerId: string;
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

// Player match statistics (for fantasy points calculation)
export interface APIPlayerMatchStats {
  playerId: string;
  matchId: string;
  
  // Batting
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalType?: string;
  
  // Bowling
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  dotBalls: number;
  
  // Fielding
  catches: number;
  stumpings: number;
  runOutsDirect: number;
  runOutsAssisted: number;
}

// Tournament/Series information
export interface APITournament {
  id: string;
  name: string;
  shortName: string;
  startDate: Date;
  endDate: Date;
  format: MatchFormat;
  teams: APITeam[];
  matchCount: number;
}

// API response wrappers
export interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: Date;
}

export interface APIPaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Cache metadata
export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  key: string;
}

// Rate limit info
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}
