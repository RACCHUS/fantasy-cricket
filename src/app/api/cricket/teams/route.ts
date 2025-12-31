import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId') || undefined;
    
    const teams = await cricketAPI.getTeams(tournamentId);
    
    return NextResponse.json(
      {
        status: 'success',
        data: teams,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch teams',
        data: [],
      },
      { status: 500 }
    );
  }
}
