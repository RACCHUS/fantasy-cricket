/**
 * Cricket API Provider Interface
 * Abstract interface for swappable cricket data providers
 * 
 * Implementations:
 * - CricketDataProvider (CricketData.org)
 * - SportmonksProvider (Sportmonks API)
 * - MockProvider (for testing/development)
 */

import type {
  APIMatch,
  APILiveMatch,
  APIPlayer,
  APIPlayerMatchStats,
  APITeam,
  APITournament,
  APIPaginatedResponse,
  RateLimitInfo,
} from './types';

export interface CricketAPIProvider {
  readonly name: string;
  readonly baseUrl: string;
  
  // Rate limiting
  getRateLimitInfo(): RateLimitInfo;
  
  // Tournaments/Series
  getTournaments(options?: GetTournamentsOptions): Promise<APITournament[]>;
  getTournament(tournamentId: string): Promise<APITournament | null>;
  
  // Matches
  getMatches(options?: GetMatchesOptions): Promise<APIPaginatedResponse<APIMatch>>;
  getMatch(matchId: string): Promise<APIMatch | null>;
  getLiveMatches(): Promise<APIMatch[]>;
  getLiveScore(matchId: string): Promise<APILiveMatch | null>;
  
  // Teams
  getTeams(tournamentId?: string): Promise<APITeam[]>;
  getTeam(teamId: string): Promise<APITeam | null>;
  
  // Players
  getPlayers(options?: GetPlayersOptions): Promise<APIPaginatedResponse<APIPlayer>>;
  getPlayer(playerId: string): Promise<APIPlayer | null>;
  getSquad(teamId: string, tournamentId?: string): Promise<APIPlayer[]>;
  
  // Statistics
  getPlayerMatchStats(matchId: string, playerId: string): Promise<APIPlayerMatchStats | null>;
  getAllPlayerMatchStats(matchId: string): Promise<APIPlayerMatchStats[]>;
}

// Query options
export interface GetTournamentsOptions {
  status?: 'upcoming' | 'live' | 'completed';
  format?: 'T20' | 'ODI' | 'Test';
  year?: number;
  limit?: number;
}

export interface GetMatchesOptions {
  tournamentId?: string;
  teamId?: string;
  status?: 'upcoming' | 'live' | 'completed';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  perPage?: number;
}

export interface GetPlayersOptions {
  teamId?: string;
  tournamentId?: string;
  role?: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  search?: string;
  page?: number;
  perPage?: number;
}

/**
 * Base class with common functionality
 */
export abstract class BaseCricketAPIProvider implements CricketAPIProvider {
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  
  protected apiKey: string;
  protected rateLimitRemaining: number = 100;
  protected rateLimitReset: Date = new Date();
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  getRateLimitInfo(): RateLimitInfo {
    return {
      remaining: this.rateLimitRemaining,
      limit: 100,
      resetAt: this.rateLimitReset,
    };
  }
  
  /**
   * Make an authenticated API request
   */
  protected async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });
    
    // Update rate limit info from headers
    this.updateRateLimitFromHeaders(response.headers);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new CricketAPIError(
        error.message || `API request failed: ${response.status}`,
        response.status,
        error.code
      );
    }
    
    return response.json();
  }
  
  /**
   * Get authentication headers (override in subclass)
   */
  protected abstract getAuthHeaders(): Record<string, string>;
  
  /**
   * Update rate limit info from response headers
   */
  protected updateRateLimitFromHeaders(headers: Headers): void {
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    
    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining, 10);
    }
    if (reset) {
      this.rateLimitReset = new Date(parseInt(reset, 10) * 1000);
    }
  }
  
  // Abstract methods to be implemented by providers
  abstract getTournaments(options?: GetTournamentsOptions): Promise<APITournament[]>;
  abstract getTournament(tournamentId: string): Promise<APITournament | null>;
  abstract getMatches(options?: GetMatchesOptions): Promise<APIPaginatedResponse<APIMatch>>;
  abstract getMatch(matchId: string): Promise<APIMatch | null>;
  abstract getLiveMatches(): Promise<APIMatch[]>;
  abstract getLiveScore(matchId: string): Promise<APILiveMatch | null>;
  abstract getTeams(tournamentId?: string): Promise<APITeam[]>;
  abstract getTeam(teamId: string): Promise<APITeam | null>;
  abstract getPlayers(options?: GetPlayersOptions): Promise<APIPaginatedResponse<APIPlayer>>;
  abstract getPlayer(playerId: string): Promise<APIPlayer | null>;
  abstract getSquad(teamId: string, tournamentId?: string): Promise<APIPlayer[]>;
  abstract getPlayerMatchStats(matchId: string, playerId: string): Promise<APIPlayerMatchStats | null>;
  abstract getAllPlayerMatchStats(matchId: string): Promise<APIPlayerMatchStats[]>;
}

/**
 * Custom error class for API errors
 */
export class CricketAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'CricketAPIError';
  }
}
