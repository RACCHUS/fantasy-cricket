import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      teamId: searchParams.get('teamId') || undefined,
      tournamentId: searchParams.get('tournamentId') || undefined,
      role: searchParams.get('role') as 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper' | undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      perPage: searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!) : undefined,
    };
    
    const players = await cricketAPI.getPlayers(options);
    
    return NextResponse.json(players, {
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
