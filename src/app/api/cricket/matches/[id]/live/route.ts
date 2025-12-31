import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const liveScore = await cricketAPI.getLiveScore(id);
    
    if (!liveScore) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Match not found or not live',
          data: null,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        status: 'success',
        data: liveScore,
        timestamp: new Date(),
      },
      {
        headers: {
          // Short cache for live data
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching live score:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch live score',
        data: null,
      },
      { status: 500 }
    );
  }
}
