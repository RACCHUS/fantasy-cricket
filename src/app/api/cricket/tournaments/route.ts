import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      status: searchParams.get('status') as 'upcoming' | 'live' | 'completed' | undefined,
      format: searchParams.get('format') as 'T20' | 'ODI' | 'Test' | undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
    };
    
    const tournaments = await cricketAPI.getTournaments(options);
    
    return NextResponse.json(
      {
        status: 'success',
        data: tournaments,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch tournaments',
        data: [],
      },
      { status: 500 }
    );
  }
}
