import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contests/[id]
 * 
 * Get contest details including entries and leaderboard
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get contest with match info
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select(`
        *,
        match:matches(
          id,
          team_home:teams!matches_team_home_id_fkey(name),
          team_away:teams!matches_team_away_id_fkey(name),
          start_time,
          status
        ),
        tournament:tournaments(id, name)
      `)
      .eq('id', id)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Get entries with user and team info
    const { data: entries, error: entriesError } = await supabase
      .from('contest_entries')
      .select(`
        *,
        user:profiles(id, username, avatar_url),
        fantasy_team:fantasy_teams(id, name, total_points)
      `)
      .eq('contest_id', id)
      .order('points', { ascending: false });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
    }

    // Determine status
    let status = 'upcoming';
    if (contest.match?.status === 'live') {
      status = 'live';
    } else if (contest.match?.status === 'completed') {
      status = 'completed';
    }

    // Transform contest
    const transformedContest = {
      id: contest.id,
      tournamentId: contest.tournament_id,
      tournamentName: contest.tournament?.name,
      matchId: contest.match_id,
      name: contest.name,
      type: contest.type,
      maxEntries: contest.max_entries,
      currentEntries: entries?.length || 0,
      entryFee: contest.entry_fee,
      isSystemContest: contest.is_system_contest,
      status,
      startTime: contest.match?.start_time,
      prizeDescription: contest.prize_description,
      createdAt: contest.created_at,
      match: contest.match
        ? {
            teamHome: contest.match.team_home?.name || 'TBD',
            teamAway: contest.match.team_away?.name || 'TBD',
            startTime: contest.match.start_time,
          }
        : undefined,
    };

    // Build leaderboard
    const leaderboard = entries?.map((entry, index) => ({
      rank: index + 1,
      entryId: entry.id,
      userId: entry.user_id,
      username: entry.user?.username || 'Anonymous',
      avatarUrl: entry.user?.avatar_url,
      teamName: entry.fantasy_team?.name || 'My Team',
      teamId: entry.fantasy_team_id,
      points: entry.points || entry.fantasy_team?.total_points || 0,
    })) || [];

    return NextResponse.json({
      contest: transformedContest,
      leaderboard,
    });
  } catch (error) {
    console.error('Contest detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contests/[id]
 * 
 * Delete a contest (only creator can delete, and only if not started)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get contest
    const { data: contest, error: fetchError } = await supabase
      .from('contests')
      .select('*, match:matches(status)')
      .eq('id', id)
      .single();

    if (fetchError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Check ownership (system contests can't be deleted by users)
    if (contest.is_system_contest) {
      return NextResponse.json(
        { error: 'Cannot delete system contests' },
        { status: 403 }
      );
    }

    if (contest.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this contest' },
        { status: 403 }
      );
    }

    // Can't delete if match has started
    if (contest.match?.status === 'live' || contest.match?.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete contest after match has started' },
        { status: 400 }
      );
    }

    // Delete contest (cascade will handle entries)
    const { error: deleteError } = await supabase
      .from('contests')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting contest:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete contest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
