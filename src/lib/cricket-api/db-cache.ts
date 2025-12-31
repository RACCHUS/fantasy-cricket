/**
 * Database-backed Cache for Cricket API
 * 
 * Pattern: Cache-Aside with Smart Staleness
 * - Check DB first (fast)
 * - If missing: fetch API → save to DB → return
 * - If stale: return DB data immediately, refresh in background
 * - If completed/historical: never refetch
 */

import { createClient } from '@/lib/supabase/server';
import { CricketDataProvider } from './cricketdata';
import { MockCricketProvider } from './mock';
import type { CricketAPIProvider } from './provider';
import type { 
  APIMatch, 
  APIPlayer, 
  APITournament 
} from './types';

// Get the API provider (avoid circular dependency with index.ts)
function getAPIProvider(): CricketAPIProvider {
  const apiKey = process.env.CRICKET_API_KEY;
  const useMock = !apiKey || 
    process.env.USE_MOCK_CRICKET_API === 'true' || 
    process.env.NODE_ENV === 'test';
  
  return useMock ? new MockCricketProvider() : new CricketDataProvider(apiKey);
}

// Staleness thresholds in milliseconds
const STALENESS = {
  TOURNAMENT_ACTIVE: 6 * 60 * 60 * 1000,      // 6 hours for active tournaments
  TOURNAMENT_COMPLETED: Infinity,              // Never refetch completed
  MATCH_UPCOMING: 60 * 60 * 1000,             // 1 hour for upcoming
  MATCH_LIVE: 30 * 1000,                       // 30 seconds for live
  MATCH_COMPLETED: Infinity,                   // Never refetch completed
  PLAYER: 24 * 60 * 60 * 1000,                // 24 hours for player info
  TEAM: 7 * 24 * 60 * 60 * 1000,              // 7 days for teams
} as const;

interface CacheMetadata {
  last_synced_at: string;
  api_id: string;
}

/**
 * Check if data is stale based on its type and status
 */
function isStale(
  lastSynced: Date | null, 
  stalenessMs: number
): boolean {
  if (!lastSynced) return true;
  if (stalenessMs === Infinity) return false;
  return Date.now() - lastSynced.getTime() > stalenessMs;
}

/**
 * Get staleness threshold based on match status
 */
function getMatchStaleness(status: string): number {
  switch (status) {
    case 'completed':
      return STALENESS.MATCH_COMPLETED;
    case 'live':
      return STALENESS.MATCH_LIVE;
    default:
      return STALENESS.MATCH_UPCOMING;
  }
}

// ============================================
// TOURNAMENTS
// ============================================

export async function getTournamentsCached(): Promise<APITournament[]> {
  const supabase = await createClient();
  
  // Check DB first
  const { data: dbTournaments, error } = await supabase
    .from('tournaments')
    .select('*, leagues(*)')
    .order('start_date', { ascending: false });
  
  if (error) {
    console.error('DB error fetching tournaments:', error);
  }
  
  // If we have data and it's fresh enough, return it
  if (dbTournaments && dbTournaments.length > 0) {
    const newest = dbTournaments[0];
    const lastSynced = newest.last_synced_at ? new Date(newest.last_synced_at) : null;
    
    // Check if any active tournament is stale
    const hasStaleActive = dbTournaments.some(t => {
      if (t.status === 'completed') return false;
      const synced = t.last_synced_at ? new Date(t.last_synced_at) : null;
      return isStale(synced, STALENESS.TOURNAMENT_ACTIVE);
    });
    
    if (!hasStaleActive) {
      // Return cached data, all fresh
      return mapDbTournamentsToApi(dbTournaments);
    }
    
    // Have data but some is stale - return immediately, refresh in background
    refreshTournamentsInBackground();
    return mapDbTournamentsToApi(dbTournaments);
  }
  
  // No data in DB - fetch from API and save
  return await fetchAndSaveTournaments();
}

async function fetchAndSaveTournaments(): Promise<APITournament[]> {
  try {
    const apiData = await getAPIProvider().getTournaments();
    await saveTournamentsToDb(apiData);
    return apiData;
  } catch (error) {
    console.error('Failed to fetch tournaments from API:', error);
    return [];
  }
}

async function saveTournamentsToDb(tournaments: APITournament[]): Promise<void> {
  const supabase = await createClient();
  
  for (const tournament of tournaments) {
    // First, ensure the league exists
    const leagueId = await getOrCreateLeague(tournament);
    
    // Determine status from dates
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const status = now < startDate ? 'upcoming' : now > endDate ? 'completed' : 'active';
    
    // Upsert tournament
    await supabase
      .from('tournaments')
      .upsert({
        id: tournament.id,
        league_id: leagueId,
        name: tournament.name,
        season: new Date().getFullYear().toString(),
        start_date: tournament.startDate,
        end_date: tournament.endDate,
        status: status,
        config: {
          budget: 100,
          maxPlayersPerTeam: 11,
        },
        last_synced_at: new Date().toISOString(),
        api_id: tournament.id,
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
  }
}

async function getOrCreateLeague(tournament: APITournament): Promise<string> {
  const supabase = await createClient();
  
  // Determine league type from tournament name
  const leagueInfo = inferLeagueFromTournament(tournament);
  
  // Check if league exists
  const { data: existing } = await supabase
    .from('leagues')
    .select('id')
    .eq('short_name', leagueInfo.shortName)
    .single();
  
  if (existing) return existing.id;
  
  // Create new league
  const { data: newLeague, error } = await supabase
    .from('leagues')
    .insert({
      name: leagueInfo.name,
      short_name: leagueInfo.shortName,
      type: leagueInfo.type,
      is_active: true,
    })
    .select('id')
    .single();
  
  if (error || !newLeague) {
    // Fallback to a default league
    const { data: defaultLeague } = await supabase
      .from('leagues')
      .select('id')
      .eq('short_name', 'INTL')
      .single();
    return defaultLeague?.id || '33333333-3333-3333-3333-333333333333';
  }
  
  return newLeague.id;
}

function inferLeagueFromTournament(tournament: APITournament): {
  name: string;
  shortName: string;
  type: 'franchise' | 'international' | 'custom';
} {
  const name = tournament.name.toLowerCase();
  
  if (name.includes('ipl') || name.includes('indian premier')) {
    return { name: 'Indian Premier League', shortName: 'IPL', type: 'franchise' };
  }
  if (name.includes('cpl') || name.includes('caribbean')) {
    return { name: 'Caribbean Premier League', shortName: 'CPL', type: 'franchise' };
  }
  if (name.includes('bbl') || name.includes('big bash')) {
    return { name: 'Big Bash League', shortName: 'BBL', type: 'franchise' };
  }
  if (name.includes('psl') || name.includes('pakistan super')) {
    return { name: 'Pakistan Super League', shortName: 'PSL', type: 'franchise' };
  }
  if (name.includes('world cup') || name.includes('t20i') || name.includes('odi') || name.includes('test')) {
    return { name: 'International Cricket', shortName: 'INTL', type: 'international' };
  }
  
  // Default to international
  return { name: 'International Cricket', shortName: 'INTL', type: 'international' };
}

function mapTournamentStatus(status: string): 'upcoming' | 'active' | 'completed' {
  const s = status.toLowerCase();
  if (s.includes('live') || s.includes('ongoing') || s.includes('active')) return 'active';
  if (s.includes('completed') || s.includes('finished') || s.includes('ended')) return 'completed';
  return 'upcoming';
}

function mapDbTournamentsToApi(dbTournaments: any[]): APITournament[] {
  return dbTournaments.map(t => ({
    id: t.api_id || t.id,
    name: t.name,
    shortName: t.leagues?.short_name || t.name.substring(0, 3).toUpperCase(),
    startDate: new Date(t.start_date),
    endDate: new Date(t.end_date),
    format: 'T20' as const,
    teams: [],
    matchCount: 0,
  }));
}

// Background refresh (non-blocking)
function refreshTournamentsInBackground(): void {
  // Fire and forget
  fetchAndSaveTournaments().catch(err => 
    console.error('Background tournament refresh failed:', err)
  );
}

// ============================================
// MATCHES
// ============================================

export async function getMatchesCached(
  tournamentId?: string,
  status?: string
): Promise<APIMatch[]> {
  const supabase = await createClient();
  
  // Build query
  let query = supabase
    .from('matches')
    .select(`
      *,
      team_home:cricket_teams!matches_team_home_id_fkey(*),
      team_away:cricket_teams!matches_team_away_id_fkey(*)
    `)
    .order('start_time', { ascending: true });
  
  if (tournamentId) {
    query = query.eq('tournament_id', tournamentId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data: dbMatches, error } = await query;
  
  if (error) {
    console.error('DB error fetching matches:', error);
  }
  
  // Check staleness
  if (dbMatches && dbMatches.length > 0) {
    const hasStale = dbMatches.some(m => {
      const synced = m.last_synced_at ? new Date(m.last_synced_at) : null;
      const staleness = getMatchStaleness(m.status);
      return isStale(synced, staleness);
    });
    
    if (!hasStale) {
      return mapDbMatchesToApi(dbMatches);
    }
    
    // Return stale data, refresh in background
    refreshMatchesInBackground(tournamentId);
    return mapDbMatchesToApi(dbMatches);
  }
  
  // No cached data - fetch from API
  return await fetchAndSaveMatches(tournamentId);
}

async function fetchAndSaveMatches(tournamentId?: string): Promise<APIMatch[]> {
  try {
    const apiResponse = await getAPIProvider().getMatches({ 
      tournamentId 
    });
    const matches = apiResponse.data || [];
    await saveMatchesToDb(matches, tournamentId);
    return matches;
  } catch (error) {
    console.error('Failed to fetch matches from API:', error);
    return [];
  }
}

async function saveMatchesToDb(
  matches: APIMatch[], 
  tournamentId?: string
): Promise<void> {
  const supabase = await createClient();
  
  for (const match of matches) {
    // Ensure teams exist
    const homeTeamId = await getOrCreateTeam(match.teamA);
    const awayTeamId = await getOrCreateTeam(match.teamB);
    
    await supabase
      .from('matches')
      .upsert({
        id: match.id,
        tournament_id: tournamentId,
        external_id: match.id,
        team_home_id: homeTeamId,
        team_away_id: awayTeamId,
        venue: match.venue,
        start_time: match.startTime,
        status: mapMatchStatus(match.status),
        result: match.result ? { summary: match.result } : null,
        last_synced_at: new Date().toISOString(),
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
  }
}

async function getOrCreateTeam(team: { id: string; name: string; shortName?: string }): Promise<string> {
  if (!team) return '';
  
  const supabase = await createClient();
  
  // Check if exists
  const { data: existing } = await supabase
    .from('cricket_teams')
    .select('id')
    .eq('external_id', team.id)
    .single();
  
  if (existing) return existing.id;
  
  // Create
  const { data: newTeam, error } = await supabase
    .from('cricket_teams')
    .insert({
      name: team.name,
      short_name: team.shortName || team.name.substring(0, 3).toUpperCase(),
      external_id: team.id,
    })
    .select('id')
    .single();
  
  if (error || !newTeam) {
    console.error('Failed to create team:', error);
    return team.id; // Return API ID as fallback
  }
  
  return newTeam.id;
}

function mapMatchStatus(status: string): 'upcoming' | 'live' | 'completed' {
  const s = status.toLowerCase();
  if (s.includes('live') || s.includes('in progress') || s.includes('ongoing')) return 'live';
  if (s.includes('completed') || s.includes('finished') || s.includes('result')) return 'completed';
  return 'upcoming';
}

function mapDbMatchesToApi(dbMatches: any[]): APIMatch[] {
  return dbMatches.map(m => ({
    id: m.external_id || m.id,
    name: `${m.team_home?.name || 'TBA'} vs ${m.team_away?.name || 'TBA'}`,
    format: 'T20' as const,
    status: m.status as 'upcoming' | 'live' | 'completed' | 'abandoned',
    venue: m.venue || '',
    startTime: new Date(m.start_time),
    teamA: {
      id: m.team_home?.external_id || m.team_home_id,
      name: m.team_home?.name || 'TBA',
      shortName: m.team_home?.short_name || 'TBA',
    },
    teamB: {
      id: m.team_away?.external_id || m.team_away_id,
      name: m.team_away?.name || 'TBA',
      shortName: m.team_away?.short_name || 'TBA',
    },
    result: m.result?.summary,
  }));
}

function refreshMatchesInBackground(tournamentId?: string): void {
  fetchAndSaveMatches(tournamentId).catch(err => 
    console.error('Background match refresh failed:', err)
  );
}

// ============================================
// PLAYERS
// ============================================

export async function getPlayersCached(teamId?: string): Promise<APIPlayer[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('players')
    .select('*, cricket_teams(*)')
    .eq('is_active', true);
  
  if (teamId) {
    query = query.eq('team_id', teamId);
  }
  
  const { data: dbPlayers, error } = await query;
  
  if (error) {
    console.error('DB error fetching players:', error);
  }
  
  if (dbPlayers && dbPlayers.length > 0) {
    // Check if stale
    const anyStale = dbPlayers.some(p => {
      const synced = p.last_synced_at ? new Date(p.last_synced_at) : null;
      return isStale(synced, STALENESS.PLAYER);
    });
    
    if (!anyStale) {
      return mapDbPlayersToApi(dbPlayers);
    }
    
    // Return stale, refresh in background
    refreshPlayersInBackground(teamId);
    return mapDbPlayersToApi(dbPlayers);
  }
  
  // No cached data
  return await fetchAndSavePlayers(teamId);
}

async function fetchAndSavePlayers(teamId?: string): Promise<APIPlayer[]> {
  try {
    const apiResponse = await getAPIProvider().getPlayers({ teamId });
    const players = apiResponse.data || [];
    await savePlayersToDb(players);
    return players;
  } catch (error) {
    console.error('Failed to fetch players from API:', error);
    return [];
  }
}

async function savePlayersToDb(players: APIPlayer[]): Promise<void> {
  const supabase = await createClient();
  
  for (const player of players) {
    await supabase
      .from('players')
      .upsert({
        id: player.id,
        external_id: player.id,
        name: player.name,
        photo_url: player.imageUrl,
        country: player.country,
        role: mapPlayerRole(player.role),
        batting_style: player.battingStyle,
        bowling_style: player.bowlingStyle,
        is_active: true,
        last_synced_at: new Date().toISOString(),
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
  }
}

function mapPlayerRole(role: string): 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper' {
  const r = role.toLowerCase();
  if (r.includes('keeper') || r.includes('wk')) return 'wicket-keeper';
  if (r.includes('all') || r.includes('rounder')) return 'all-rounder';
  if (r.includes('bowl')) return 'bowler';
  return 'batsman';
}

function mapDbPlayersToApi(dbPlayers: any[]): APIPlayer[] {
  return dbPlayers.map(p => ({
    id: p.external_id || p.id,
    name: p.name,
    teamId: p.team_id || '',
    role: p.role as 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper',
    battingStyle: p.batting_style,
    bowlingStyle: p.bowling_style,
    imageUrl: p.photo_url,
    country: p.country,
  }));
}

function refreshPlayersInBackground(teamId?: string): void {
  fetchAndSavePlayers(teamId).catch(err => 
    console.error('Background player refresh failed:', err)
  );
}

// ============================================
// LIVE SCORES (Always fetch from API)
// ============================================

export async function getLiveScoreCached(matchId: string): Promise<any> {
  // Live scores should always be fresh - use in-memory cache only
  // This function just wraps the API with a very short cache
  return getAPIProvider().getLiveScore(matchId);
}

// ============================================
// FORCE REFRESH (Manual trigger)
// ============================================

export async function forceRefreshTournaments(): Promise<void> {
  await fetchAndSaveTournaments();
}

export async function forceRefreshMatches(tournamentId?: string): Promise<void> {
  await fetchAndSaveMatches(tournamentId);
}

export async function forceRefreshPlayers(teamId?: string): Promise<void> {
  await fetchAndSavePlayers(teamId);
}
