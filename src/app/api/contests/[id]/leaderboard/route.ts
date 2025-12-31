import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contests/[id]/leaderboard
 * 
 * Get real-time leaderboard for a contest
 * Returns ranked entries with rank change indicators
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = await createClient();

    // Get current user for highlighting
    const { data: { user } } = await supabase.auth.getUser();

    // Verify contest exists
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('id, name, type, match:matches(status)')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Get entries with user and team info, ordered by points
    const { data: entries, error: entriesError, count } = await supabase
      .from('contest_entries')
      .select(`
        id,
        user_id,
        points,
        rank,
        fantasy_team:fantasy_teams(id, name, total_points, captain_id, vice_captain_id),
        user:profiles(id, username, avatar_url)
      `, { count: 'exact' })
      .eq('contest_id', contestId)
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entriesError) {
      console.error('Error fetching leaderboard:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Build leaderboard with ranks
    const leaderboard = entries?.map((entry, index) => {
      const rank = offset + index + 1;
      const previousRank = entry.rank; // Stored rank from last calculation
      
      let rankChange: 'up' | 'down' | 'same' | 'new' = 'same';
      if (previousRank === null) {
        rankChange = 'new';
      } else if (rank < previousRank) {
        rankChange = 'up';
      } else if (rank > previousRank) {
        rankChange = 'down';
      }

      // Handle Supabase returning single relations as objects or arrays
      const userObj = Array.isArray(entry.user) ? entry.user[0] : entry.user;
      const teamObj = Array.isArray(entry.fantasy_team) ? entry.fantasy_team[0] : entry.fantasy_team;

      return {
        rank,
        previousRank,
        rankChange,
        entryId: entry.id,
        userId: entry.user_id,
        username: userObj?.username || 'Anonymous',
        avatarUrl: userObj?.avatar_url || null,
        teamId: teamObj?.id,
        teamName: teamObj?.name || 'My Team',
        points: entry.points || 0,
        isCurrentUser: entry.user_id === user?.id,
      };
    }) || [];

    // Find current user's position if they're in the contest but not in current page
    let currentUserEntry = null;
    if (user && !leaderboard.some((e) => e.isCurrentUser)) {
      const { data: userEntry } = await supabase
        .from('contest_entries')
        .select(`
          id,
          points,
          rank,
          fantasy_team:fantasy_teams(name)
        `)
        .eq('contest_id', contestId)
        .eq('user_id', user.id)
        .single();

      if (userEntry) {
        // Find user's actual rank
        const { count: betterCount } = await supabase
          .from('contest_entries')
          .select('*', { count: 'exact', head: true })
          .eq('contest_id', contestId)
          .gt('points', userEntry.points);

        // Handle Supabase returning single relations as objects or arrays
        const teamObj = Array.isArray(userEntry.fantasy_team) 
          ? userEntry.fantasy_team[0] 
          : userEntry.fantasy_team;

        currentUserEntry = {
          rank: (betterCount || 0) + 1,
          entryId: userEntry.id,
          teamName: teamObj?.name || 'My Team',
          points: userEntry.points || 0,
          isCurrentUser: true,
        };
      }
    }

    // Handle Supabase returning match as array or object
    const matchObj = Array.isArray(contest.match) ? contest.match[0] : contest.match;

    return NextResponse.json({
      contestId,
      contestName: contest.name,
      matchStatus: matchObj?.status || 'upcoming',
      totalEntries: count || 0,
      leaderboard,
      currentUserEntry,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contests/[id]/leaderboard
 * 
 * Recalculate and update ranks for a contest
 * Called after match stats are updated
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;
    const supabase = await createClient();

    // Get all entries ordered by points
    const { data: entries, error } = await supabase
      .from('contest_entries')
      .select('id, points')
      .eq('contest_id', contestId)
      .order('points', { ascending: false });

    if (error) {
      console.error('Error fetching entries for rank update:', error);
      return NextResponse.json(
        { error: 'Failed to update ranks' },
        { status: 500 }
      );
    }

    // Update ranks
    const updates = entries?.map((entry, index) => ({
      id: entry.id,
      rank: index + 1,
    })) || [];

    // Batch update ranks
    for (const update of updates) {
      await supabase
        .from('contest_entries')
        .update({ rank: update.rank })
        .eq('id', update.id);
    }

    return NextResponse.json({
      success: true,
      updatedCount: updates.length,
    });
  } catch (error) {
    console.error('Update ranks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
