/**
 * CricketData.org API Provider
 * Implementation of CricketAPIProvider for CricketData.org
 * 
 * API Documentation: https://cricketdata.org/
 * Free tier: 100 requests/day
 */

import {
  BaseCricketAPIProvider,
  type GetMatchesOptions,
  type GetPlayersOptions,
  type GetTournamentsOptions,
} from './provider';
import type {
  APIMatch,
  APILiveMatch,
  APIPlayer,
  APIPlayerMatchStats,
  APIPaginatedResponse,
  APITeam,
  APITournament,
  MatchFormat,
  MatchStatus,
} from './types';
import { apiCache, cacheKey, CACHE_TTL, withCache } from './cache';

export class CricketDataProvider extends BaseCricketAPIProvider {
  readonly name = 'CricketData.org';
  readonly baseUrl = 'https://api.cricapi.com/v1';
  
  constructor(apiKey?: string) {
    super(apiKey || process.env.CRICKET_API_KEY || '');
  }
  
  protected getAuthHeaders(): Record<string, string> {
    return {};
  }
  
  /**
   * Override fetch to include API key in query params
   * (CricketData.org uses query param authentication)
   */
  protected async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${separator}apikey=${this.apiKey}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // CricketData.org wraps responses in { status, data }
    if (data.status === 'failure') {
      throw new Error(data.reason || 'API request failed');
    }
    
    return data;
  }
  
  // ==========================================
  // Tournaments
  // ==========================================
  
  async getTournaments(options?: GetTournamentsOptions): Promise<APITournament[]> {
    const key = cacheKey('tournaments', options?.status, options?.year);
    
    return withCache(key, CACHE_TTL.TOURNAMENTS, async () => {
      const response = await this.fetch<CricketDataSeriesResponse>('/series');
      return this.mapTournaments(response.data || []);
    });
  }
  
  async getTournament(tournamentId: string): Promise<APITournament | null> {
    const key = cacheKey('tournament', tournamentId);
    
    return withCache(key, CACHE_TTL.TOURNAMENT_DETAILS, async () => {
      const response = await this.fetch<CricketDataSeriesInfoResponse>(
        `/series_info?id=${tournamentId}`
      );
      
      if (!response.data) return null;
      return this.mapTournament(response.data);
    });
  }
  
  // ==========================================
  // Matches
  // ==========================================
  
  async getMatches(options?: GetMatchesOptions): Promise<APIPaginatedResponse<APIMatch>> {
    const key = cacheKey(
      'matches',
      options?.tournamentId,
      options?.status,
      options?.page
    );
    
    return withCache(key, CACHE_TTL.MATCHES_LIST, async () => {
      let endpoint = '/matches';
      const params: string[] = [];
      
      if (options?.tournamentId) {
        endpoint = '/series_info';
        params.push(`id=${options.tournamentId}`);
      }
      
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await this.fetch<CricketDataMatchesResponse>(endpoint + query);
      
      const matches = this.mapMatches(response.data || []);
      
      // Filter by status if specified
      const filtered = options?.status
        ? matches.filter((m) => m.status === options.status)
        : matches;
      
      return {
        data: filtered,
        status: 'success',
        timestamp: new Date(),
        pagination: {
          page: options?.page || 1,
          perPage: options?.perPage || 50,
          total: filtered.length,
          totalPages: 1,
        },
      };
    });
  }
  
  async getMatch(matchId: string): Promise<APIMatch | null> {
    const key = cacheKey('match', matchId);
    
    return withCache(key, CACHE_TTL.MATCH_DETAILS, async () => {
      const response = await this.fetch<CricketDataMatchInfoResponse>(
        `/match_info?id=${matchId}`
      );
      
      if (!response.data) return null;
      return this.mapMatch(response.data);
    });
  }
  
  async getLiveMatches(): Promise<APIMatch[]> {
    const key = 'live-matches';
    
    return withCache(key, CACHE_TTL.LIVE_SCORE, async () => {
      const response = await this.fetch<CricketDataMatchesResponse>('/currentMatches');
      return this.mapMatches(response.data || []).filter((m) => m.status === 'live');
    });
  }
  
  async getLiveScore(matchId: string): Promise<APILiveMatch | null> {
    const key = cacheKey('live-score', matchId);
    
    return withCache(key, CACHE_TTL.LIVE_SCORE, async () => {
      const response = await this.fetch<CricketDataMatchInfoResponse>(
        `/match_info?id=${matchId}`
      );
      
      if (!response.data) return null;
      return this.mapLiveMatch(response.data);
    });
  }
  
  // ==========================================
  // Teams
  // ==========================================
  
  async getTeams(tournamentId?: string): Promise<APITeam[]> {
    const key = cacheKey('teams', tournamentId);
    
    return withCache(key, CACHE_TTL.TEAMS, async () => {
      if (tournamentId) {
        const tournament = await this.getTournament(tournamentId);
        return tournament?.teams || [];
      }
      
      // Get teams from all series
      const response = await this.fetch<CricketDataSeriesResponse>('/series');
      const teams = new Map<string, APITeam>();
      
      for (const series of response.data || []) {
        // Teams would need to be extracted from matches
        // For now, return empty - teams are typically loaded per tournament
      }
      
      return Array.from(teams.values());
    });
  }
  
  async getTeam(teamId: string): Promise<APITeam | null> {
    // CricketData.org doesn't have a dedicated team endpoint
    // Teams are extracted from matches
    const allTeams = await this.getTeams();
    return allTeams.find((t) => t.id === teamId) || null;
  }
  
  // ==========================================
  // Players
  // ==========================================
  
  async getPlayers(options?: GetPlayersOptions): Promise<APIPaginatedResponse<APIPlayer>> {
    const key = cacheKey('players', options?.teamId, options?.search, options?.page);
    
    return withCache(key, CACHE_TTL.PLAYERS_LIST, async () => {
      let endpoint = '/players';
      const params: string[] = [];
      
      if (options?.search) {
        params.push(`search=${encodeURIComponent(options.search)}`);
      }
      
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await this.fetch<CricketDataPlayersResponse>(endpoint + query);
      
      const players = this.mapPlayers(response.data || []);
      
      return {
        data: players,
        status: 'success',
        timestamp: new Date(),
        pagination: {
          page: options?.page || 1,
          perPage: options?.perPage || 50,
          total: players.length,
          totalPages: 1,
        },
      };
    });
  }
  
  async getPlayer(playerId: string): Promise<APIPlayer | null> {
    const key = cacheKey('player', playerId);
    
    return withCache(key, CACHE_TTL.PLAYER_DETAILS, async () => {
      const response = await this.fetch<CricketDataPlayerInfoResponse>(
        `/players_info?id=${playerId}`
      );
      
      if (!response.data) return null;
      return this.mapPlayer(response.data);
    });
  }
  
  async getSquad(teamId: string, tournamentId?: string): Promise<APIPlayer[]> {
    const key = cacheKey('squad', teamId, tournamentId);
    
    return withCache(key, CACHE_TTL.PLAYERS_LIST, async () => {
      // CricketData.org might not have direct squad endpoint
      // Players would need to be extracted from matches
      const playersResponse = await this.getPlayers({ teamId });
      return playersResponse.data;
    });
  }
  
  // ==========================================
  // Statistics
  // ==========================================
  
  async getPlayerMatchStats(
    matchId: string,
    playerId: string
  ): Promise<APIPlayerMatchStats | null> {
    const allStats = await this.getAllPlayerMatchStats(matchId);
    return allStats.find((s) => s.playerId === playerId) || null;
  }
  
  async getAllPlayerMatchStats(matchId: string): Promise<APIPlayerMatchStats[]> {
    const key = cacheKey('player-match-stats', matchId);
    
    return withCache(key, CACHE_TTL.PLAYER_STATS, async () => {
      const response = await this.fetch<CricketDataScorecardResponse>(
        `/match_scorecard?id=${matchId}`
      );
      
      if (!response.data) return [];
      return this.mapPlayerStats(response.data, matchId);
    });
  }
  
  // ==========================================
  // Mappers (CricketData.org format -> Our format)
  // ==========================================
  
  private mapTournaments(data: CricketDataSeries[]): APITournament[] {
    return data.map((s) => this.mapTournament(s));
  }
  
  private mapTournament(s: CricketDataSeries): APITournament {
    return {
      id: s.id,
      name: s.name,
      shortName: s.name.split(' ')[0] || s.name,
      startDate: new Date(s.startDate || Date.now()),
      endDate: new Date(s.endDate || Date.now()),
      format: this.mapFormat(s.matches?.[0]?.matchType),
      teams: [],
      matchCount: s.matches?.length || 0,
    };
  }
  
  private mapMatches(data: CricketDataMatch[]): APIMatch[] {
    return data.map((m) => this.mapMatch(m));
  }
  
  private mapMatch(m: CricketDataMatch): APIMatch {
    return {
      id: m.id,
      name: m.name || `${m.teams?.[0]} vs ${m.teams?.[1]}`,
      format: this.mapFormat(m.matchType),
      status: this.mapStatus(m.status, m.matchStarted, m.matchEnded),
      venue: m.venue || 'TBD',
      startTime: new Date(m.dateTimeGMT || m.date || Date.now()),
      teamA: {
        id: m.teamInfo?.[0]?.id || m.teams?.[0] || 'team-a',
        name: m.teamInfo?.[0]?.name || m.teams?.[0] || 'Team A',
        shortName: m.teamInfo?.[0]?.shortname || m.teams?.[0]?.substring(0, 3) || 'TMA',
        logoUrl: m.teamInfo?.[0]?.img,
      },
      teamB: {
        id: m.teamInfo?.[1]?.id || m.teams?.[1] || 'team-b',
        name: m.teamInfo?.[1]?.name || m.teams?.[1] || 'Team B',
        shortName: m.teamInfo?.[1]?.shortname || m.teams?.[1]?.substring(0, 3) || 'TMB',
        logoUrl: m.teamInfo?.[1]?.img,
      },
      result: m.status,
      score: m.score
        ? {
            teamA: {
              runs: m.score[0]?.r || 0,
              wickets: m.score[0]?.w || 0,
              overs: m.score[0]?.o || 0,
              runRate: 0,
              innings: m.score[0]?.inning || 1,
            },
            teamB: {
              runs: m.score[1]?.r || 0,
              wickets: m.score[1]?.w || 0,
              overs: m.score[1]?.o || 0,
              runRate: 0,
              innings: m.score[1]?.inning || 1,
            },
          }
        : undefined,
    };
  }
  
  private mapLiveMatch(m: CricketDataMatch): APILiveMatch {
    const baseMatch = this.mapMatch(m);
    return {
      ...baseMatch,
      currentBatsmen: [],
      currentBowler: {
        playerId: '',
        name: '',
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
      },
      recentOvers: [],
    };
  }
  
  private mapPlayers(data: CricketDataPlayer[]): APIPlayer[] {
    return data.map((p) => this.mapPlayer(p));
  }
  
  private mapPlayer(p: CricketDataPlayer): APIPlayer {
    return {
      id: p.id,
      name: p.name,
      teamId: '',
      role: this.mapRole(p.role),
      battingStyle: p.battingStyle,
      bowlingStyle: p.bowlingStyle,
      imageUrl: p.playerImg,
      country: p.country,
    };
  }
  
  private mapPlayerStats(
    scorecard: CricketDataScorecard,
    matchId: string
  ): APIPlayerMatchStats[] {
    const stats: APIPlayerMatchStats[] = [];
    
    // Process batting innings
    for (const batting of scorecard.batting || []) {
      const existing = stats.find((s) => s.playerId === batting.player_id);
      const battingStats = {
        runs: batting.r || 0,
        ballsFaced: batting.b || 0,
        fours: batting['4s'] || 0,
        sixes: batting['6s'] || 0,
        strikeRate: batting.sr || 0,
        isOut: batting.dismissal !== 'not out',
        dismissalType: batting.dismissal,
      };
      
      if (existing) {
        Object.assign(existing, battingStats);
      } else {
        stats.push({
          playerId: batting.player_id,
          matchId,
          ...battingStats,
          overs: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0,
          dotBalls: 0,
          catches: 0,
          stumpings: 0,
          runOutsDirect: 0,
          runOutsAssisted: 0,
        });
      }
    }
    
    // Process bowling innings
    for (const bowling of scorecard.bowling || []) {
      const existing = stats.find((s) => s.playerId === bowling.player_id);
      const bowlingStats = {
        overs: bowling.o || 0,
        maidens: bowling.m || 0,
        runsConceded: bowling.r || 0,
        wickets: bowling.w || 0,
        economy: bowling.eco || 0,
        dotBalls: 0,
      };
      
      if (existing) {
        Object.assign(existing, bowlingStats);
      } else {
        stats.push({
          playerId: bowling.player_id,
          matchId,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
          ...bowlingStats,
          catches: 0,
          stumpings: 0,
          runOutsDirect: 0,
          runOutsAssisted: 0,
        });
      }
    }
    
    return stats;
  }
  
  private mapFormat(type?: string): MatchFormat {
    if (!type) return 'T20';
    const lower = type.toLowerCase();
    if (lower.includes('t20')) return 'T20';
    if (lower.includes('odi') || lower.includes('one day')) return 'ODI';
    if (lower.includes('test')) return 'Test';
    return 'T20';
  }
  
  private mapStatus(
    status?: string,
    started?: boolean,
    ended?: boolean
  ): MatchStatus {
    if (ended) return 'completed';
    if (started) return 'live';
    if (status?.toLowerCase().includes('live')) return 'live';
    if (status?.toLowerCase().includes('result') || status?.toLowerCase().includes('won'))
      return 'completed';
    return 'upcoming';
  }
  
  private mapRole(
    role?: string
  ): 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper' {
    if (!role) return 'batsman';
    const lower = role.toLowerCase();
    if (lower.includes('keeper') || lower.includes('wk')) return 'wicket-keeper';
    if (lower.includes('all') || lower.includes('rounder')) return 'all-rounder';
    if (lower.includes('bowl')) return 'bowler';
    return 'batsman';
  }
}

// ==========================================
// CricketData.org Response Types
// ==========================================

interface CricketDataSeriesResponse {
  status: string;
  data?: CricketDataSeries[];
}

interface CricketDataSeriesInfoResponse {
  status: string;
  data?: CricketDataSeries;
}

interface CricketDataMatchesResponse {
  status: string;
  data?: CricketDataMatch[];
}

interface CricketDataMatchInfoResponse {
  status: string;
  data?: CricketDataMatch;
}

interface CricketDataPlayersResponse {
  status: string;
  data?: CricketDataPlayer[];
}

interface CricketDataPlayerInfoResponse {
  status: string;
  data?: CricketDataPlayer;
}

interface CricketDataScorecardResponse {
  status: string;
  data?: CricketDataScorecard;
}

interface CricketDataSeries {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  matches?: CricketDataMatch[];
}

interface CricketDataMatch {
  id: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: Array<{
    id: string;
    name: string;
    shortname: string;
    img?: string;
  }>;
  score?: Array<{
    r: number;
    w: number;
    o: number;
    inning?: number;
  }>;
  matchStarted?: boolean;
  matchEnded?: boolean;
}

interface CricketDataPlayer {
  id: string;
  name: string;
  country?: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerImg?: string;
}

interface CricketDataScorecard {
  batting?: Array<{
    player_id: string;
    r: number;
    b: number;
    '4s': number;
    '6s': number;
    sr: number;
    dismissal: string;
  }>;
  bowling?: Array<{
    player_id: string;
    o: number;
    m: number;
    r: number;
    w: number;
    eco: number;
  }>;
}
