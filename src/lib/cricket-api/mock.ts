/**
 * Mock Cricket API Provider
 * For development and testing without hitting real APIs
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
} from './types';

export class MockCricketProvider extends BaseCricketAPIProvider {
  readonly name = 'Mock Provider';
  readonly baseUrl = 'https://mock.api';
  
  constructor() {
    super('mock-api-key');
  }
  
  protected getAuthHeaders(): Record<string, string> {
    return {};
  }
  
  // ==========================================
  // Mock Data
  // ==========================================
  
  private mockTeams: APITeam[] = [
    { id: 'mi', name: 'Mumbai Indians', shortName: 'MI', logoUrl: '/teams/mi.png', country: 'India' },
    { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', logoUrl: '/teams/csk.png', country: 'India' },
    { id: 'rcb', name: 'Royal Challengers Bangalore', shortName: 'RCB', logoUrl: '/teams/rcb.png', country: 'India' },
    { id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', logoUrl: '/teams/kkr.png', country: 'India' },
    { id: 'dc', name: 'Delhi Capitals', shortName: 'DC', logoUrl: '/teams/dc.png', country: 'India' },
    { id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', logoUrl: '/teams/pbks.png', country: 'India' },
    { id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', logoUrl: '/teams/rr.png', country: 'India' },
    { id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', logoUrl: '/teams/srh.png', country: 'India' },
    { id: 'gt', name: 'Gujarat Titans', shortName: 'GT', logoUrl: '/teams/gt.png', country: 'India' },
    { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', logoUrl: '/teams/lsg.png', country: 'India' },
  ];
  
  private mockPlayers: APIPlayer[] = [
    // Mumbai Indians
    { id: 'rohit', name: 'Rohit Sharma', teamId: 'mi', role: 'batsman', battingStyle: 'Right-hand', country: 'India' },
    { id: 'bumrah', name: 'Jasprit Bumrah', teamId: 'mi', role: 'bowler', bowlingStyle: 'Right-arm fast', country: 'India' },
    { id: 'hardik', name: 'Hardik Pandya', teamId: 'mi', role: 'all-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm medium', country: 'India' },
    { id: 'kishan', name: 'Ishan Kishan', teamId: 'mi', role: 'wicket-keeper', battingStyle: 'Left-hand', country: 'India' },
    { id: 'surya', name: 'Suryakumar Yadav', teamId: 'mi', role: 'batsman', battingStyle: 'Right-hand', country: 'India' },
    // Chennai Super Kings
    { id: 'dhoni', name: 'MS Dhoni', teamId: 'csk', role: 'wicket-keeper', battingStyle: 'Right-hand', country: 'India' },
    { id: 'jadeja', name: 'Ravindra Jadeja', teamId: 'csk', role: 'all-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm orthodox', country: 'India' },
    { id: 'gaikwad', name: 'Ruturaj Gaikwad', teamId: 'csk', role: 'batsman', battingStyle: 'Right-hand', country: 'India' },
    { id: 'chahar', name: 'Deepak Chahar', teamId: 'csk', role: 'bowler', bowlingStyle: 'Right-arm medium', country: 'India' },
    // RCB
    { id: 'kohli', name: 'Virat Kohli', teamId: 'rcb', role: 'batsman', battingStyle: 'Right-hand', country: 'India' },
    { id: 'faf', name: 'Faf du Plessis', teamId: 'rcb', role: 'batsman', battingStyle: 'Right-hand', country: 'South Africa' },
    { id: 'siraj', name: 'Mohammed Siraj', teamId: 'rcb', role: 'bowler', bowlingStyle: 'Right-arm fast', country: 'India' },
    { id: 'dk', name: 'Dinesh Karthik', teamId: 'rcb', role: 'wicket-keeper', battingStyle: 'Right-hand', country: 'India' },
    // KKR
    { id: 'shreyas', name: 'Shreyas Iyer', teamId: 'kkr', role: 'batsman', battingStyle: 'Right-hand', country: 'India' },
    { id: 'narine', name: 'Sunil Narine', teamId: 'kkr', role: 'all-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Off-spin', country: 'West Indies' },
    { id: 'russell', name: 'Andre Russell', teamId: 'kkr', role: 'all-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm fast', country: 'West Indies' },
  ];
  
  private mockTournaments: APITournament[] = [
    {
      id: 'ipl-2026',
      name: 'Indian Premier League 2026',
      shortName: 'IPL',
      startDate: new Date('2026-03-22'),
      endDate: new Date('2026-05-28'),
      format: 'T20',
      teams: this.mockTeams,
      matchCount: 74,
    },
    {
      id: 't20-wc-2026',
      name: 'T20 World Cup 2026',
      shortName: 'T20WC',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-30'),
      format: 'T20',
      teams: [],
      matchCount: 45,
    },
  ];
  
  // ==========================================
  // Implementations
  // ==========================================
  
  async getTournaments(options?: GetTournamentsOptions): Promise<APITournament[]> {
    await this.simulateDelay();
    return this.mockTournaments;
  }
  
  async getTournament(tournamentId: string): Promise<APITournament | null> {
    await this.simulateDelay();
    return this.mockTournaments.find((t) => t.id === tournamentId) || null;
  }
  
  async getMatches(options?: GetMatchesOptions): Promise<APIPaginatedResponse<APIMatch>> {
    await this.simulateDelay();
    
    const now = new Date();
    const upcoming = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const live = new Date(now.getTime() - 30 * 60 * 1000); // Started 30 mins ago
    
    const matches: APIMatch[] = [
      {
        id: 'match-1',
        name: 'Mumbai Indians vs Chennai Super Kings',
        format: 'T20',
        status: 'live',
        venue: 'Wankhede Stadium, Mumbai',
        startTime: live,
        teamA: this.mockTeams[0],
        teamB: this.mockTeams[1],
        score: {
          teamA: { runs: 145, wickets: 3, overs: 15.2, runRate: 9.46, innings: 1 },
          teamB: { runs: 0, wickets: 0, overs: 0, runRate: 0, innings: 0 },
        },
      },
      {
        id: 'match-2',
        name: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
        format: 'T20',
        status: 'upcoming',
        venue: 'M. Chinnaswamy Stadium, Bangalore',
        startTime: upcoming,
        teamA: this.mockTeams[2],
        teamB: this.mockTeams[3],
      },
      {
        id: 'match-3',
        name: 'Delhi Capitals vs Punjab Kings',
        format: 'T20',
        status: 'completed',
        venue: 'Arun Jaitley Stadium, Delhi',
        startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        teamA: this.mockTeams[4],
        teamB: this.mockTeams[5],
        result: 'Delhi Capitals won by 5 wickets',
        score: {
          teamA: { runs: 189, wickets: 4, overs: 20, runRate: 9.45, innings: 2 },
          teamB: { runs: 185, wickets: 8, overs: 20, runRate: 9.25, innings: 1 },
        },
      },
    ];
    
    let filtered = matches;
    if (options?.status) {
      filtered = matches.filter((m) => m.status === options.status);
    }
    
    return {
      data: filtered,
      status: 'success',
      timestamp: new Date(),
      pagination: {
        page: 1,
        perPage: 10,
        total: filtered.length,
        totalPages: 1,
      },
    };
  }
  
  async getMatch(matchId: string): Promise<APIMatch | null> {
    await this.simulateDelay();
    const matches = await this.getMatches();
    return matches.data.find((m) => m.id === matchId) || null;
  }
  
  async getLiveMatches(): Promise<APIMatch[]> {
    const matches = await this.getMatches({ status: 'live' });
    return matches.data;
  }
  
  async getLiveScore(matchId: string): Promise<APILiveMatch | null> {
    await this.simulateDelay();
    const match = await this.getMatch(matchId);
    if (!match) return null;
    
    return {
      ...match,
      currentBatsmen: [
        {
          playerId: 'rohit',
          name: 'Rohit Sharma',
          runs: 67,
          balls: 45,
          fours: 6,
          sixes: 4,
          strikeRate: 148.89,
          isOnStrike: true,
        },
        {
          playerId: 'surya',
          name: 'Suryakumar Yadav',
          runs: 42,
          balls: 28,
          fours: 3,
          sixes: 2,
          strikeRate: 150.0,
          isOnStrike: false,
        },
      ],
      currentBowler: {
        playerId: 'chahar',
        name: 'Deepak Chahar',
        overs: 3.2,
        maidens: 0,
        runs: 28,
        wickets: 1,
        economy: 8.4,
      },
      recentOvers: ['1', '4', '0', '6', '1', '2'],
      partnership: { runs: 78, balls: 52 },
    };
  }
  
  async getTeams(tournamentId?: string): Promise<APITeam[]> {
    await this.simulateDelay();
    return this.mockTeams;
  }
  
  async getTeam(teamId: string): Promise<APITeam | null> {
    await this.simulateDelay();
    return this.mockTeams.find((t) => t.id === teamId) || null;
  }
  
  async getPlayers(options?: GetPlayersOptions): Promise<APIPaginatedResponse<APIPlayer>> {
    await this.simulateDelay();
    
    let players = this.mockPlayers;
    
    if (options?.teamId) {
      players = players.filter((p) => p.teamId === options.teamId);
    }
    
    if (options?.role) {
      players = players.filter((p) => p.role === options.role);
    }
    
    if (options?.search) {
      const search = options.search.toLowerCase();
      players = players.filter((p) => p.name.toLowerCase().includes(search));
    }
    
    return {
      data: players,
      status: 'success',
      timestamp: new Date(),
      pagination: {
        page: options?.page || 1,
        perPage: options?.perPage || 20,
        total: players.length,
        totalPages: 1,
      },
    };
  }
  
  async getPlayer(playerId: string): Promise<APIPlayer | null> {
    await this.simulateDelay();
    return this.mockPlayers.find((p) => p.id === playerId) || null;
  }
  
  async getSquad(teamId: string, tournamentId?: string): Promise<APIPlayer[]> {
    const players = await this.getPlayers({ teamId });
    return players.data;
  }
  
  async getPlayerMatchStats(
    matchId: string,
    playerId: string
  ): Promise<APIPlayerMatchStats | null> {
    const allStats = await this.getAllPlayerMatchStats(matchId);
    return allStats.find((s) => s.playerId === playerId) || null;
  }
  
  async getAllPlayerMatchStats(matchId: string): Promise<APIPlayerMatchStats[]> {
    await this.simulateDelay();
    
    return [
      {
        playerId: 'rohit',
        matchId,
        runs: 67,
        ballsFaced: 45,
        fours: 6,
        sixes: 4,
        strikeRate: 148.89,
        isOut: false,
        overs: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
        dotBalls: 0,
        catches: 1,
        stumpings: 0,
        runOutsDirect: 0,
        runOutsAssisted: 0,
      },
      {
        playerId: 'bumrah',
        matchId,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
        overs: 4,
        maidens: 1,
        runsConceded: 22,
        wickets: 3,
        economy: 5.5,
        dotBalls: 12,
        catches: 0,
        stumpings: 0,
        runOutsDirect: 0,
        runOutsAssisted: 0,
      },
    ];
  }
  
  private async simulateDelay(ms: number = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
