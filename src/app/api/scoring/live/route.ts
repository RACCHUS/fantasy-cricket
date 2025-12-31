import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculatePlayerPoints, calculateTeamPoints } from '@/lib/scoring';
import { DEFAULT_SCORING } from '@/constants/scoring';
import type { PlayerMatchStats, ScoringRules } from '@/types';

interface LivePointsRequest {
  matchId: string;
  fantasyTeamId?: string;
}

interface PlayerPointsBreakdown {
  playerId: string;
  playerName: string;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  stats: Partial<PlayerMatchStats>;
  breakdown: string[];
}

interface LivePointsResponse {
  matchId: string;
  fantasyTeamId: string;
  totalPoints: number;
  lastUpdated: string;
  playerBreakdown: PlayerPointsBreakdown[];
}

/**
 * GET /api/scoring/live?matchId=xxx&fantasyTeamId=yyy
 * 
 * Returns live fantasy points for a team during a match
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    const fantasyTeamId = searchParams.get('fantasyTeamId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && fantasyTeamId) {
      return NextResponse.json(
        { error: 'Authentication required for team points' },
        { status: 401 }
      );
    }

    // Get match stats from database
    const { data: matchStats, error: statsError } = await supabase
      .from('player_stats')
      .select(`
        *,
        player:players(id, name, role, team:teams(name))
      `)
      .eq('match_id', matchId);

    if (statsError) {
      console.error('Error fetching match stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch match stats' },
        { status: 500 }
      );
    }

    // If no fantasyTeamId, return all player points for the match
    if (!fantasyTeamId) {
      const allPlayerPoints = (matchStats || []).map(stat => {
        const points = calculatePlayerPoints(stat, DEFAULT_SCORING);
        return {
          playerId: stat.player_id,
          playerName: stat.player?.name || 'Unknown',
          role: stat.player?.role || 'unknown',
          team: stat.player?.team?.name || 'Unknown',
          points,
          stats: {
            runsScored: stat.runs_scored,
            ballsFaced: stat.balls_faced,
            fours: stat.fours,
            sixes: stat.sixes,
            wickets: stat.wickets,
            oversBowled: stat.overs_bowled,
            runsConceded: stat.runs_conceded,
            maidens: stat.maidens,
            catches: stat.catches,
            stumpings: stat.stumpings,
            runOuts: stat.run_outs,
          },
        };
      });

      return NextResponse.json({
        matchId,
        lastUpdated: new Date().toISOString(),
        players: allPlayerPoints.sort((a, b) => b.points - a.points),
      });
    }

    // Get the fantasy team
    const { data: fantasyTeam, error: teamError } = await supabase
      .from('fantasy_teams')
      .select('*')
      .eq('id', fantasyTeamId)
      .single();

    if (teamError || !fantasyTeam) {
      return NextResponse.json(
        { error: 'Fantasy team not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (fantasyTeam.user_id !== user?.id) {
      return NextResponse.json(
        { error: 'Not authorized to view this team' },
        { status: 403 }
      );
    }

    // Build stats map
    const statsMap = new Map<string, PlayerMatchStats>();
    const playerInfo = new Map<string, { name: string; role: string }>();
    
    for (const stat of matchStats || []) {
      statsMap.set(stat.player_id, {
        id: stat.id,
        matchId: stat.match_id,
        playerId: stat.player_id,
        runsScored: stat.runs_scored || 0,
        ballsFaced: stat.balls_faced || 0,
        fours: stat.fours || 0,
        sixes: stat.sixes || 0,
        wickets: stat.wickets || 0,
        oversBowled: stat.overs_bowled || 0,
        runsConceded: stat.runs_conceded || 0,
        maidens: stat.maidens || 0,
        catches: stat.catches || 0,
        stumpings: stat.stumpings || 0,
        runOuts: stat.run_outs || 0,
        fantasyPoints: stat.fantasy_points || 0,
      });
      playerInfo.set(stat.player_id, {
        name: stat.player?.name || 'Unknown',
        role: stat.player?.role || 'unknown',
      });
    }

    // Calculate team points
    const { total, breakdown } = calculateTeamPoints(
      fantasyTeam.players,
      fantasyTeam.captain_id,
      fantasyTeam.vice_captain_id,
      statsMap,
      DEFAULT_SCORING
    );

    // Build player breakdown
    const playerBreakdown: PlayerPointsBreakdown[] = fantasyTeam.players.map(
      (playerId: string) => {
        const stats = statsMap.get(playerId);
        const info = playerInfo.get(playerId);
        const isCaptain = playerId === fantasyTeam.captain_id;
        const isViceCaptain = playerId === fantasyTeam.vice_captain_id;
        
        let points = stats ? calculatePlayerPoints(stats, DEFAULT_SCORING) : 0;
        if (isCaptain) points = Math.round(points * DEFAULT_SCORING.multipliers.captain);
        if (isViceCaptain) points = Math.round(points * DEFAULT_SCORING.multipliers.viceCaptain);

        return {
          playerId,
          playerName: info?.name || 'Unknown',
          points,
          isCaptain,
          isViceCaptain,
          stats: stats || {},
          breakdown: stats ? getPointsBreakdown(stats, DEFAULT_SCORING) : [],
        };
      }
    );

    const response: LivePointsResponse = {
      matchId,
      fantasyTeamId,
      totalPoints: total,
      lastUpdated: new Date().toISOString(),
      playerBreakdown: playerBreakdown.sort((a, b) => b.points - a.points),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Live scoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate human-readable points breakdown
 */
function getPointsBreakdown(
  stats: PlayerMatchStats,
  rules: ScoringRules
): string[] {
  const items: string[] = [];

  // Batting
  if (stats.runsScored > 0) {
    items.push(`${stats.runsScored} runs → +${stats.runsScored * rules.batting.run}`);
  }
  if (stats.fours > 0) {
    items.push(`${stats.fours} fours → +${stats.fours * rules.batting.four}`);
  }
  if (stats.sixes > 0) {
    items.push(`${stats.sixes} sixes → +${stats.sixes * rules.batting.six}`);
  }
  if (stats.runsScored >= 100) {
    items.push(`Century! → +${rules.batting.century}`);
  } else if (stats.runsScored >= 50) {
    items.push(`Half-century! → +${rules.batting.halfCentury}`);
  }
  if (stats.runsScored === 0 && stats.ballsFaced > 0) {
    items.push(`Duck → ${rules.batting.duck}`);
  }

  // Bowling
  if (stats.wickets > 0) {
    items.push(`${stats.wickets} wickets → +${stats.wickets * rules.bowling.wicket}`);
  }
  if (stats.maidens > 0) {
    items.push(`${stats.maidens} maidens → +${stats.maidens * rules.bowling.maiden}`);
  }
  if (stats.wickets >= 5) {
    items.push(`5-wicket haul! → +${rules.bowling.fiveWickets}`);
  } else if (stats.wickets >= 3) {
    items.push(`3-wicket haul! → +${rules.bowling.threeWickets}`);
  }

  // Fielding
  if (stats.catches > 0) {
    items.push(`${stats.catches} catches → +${stats.catches * rules.fielding.catch}`);
  }
  if (stats.stumpings > 0) {
    items.push(`${stats.stumpings} stumpings → +${stats.stumpings * rules.fielding.stumping}`);
  }
  if (stats.runOuts > 0) {
    items.push(`${stats.runOuts} run-outs → +${stats.runOuts * rules.fielding.runOutDirect}`);
  }

  return items;
}
