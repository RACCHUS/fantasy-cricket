import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_BASE = 'https://api.cricapi.com/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for database operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
  players: ApiPlayer[];
}

/**
 * POST /api/cricket/sync/players
 * 
 * Syncs player data from CricketData.org API to our database
 * Should be called periodically (e.g., once per day via cron)
 * 
 * Body: { seriesId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seriesId } = body;

    if (!seriesId) {
      return NextResponse.json(
        { status: 'error', message: 'seriesId is required' },
        { status: 400 }
      );
    }

    // Check if we've synced recently (within 24 hours)
    const { data: syncLog } = await supabase
      .from('api_sync_log')
      .select('*')
      .eq('sync_type', 'players')
      .eq('external_id', seriesId)
      .single();

    if (syncLog && new Date(syncLog.next_sync_at) > new Date()) {
      return NextResponse.json({
        status: 'skipped',
        message: 'Already synced recently',
        lastSynced: syncLog.last_synced_at,
        nextSync: syncLog.next_sync_at,
      });
    }

    // Fetch squad data from API
    const squadRes = await fetch(
      `${CRICKET_API_BASE}/series_squad?apikey=${CRICKET_API_KEY}&id=${seriesId}`
    );

    if (!squadRes.ok) {
      throw new Error(`API error: ${squadRes.status}`);
    }

    const squadData = await squadRes.json();
    const squads: ApiTeamSquad[] = squadData.data || [];

    let syncedCount = 0;
    const errors: string[] = [];

    // Process each team's players
    for (const team of squads) {
      // Ensure team exists in cricket_teams table
      const { data: existingTeam, error: teamFetchError } = await supabase
        .from('cricket_teams')
        .select('id')
        .eq('name', team.teamName)
        .single();

      let teamId = existingTeam?.id;

      if (!teamId) {
        // Create team if it doesn't exist
        const { data: newTeam, error: teamInsertError } = await supabase
          .from('cricket_teams')
          .insert({
            name: team.teamName,
            short_name: team.shortname,
          })
          .select('id')
          .single();
        
        if (teamInsertError) {
          errors.push(`Team insert error for ${team.teamName}: ${teamInsertError.message}`);
          continue; // Skip this team's players
        }
        teamId = newTeam?.id;
      }

      if (!teamId) {
        errors.push(`No team ID for ${team.teamName}`);
        continue;
      }

      // Upsert each player
      for (const player of team.players) {
        const role = mapRole(player.role);

        const { error } = await supabase
          .from('players')
          .upsert({
            external_id: player.id,
            name: player.name,
            team_id: teamId,
            role: role,
            batting_style: player.battingStyle,
            bowling_style: player.bowlingStyle,
            country: player.country,
            photo_url: player.playerImg,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'external_id',
          });

        if (error) {
          errors.push(`Player error for ${player.name}: ${error.message}`);
        } else {
          syncedCount++;
        }
      }
    }

    // Update sync log
    await supabase
      .from('api_sync_log')
      .upsert({
        sync_type: 'players',
        external_id: seriesId,
        last_synced_at: new Date().toISOString(),
        records_synced: syncedCount,
        next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'sync_type,external_id',
      });

    return NextResponse.json({
      status: 'success',
      message: `Synced ${syncedCount} players from ${squads.length} teams`,
      teamsProcessed: squads.length,
      playersProcessed: syncedCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error syncing players:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cricket/sync/players?seriesId=xxx
 * 
 * Check if sync is needed and return current status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('seriesId');

  if (!seriesId) {
    return NextResponse.json(
      { status: 'error', message: 'seriesId is required' },
      { status: 400 }
    );
  }

  const { data: syncLog } = await supabase
    .from('api_sync_log')
    .select('*')
    .eq('sync_type', 'players')
    .eq('external_id', seriesId)
    .single();

  const needsSync = !syncLog || new Date(syncLog.next_sync_at) <= new Date();

  return NextResponse.json({
    status: 'success',
    needsSync,
    lastSynced: syncLog?.last_synced_at || null,
    nextSync: syncLog?.next_sync_at || null,
    recordsCount: syncLog?.records_synced || 0,
  });
}

function mapRole(role?: string): string {
  if (!role) return 'batsman';
  
  const r = role.toLowerCase();
  if (r.includes('wk') || r.includes('keeper')) return 'wicket-keeper';
  if (r.includes('allrounder') || r.includes('all-rounder')) return 'all-rounder';
  if (r.includes('bowl')) return 'bowler';
  return 'batsman';
}

/**
 * Calculate credits based on player's historical stats
 * Uses recent performance data from player_stats table
 */
async function calculateCreditsFromStats(externalPlayerId: string, role: string): Promise<number> {
  // Base credits by role
  const baseCredits: Record<string, number> = {
    'wicket-keeper': 8.5,
    'batsman': 8.5,
    'all-rounder': 9.0,
    'bowler': 8.0,
  };

  let credits = baseCredits[role] || 8.5;

  // Try to get player's recent stats from our database
  const { data: player } = await supabase
    .from('players')
    .select(`
      id,
      recent_points,
      recent_matches,
      player_stats (
        fantasy_points
      )
    `)
    .eq('external_id', externalPlayerId)
    .single();

  if (player && player.player_stats && player.player_stats.length > 0) {
    // Calculate average fantasy points from recent matches
    const recentStats = player.player_stats.slice(-10); // Last 10 matches
    const avgPoints = recentStats.reduce((sum: number, s: { fantasy_points: number }) => 
      sum + (s.fantasy_points || 0), 0) / recentStats.length;

    // Scale credits based on performance
    // Average fantasy points of ~50 = base credits
    // Higher performers get more credits (max 11.5)
    // Lower performers get fewer credits (min 6.0)
    credits = baseCredits[role] + (avgPoints - 50) / 25;
  }

  // Clamp between 6.0 and 11.5
  return Math.max(6.0, Math.min(11.5, Math.round(credits * 10) / 10));
}
