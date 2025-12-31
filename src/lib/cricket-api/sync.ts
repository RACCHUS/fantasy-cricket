/**
 * Data Sync Service
 * Syncs data from external Cricket API to Supabase database
 */

import { createClient } from '@/lib/supabase/server';
import { cricketAPI } from '@/lib/cricket-api';
import type { APIMatch, APIPlayer, APITeam, APIPlayerMatchStats } from '@/lib/cricket-api/types';

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  timestamp: Date;
}

/**
 * Sync teams from API to database
 */
export async function syncTeams(tournamentId?: string): Promise<SyncResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let synced = 0;

  try {
    const teams = await cricketAPI.getTeams(tournamentId);

    for (const team of teams) {
      const { error } = await supabase
        .from('teams')
        .upsert(mapTeamToDb(team), { onConflict: 'id' });

      if (error) {
        errors.push(`Failed to sync team ${team.name}: ${error.message}`);
      } else {
        synced++;
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
    timestamp: new Date(),
  };
}

/**
 * Sync players from API to database
 */
export async function syncPlayers(options?: { teamId?: string; tournamentId?: string }): Promise<SyncResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let synced = 0;

  try {
    const response = await cricketAPI.getPlayers(options);

    for (const player of response.data) {
      const { error } = await supabase
        .from('players')
        .upsert(mapPlayerToDb(player), { onConflict: 'id' });

      if (error) {
        errors.push(`Failed to sync player ${player.name}: ${error.message}`);
      } else {
        synced++;
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch players: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
    timestamp: new Date(),
  };
}

/**
 * Sync matches from API to database
 */
export async function syncMatches(tournamentId?: string): Promise<SyncResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let synced = 0;

  try {
    const response = await cricketAPI.getMatches({ tournamentId });

    for (const match of response.data) {
      // First ensure teams exist
      await syncMatchTeams(match);

      const { error } = await supabase
        .from('matches')
        .upsert(mapMatchToDb(match, tournamentId), { onConflict: 'id' });

      if (error) {
        errors.push(`Failed to sync match ${match.name}: ${error.message}`);
      } else {
        synced++;
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
    timestamp: new Date(),
  };
}

/**
 * Sync player stats for a completed match
 */
export async function syncPlayerStats(matchId: string): Promise<SyncResult> {
  const supabase = await createClient();
  const errors: string[] = [];
  let synced = 0;

  try {
    const stats = await cricketAPI.getAllPlayerMatchStats(matchId);

    for (const stat of stats) {
      const { error } = await supabase
        .from('player_stats')
        .upsert(mapPlayerStatsToDb(stat), {
          onConflict: 'player_id,match_id',
        });

      if (error) {
        errors.push(`Failed to sync stats for player ${stat.playerId}: ${error.message}`);
      } else {
        synced++;
      }
    }
  } catch (error) {
    errors.push(`Failed to fetch player stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
    timestamp: new Date(),
  };
}

/**
 * Full sync - sync all data for a tournament
 */
export async function fullSync(tournamentId: string): Promise<{
  teams: SyncResult;
  players: SyncResult;
  matches: SyncResult;
}> {
  console.log(`Starting full sync for tournament ${tournamentId}...`);

  const teamsResult = await syncTeams(tournamentId);
  console.log(`Teams sync: ${teamsResult.synced} synced, ${teamsResult.errors.length} errors`);

  const playersResult = await syncPlayers({ tournamentId });
  console.log(`Players sync: ${playersResult.synced} synced, ${playersResult.errors.length} errors`);

  const matchesResult = await syncMatches(tournamentId);
  console.log(`Matches sync: ${matchesResult.synced} synced, ${matchesResult.errors.length} errors`);

  return {
    teams: teamsResult,
    players: playersResult,
    matches: matchesResult,
  };
}

// ==========================================
// Helper functions
// ==========================================

async function syncMatchTeams(match: APIMatch): Promise<void> {
  const supabase = await createClient();

  // Upsert team A
  await supabase
    .from('teams')
    .upsert(mapTeamToDb(match.teamA), { onConflict: 'id' });

  // Upsert team B
  await supabase
    .from('teams')
    .upsert(mapTeamToDb(match.teamB), { onConflict: 'id' });
}

// ==========================================
// Mappers (API format -> DB format)
// ==========================================

function mapTeamToDb(team: APITeam) {
  return {
    id: team.id,
    name: team.name,
    short_name: team.shortName,
    logo_url: team.logoUrl,
    // primary_color and secondary_color would need to be set manually
  };
}

function mapPlayerToDb(player: APIPlayer) {
  return {
    id: player.id,
    name: player.name,
    team_id: player.teamId || null,
    role: player.role,
    batting_style: player.battingStyle,
    bowling_style: player.bowlingStyle,
    image_url: player.imageUrl,
    credit_value: 8.0, // Default credit value, can be adjusted
    is_playing: true,
  };
}

function mapMatchToDb(match: APIMatch, tournamentId?: string) {
  return {
    id: match.id,
    tournament_id: tournamentId || null,
    team_a_id: match.teamA.id,
    team_b_id: match.teamB.id,
    venue: match.venue,
    match_date: match.startTime.toISOString(),
    match_type: match.format,
    status: match.status,
    result: match.result,
    team_a_score: match.score
      ? `${match.score.teamA.runs}/${match.score.teamA.wickets} (${match.score.teamA.overs})`
      : null,
    team_b_score: match.score
      ? `${match.score.teamB.runs}/${match.score.teamB.wickets} (${match.score.teamB.overs})`
      : null,
    deadline: new Date(match.startTime.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins before match
  };
}

function mapPlayerStatsToDb(stats: APIPlayerMatchStats) {
  return {
    player_id: stats.playerId,
    match_id: stats.matchId,
    runs_scored: stats.runs,
    balls_faced: stats.ballsFaced,
    fours: stats.fours,
    sixes: stats.sixes,
    is_out: stats.isOut,
    overs_bowled: stats.overs,
    runs_conceded: stats.runsConceded,
    wickets: stats.wickets,
    maidens: stats.maidens,
    dot_balls: stats.dotBalls,
    catches: stats.catches,
    stumpings: stats.stumpings,
    run_outs_direct: stats.runOutsDirect,
    run_outs_indirect: stats.runOutsAssisted,
    // Fantasy points will be calculated separately
  };
}
