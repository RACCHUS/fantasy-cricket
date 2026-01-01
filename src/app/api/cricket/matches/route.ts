import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      tournamentId: searchParams.get('tournamentId') || undefined,
      teamId: searchParams.get('teamId') || undefined,
      status: searchParams.get('status') as 'upcoming' | 'live' | 'completed' | undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      perPage: searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!) : undefined,
    };
    
    const matches = await cricketAPI.getMatches(options);
    
    return NextResponse.json(matches, {
      headers: {
        // Cache for 15 minutes (API limit: 100/day)
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch matches',
        data: [],
      },
      { status: 500 }
    );
  }
}
