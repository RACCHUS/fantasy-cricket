import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/contests
 * 
 * List contests with optional filters:
 * - type: tournament | match | h2h
 * - status: upcoming | live | completed
 * - matchId: filter by specific match
 * - tournamentId: filter by tournament
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const matchId = searchParams.get('matchId');
    const tournamentId = searchParams.get('tournamentId');

    const supabase = await createClient();

    let query = supabase
      .from('contests')
      .select(`
        *,
        match:matches(
          id,
          team_home:teams!matches_team_home_id_fkey(name),
          team_away:teams!matches_team_away_id_fkey(name),
          start_time,
          status
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }
    if (matchId) {
      query = query.eq('match_id', matchId);
    }
    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId);
    }

    const { data: contests, error } = await query;

    if (error) {
      console.error('Error fetching contests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contests' },
        { status: 500 }
      );
    }

    // Get entry counts for each contest
    const contestIds = contests?.map((c) => c.id) || [];
    const { data: entryCounts } = await supabase
      .from('contest_entries')
      .select('contest_id')
      .in('contest_id', contestIds);

    const countMap = new Map<string, number>();
    entryCounts?.forEach((e) => {
      countMap.set(e.contest_id, (countMap.get(e.contest_id) || 0) + 1);
    });

    // Transform response
    const transformedContests = contests?.map((contest) => {
      // Determine status based on match status
      let contestStatus = 'upcoming';
      if (contest.match?.status === 'live') {
        contestStatus = 'live';
      } else if (contest.match?.status === 'completed') {
        contestStatus = 'completed';
      }

      return {
        id: contest.id,
        tournamentId: contest.tournament_id,
        matchId: contest.match_id,
        name: contest.name,
        type: contest.type,
        maxEntries: contest.max_entries,
        currentEntries: countMap.get(contest.id) || 0,
        entryFee: contest.entry_fee,
        isSystemContest: contest.is_system_contest,
        status: contestStatus,
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
    });

    // Filter by status if requested
    let result = transformedContests || [];
    if (status) {
      result = result.filter((c) => c.status === status);
    }

    return NextResponse.json({ contests: result });
  } catch (error) {
    console.error('Contests API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contests
 * 
 * Create a new contest (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
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
    const {
      name,
      type,
      matchId,
      tournamentId,
      maxEntries,
      prizeDescription,
    } = body;

    // Validate required fields
    if (!name || !type || !tournamentId) {
      return NextResponse.json(
        { error: 'name, type, and tournamentId are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['tournament', 'match', 'h2h'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid contest type' },
        { status: 400 }
      );
    }

    // Match contests require a matchId
    if (type === 'match' && !matchId) {
      return NextResponse.json(
        { error: 'matchId is required for match contests' },
        { status: 400 }
      );
    }

    // H2H contests are limited to 2 entries
    const entries = type === 'h2h' ? 2 : maxEntries || null;

    const { data: contest, error } = await supabase
      .from('contests')
      .insert({
        name,
        type,
        match_id: matchId || null,
        tournament_id: tournamentId,
        max_entries: entries,
        entry_fee: 0, // All free
        is_system_contest: false,
        prize_description: prizeDescription || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contest:', error);
      return NextResponse.json(
        { error: 'Failed to create contest' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contest }, { status: 201 });
  } catch (error) {
    console.error('Create contest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
