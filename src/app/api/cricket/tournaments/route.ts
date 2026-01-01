import { NextRequest, NextResponse } from 'next/server';

// Use CricketData.org API directly for tournaments
const CRICKET_API_KEY = process.env.CRICKET_API_KEY;
const CRICKET_API_BASE = 'https://api.cricapi.com/v1';

// 6 hours in seconds
const CACHE_DURATION = 6 * 60 * 60;

interface ApiTournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  odi: number;
  t20: number;
  test: number;
  matches: number;
  squads: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorize = searchParams.get('categorize') !== 'false';
    
    // Fetch from CricketData.org with 6-hour Next.js cache
    const response = await fetch(
      `${CRICKET_API_BASE}/series?apikey=${CRICKET_API_KEY}&offset=0`,
      { next: { revalidate: CACHE_DURATION } } // Cache for 6 hours
    );
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    
    const json = await response.json();
    const tournaments: ApiTournament[] = json.data || [];
    
    if (!categorize) {
      return NextResponse.json({
        status: 'success',
        data: tournaments,
        timestamp: new Date(),
      });
    }
    
    // Categorize into live and upcoming
    const now = new Date();
    const live: ApiTournament[] = [];
    const upcoming: ApiTournament[] = [];
    
    for (const t of tournaments) {
      const startDate = new Date(t.startDate);
      // endDate might be partial like "Jan 25", so construct full date
      let endDate: Date;
      if (t.endDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Already a full date like "2026-01-25"
        endDate = new Date(t.endDate);
      } else {
        // Partial date like "Jan 25" - add the year
        const endYear = startDate.getMonth() >= 10 && t.endDate.includes('Jan') 
          ? startDate.getFullYear() + 1 
          : startDate.getFullYear();
        endDate = new Date(`${t.endDate} ${endYear}`);
      }
      
      // Update the endDate to be a proper ISO date string
      t.endDate = endDate.toISOString().split('T')[0];
      
      if (now >= startDate && now <= endDate) {
        live.push(t);
      } else if (now < startDate) {
        upcoming.push(t);
      }
    }
    
    // Sort: prioritize tournaments with squads, then by start date
    live.sort((a, b) => {
      // First, prioritize those with squads
      if (a.squads > 0 && b.squads === 0) return -1;
      if (a.squads === 0 && b.squads > 0) return 1;
      // Then by start date (most recent first)
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    upcoming.sort((a, b) => {
      // First, prioritize those with squads
      if (a.squads > 0 && b.squads === 0) return -1;
      if (a.squads === 0 && b.squads > 0) return 1;
      // Then by start date (soonest first)
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    return NextResponse.json(
      {
        live,
        upcoming: upcoming.slice(0, 10), // Only next 10 upcoming
        total: tournaments.length,
        timestamp: new Date(),
        cacheInfo: {
          cachedFor: '6 hours',
          revalidateAt: new Date(Date.now() + CACHE_DURATION * 1000).toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      {
        live: [],
        upcoming: [],
        error: error instanceof Error ? error.message : 'Failed to fetch tournaments',
      },
      { status: 500 }
    );
  }
}
