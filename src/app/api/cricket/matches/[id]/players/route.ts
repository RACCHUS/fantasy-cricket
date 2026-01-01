import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_BASE = 'https://api.cricapi.com/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for database operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ApiPlayer {
  id: string;
  name: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  country?: string;
  playerImg?: string;
}

interface ApiTeamSquad {
  teamName: string;
  shortname: string;
  img?: string;
  players: ApiPlayer[];
}

interface Player {
  id: string;
  name: string;
  role: 'wk' | 'bat' | 'all' | 'bowl';
  team: string;
  teamShortName: string;
  credits: number;
  playerImg?: string;
  country?: string;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: matchId } = await params;
    
    // Get match details first to know which tournament and teams
    const matchRes = await fetch(
      `${CRICKET_API_BASE}/match_info?apikey=${CRICKET_API_KEY}&id=${matchId}`
    );
    
    if (!matchRes.ok) {
      throw new Error('Failed to fetch match info');
    }
    
    const matchData = await matchRes.json();
    const match = matchData.data;
    
    if (!match) {
      return NextResponse.json(
        { status: 'error', message: 'Match not found', data: [] },
        { status: 404 }
      );
    }
    
    // Get the series ID from the match
    const seriesId = match.series_id;
    const teamNames = match.teams || [];
    
    if (!seriesId) {
      // Fall back to teamInfo from match if no series
      const players = createPlayersFromTeamInfo(match);
      return NextResponse.json({
        status: 'success',
        data: players,
        source: 'fallback',
        match: {
          teamA: { name: match.teamInfo?.[0]?.name, shortName: match.teamInfo?.[0]?.shortname },
          teamB: { name: match.teamInfo?.[1]?.name, shortName: match.teamInfo?.[1]?.shortname },
        },
      });
    }
    
    // Check if we have synced data in the database (within 24 hours)
    const { data: syncLog } = await supabase
      .from('api_sync_log')
      .select('*')
      .eq('sync_type', 'players')
      .eq('external_id', seriesId)
      .single();
    
    const hasFreshData = syncLog && new Date(syncLog.next_sync_at) > new Date();
    
    if (hasFreshData) {
      // Fetch players from database with their team info
      const { data: dbPlayers, error: dbError } = await supabase
        .from('players')
        .select(`
          external_id,
          name,
          role,
          photo_url,
          country,
          team_id,
          credit_value,
          career_stats,
          cricket_teams (
            name,
            short_name
          )
        `)
        .not('last_synced_at', 'is', null);
      
      if (dbError) {
        console.error('Error fetching players from DB:', dbError);
      }
      
      if (dbPlayers && dbPlayers.length > 0) {
        // Filter to only players from teams in this match
        // Supabase returns cricket_teams as an array for the relation
        const matchPlayers = dbPlayers.filter((p) => {
          const teamsArr = p.cricket_teams as unknown as Array<{ name: string; short_name: string }> | null;
          const teamData = teamsArr?.[0];
          return teamData && teamNames.some((name: string) =>
            name.toLowerCase().includes(teamData.name.toLowerCase()) ||
            teamData.name.toLowerCase().includes(name.toLowerCase())
          );
        });
        
        if (matchPlayers.length > 0) {
          const formattedPlayers: Player[] = matchPlayers.map((p) => {
            const teamsArr = p.cricket_teams as unknown as Array<{ name: string; short_name: string }>;
            const teamData = teamsArr?.[0];
            // Use calculated credit_value from DB, fall back to role-based credits
            const roleCredits = {
              'wicket-keeper': 8.5,
              'batsman': 8.0,
              'all-rounder': 9.0,
              'bowler': 8.0,
            };
            const credits = p.credit_value || roleCredits[p.role as keyof typeof roleCredits] || 8.0;
            return {
              id: p.external_id,
              name: p.name,
              role: dbRoleToApiRole(p.role),
              team: teamData?.name || '',
              teamShortName: teamData?.short_name || '',
              credits: credits,
              playerImg: p.photo_url || undefined,
              country: p.country || undefined,
            };
          });
          
          // Sort by role
          const roleOrder = { wk: 0, bat: 1, all: 2, bowl: 3 };
          formattedPlayers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
          
          return NextResponse.json({
            status: 'success',
            data: formattedPlayers,
            source: 'database',
            lastSynced: syncLog.last_synced_at,
            match: {
              teamA: { name: match.teamInfo?.[0]?.name, shortName: match.teamInfo?.[0]?.shortname },
              teamB: { name: match.teamInfo?.[1]?.name, shortName: match.teamInfo?.[1]?.shortname },
            },
          });
        }
      }
    }
    
    // If no fresh data in DB, fetch from API and optionally trigger sync
    const squadRes = await fetch(
      `${CRICKET_API_BASE}/series_squad?apikey=${CRICKET_API_KEY}&id=${seriesId}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!squadRes.ok) {
      throw new Error('Failed to fetch squad');
    }
    
    const squadData = await squadRes.json();
    const squads: ApiTeamSquad[] = squadData.data || [];
    
    // Find the two teams playing in this match (reuse teamNames from above)
    const matchTeams = squads.filter((squad) =>
      teamNames.some((name: string) =>
        name.toLowerCase().includes(squad.teamName.toLowerCase()) ||
        squad.teamName.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    // Convert to our player format
    const allPlayers: Player[] = [];
    
    for (const team of matchTeams) {
      for (const player of team.players) {
        allPlayers.push({
          id: player.id,
          name: player.name,
          role: mapRole(player.role),
          team: team.teamName,
          teamShortName: team.shortname,
          credits: calculateCredits(player),
          playerImg: player.playerImg,
          country: player.country,
        });
      }
    }
    
    // Sort by role: WK -> BAT -> ALL -> BOWL
    const roleOrder = { wk: 0, bat: 1, all: 2, bowl: 3 };
    allPlayers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
    
    // Trigger background sync to update database for next time
    triggerPlayerSync(seriesId);
    
    return NextResponse.json({
      status: 'success',
      data: allPlayers,
      source: 'api',
      seriesId: seriesId,
      match: {
        teamA: matchTeams[0] ? { name: matchTeams[0].teamName, shortName: matchTeams[0].shortname } : null,
        teamB: matchTeams[1] ? { name: matchTeams[1].teamName, shortName: matchTeams[1].shortname } : null,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch players',
        data: [],
      },
      { status: 500 }
    );
  }
}

// Convert database role to API role format
function dbRoleToApiRole(role: string): 'wk' | 'bat' | 'all' | 'bowl' {
  switch (role) {
    case 'wicket-keeper': return 'wk';
    case 'all-rounder': return 'all';
    case 'bowler': return 'bowl';
    default: return 'bat';
  }
}

function mapRole(role?: string): 'wk' | 'bat' | 'all' | 'bowl' {
  if (!role) return 'bat';
  
  const r = role.toLowerCase();
  if (r.includes('wk') || r.includes('keeper')) return 'wk';
  if (r.includes('allrounder') || r.includes('all-rounder')) return 'all';
  if (r.includes('bowl')) return 'bowl';
  return 'bat';
}

function calculateCredits(player: ApiPlayer): number {
  const role = mapRole(player.role);
  
  // Base credits by role
  const baseCredits: Record<string, number> = {
    wk: 8.5,
    bat: 8.5,
    all: 9.0,
    bowl: 8.0,
  };
  
  let credits = baseCredits[role] || 8.5;
  
  // Add some variance based on player name length (just for variety)
  // In a real app, this would be based on actual player stats
  const nameHash = player.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variance = ((nameHash % 30) - 15) / 10; // -1.5 to +1.5
  credits += variance;
  
  // Clamp between 6.0 and 11.5
  return Math.max(6.0, Math.min(11.5, Math.round(credits * 10) / 10));
}

function createPlayersFromTeamInfo(match: { teamInfo?: Array<{ name: string; shortname: string }> }): Player[] {
  // Fallback: create placeholder players if we don't have squad data
  return [];
}

/**
 * Trigger a background sync of player data to the database
 * This runs asynchronously and doesn't block the response
 */
async function triggerPlayerSync(seriesId: string): Promise<void> {
  try {
    // Fire and forget - sync in background
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/cricket/sync/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesId }),
    }).catch(() => {
      // Ignore errors - this is best-effort
    });
  } catch {
    // Ignore
  }
}