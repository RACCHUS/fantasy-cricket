import { NextRequest, NextResponse } from 'next/server';
import { cricketAPI } from '@/lib/cricket-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const match = await cricketAPI.getMatch(id);
    
    if (!match) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Match not found',
          data: null,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        status: 'success',
        data: match,
        timestamp: new Date(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch match',
        data: null,
      },
      { status: 500 }
    );
  }
}
