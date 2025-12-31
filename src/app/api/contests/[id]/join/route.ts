import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/contests/[id]/join
 * 
 * Join a contest with a fantasy team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fantasyTeamId } = body;

    if (!fantasyTeamId) {
      return NextResponse.json(
        { error: 'fantasyTeamId is required' },
        { status: 400 }
      );
    }

    // Get contest
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*, match:matches(status)')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Check if match has started (can't join after kickoff)
    if (contest.match?.status === 'live' || contest.match?.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot join after match has started' },
        { status: 400 }
      );
    }

    // Check if user already joined
    const { data: existingEntry } = await supabase
      .from('contest_entries')
      .select('id')
      .eq('contest_id', contestId)
      .eq('user_id', user.id)
      .single();

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Already joined this contest' },
        { status: 400 }
      );
    }

    // Check entry limit
    if (contest.max_entries) {
      const { count } = await supabase
        .from('contest_entries')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', contestId);

      if (count !== null && count >= contest.max_entries) {
        return NextResponse.json(
          { error: 'Contest is full' },
          { status: 400 }
        );
      }
    }

    // Verify fantasy team ownership
    const { data: fantasyTeam, error: teamError } = await supabase
      .from('fantasy_teams')
      .select('id, user_id, name')
      .eq('id', fantasyTeamId)
      .single();

    if (teamError || !fantasyTeam) {
      return NextResponse.json(
        { error: 'Fantasy team not found' },
        { status: 404 }
      );
    }

    if (fantasyTeam.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not your fantasy team' },
        { status: 403 }
      );
    }

    // Create entry
    const { data: entry, error: entryError } = await supabase
      .from('contest_entries')
      .insert({
        contest_id: contestId,
        fantasy_team_id: fantasyTeamId,
        user_id: user.id,
        points: 0,
        rank: null,
      })
      .select()
      .single();

    if (entryError) {
      console.error('Error joining contest:', entryError);
      return NextResponse.json(
        { error: 'Failed to join contest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        contestId: entry.contest_id,
        fantasyTeamId: entry.fantasy_team_id,
        teamName: fantasyTeam.name,
      },
    });
  } catch (error) {
    console.error('Join contest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contests/[id]/join
 * 
 * Leave a contest (before match starts)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;
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
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*, match:matches(status)')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Can't leave after match starts
    if (contest.match?.status === 'live' || contest.match?.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot leave after match has started' },
        { status: 400 }
      );
    }

    // Delete entry
    const { error: deleteError } = await supabase
      .from('contest_entries')
      .delete()
      .eq('contest_id', contestId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error leaving contest:', deleteError);
      return NextResponse.json(
        { error: 'Failed to leave contest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave contest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
