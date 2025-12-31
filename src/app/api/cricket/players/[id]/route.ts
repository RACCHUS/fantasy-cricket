import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const player = await cricketAPI.getPlayer(id);
    
    if (!player) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Player not found',
          data: null,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        status: 'success',
        data: player,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch player',
        data: null,
      },
      { status: 500 }
    );
  }
}
