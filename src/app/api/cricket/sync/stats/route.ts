import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseApiStats, calculatePlayerCredits } from '@/lib/creditCalculation';

const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_BASE = 'https://api.cricapi.com/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * POST /api/cricket/sync/stats
 * 
 * Syncs career stats for players who don't have them yet.
 * Call with a limit to control API usage (default: 10 players per call).
 * 
 * Body: { limit?: number, tournamentFormat?: 't20' | 'odi' | 'test' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 10;
    const tournamentFormat = body.tournamentFormat || 't20';

    // Find players without career stats (empty object or stats older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // First get players that need syncing
    const { data: allPlayers, error: fetchError } = await supabase
      .from('players')
      .select('id, external_id, name, role, career_stats, updated_at')
      .not('external_id', 'is', null)
      .limit(500); // Get more, then filter

    if (fetchError) {
      throw new Error(`Failed to fetch players: ${fetchError.message}`);
    }

    // Filter to players needing stats sync
    const playersToSync = (allPlayers || []).filter(p => {
      // No career stats or empty object
      if (!p.career_stats || Object.keys(p.career_stats).length === 0) {
        return true;
      }
      // Or stats are old
      if (p.updated_at && new Date(p.updated_at) < new Date(sevenDaysAgo)) {
        return true;
      }
      return false;
    }).slice(0, limit);

    if (!playersToSync || playersToSync.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'All players have up-to-date stats',
        synced: 0,
      });
    }

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Fetch stats for each player
    for (const player of playersToSync) {
      try {
        const response = await fetch(
          `${CRICKET_API_BASE}/players_info?apikey=${CRICKET_API_KEY}&id=${player.external_id}`
        );

        if (!response.ok) {
          results.errors.push(`API error for ${player.name}: ${response.status}`);
          results.failed++;
          continue;
        }

        const data = await response.json();
        
        if (!data.data || !data.data.stats) {
          results.errors.push(`No stats for ${player.name}`);
          results.failed++;
          continue;
        }

        // Parse the stats array into structured format
        const careerStats = parseApiStats(data.data.stats);
        
        // Calculate credit value based on stats
        const creditValue = calculatePlayerCredits(
          player.role || 'batsman',
          careerStats,
          tournamentFormat
        );

        // Update player with stats and credit value
        const { error: updateError } = await supabase
          .from('players')
          .update({
            career_stats: careerStats,
            credit_value: creditValue,
            updated_at: new Date().toISOString(),
          })
          .eq('id', player.id);

        if (updateError) {
          results.errors.push(`Update failed for ${player.name}: ${updateError.message}`);
          results.failed++;
        } else {
          results.synced++;
        }

        // Small delay to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        results.errors.push(`Error for ${player.name}: ${err instanceof Error ? err.message : 'Unknown'}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Synced stats for ${results.synced} players`,
      ...results,
      remaining: playersToSync.length - results.synced,
    });

  } catch (error) {
    console.error('Error syncing stats:', error);
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cricket/sync/stats
 * 
 * Get sync status - how many players need stats
 */
export async function GET() {
  try {
    // Get all players and check their stats
    const { data: allPlayers } = await supabase
      .from('players')
      .select('name, role, career_stats, credit_value')
      .not('external_id', 'is', null);

    const playersWithStats = (allPlayers || []).filter(p => 
      p.career_stats && Object.keys(p.career_stats).length > 0
    );
    const playersNeedingStats = (allPlayers || []).filter(p => 
      !p.career_stats || Object.keys(p.career_stats).length === 0
    );

    // Get top players by credit value (only those with actual stats)
    const topPlayers = playersWithStats
      .filter(p => p.credit_value !== null)
      .sort((a, b) => b.credit_value - a.credit_value)
      .slice(0, 10)
      .map(p => ({ name: p.name, role: p.role, credit_value: p.credit_value }));

    // Credit value distribution
    const creditDistribution: Record<number, number> = {};
    playersWithStats
      .filter(p => p.credit_value !== null)
      .forEach(p => {
        creditDistribution[p.credit_value] = (creditDistribution[p.credit_value] || 0) + 1;
      });

    return NextResponse.json({
      status: 'success',
      playersNeedingStats: playersNeedingStats.length,
      playersWithStats: playersWithStats.length,
      totalPlayers: (allPlayers || []).length,
      creditDistribution,
      topPlayers,
    });

  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
