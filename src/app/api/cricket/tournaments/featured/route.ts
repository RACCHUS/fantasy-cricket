import { NextResponse } from 'next/server';

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

interface TournamentInfo {
  upcoming: ApiTournament | null;
  completed: ApiTournament | null;
}

interface FeaturedTournaments {
  ipl: TournamentInfo;
  t20WorldCup: TournamentInfo;
  odiWorldCup: TournamentInfo;
  wtcFinal: TournamentInfo;
  championsTrophy: TournamentInfo;
  cpl: TournamentInfo;
  bbl: TournamentInfo;
  psl: TournamentInfo;
}

async function searchTournaments(search: string): Promise<ApiTournament[]> {
  try {
    const response = await fetch(
      `${CRICKET_API_BASE}/series?apikey=${CRICKET_API_KEY}&search=${encodeURIComponent(search)}`,
      { next: { revalidate: CACHE_DURATION } } // Cache for 6 hours
    );
    if (!response.ok) return [];
    const json = await response.json();
    return json.data || [];
  } catch {
    return [];
  }
}

function parseEndDate(startDate: Date, endDateStr: string): Date {
  // Handle full date strings
  if (endDateStr.includes('202')) {
    return new Date(endDateStr);
  }
  // Handle partial dates like "Mar 09" - infer year from start date
  const endYear = startDate.getMonth() >= 10 && endDateStr.match(/^(Jan|Feb|Mar)/)
    ? startDate.getFullYear() + 1
    : startDate.getFullYear();
  return new Date(`${endDateStr} ${endYear}`);
}

function categorizeTournament(
  tournaments: ApiTournament[],
  now: Date
): TournamentInfo {
  let upcoming: ApiTournament | null = null;
  let completed: ApiTournament | null = null;

  for (const t of tournaments) {
    const startDate = new Date(t.startDate);
    if (isNaN(startDate.getTime())) continue;
    
    const endDate = parseEndDate(startDate, t.endDate);

    if (now > endDate) {
      // Completed - get most recent
      if (!completed || startDate > new Date(completed.startDate)) {
        completed = t;
      }
    } else if (now < startDate) {
      // Upcoming - get soonest
      if (!upcoming || startDate < new Date(upcoming.startDate)) {
        upcoming = t;
      }
    } else {
      // Currently live - treat as upcoming (active)
      upcoming = t;
    }
  }

  return { upcoming, completed };
}

export async function GET() {
  try {
    const now = new Date();

    // Search for major tournaments in parallel
    const [
      iplResults,
      t20WcResults,
      odiWcResults,
      wtcResults,
      ctResults,
      cplResults,
      bblResults,
      pslResults,
    ] = await Promise.all([
      searchTournaments('Indian Premier League'),
      searchTournaments('ICC Mens T20 World Cup'),
      searchTournaments('ICC Cricket World Cup'),
      searchTournaments('ICC World Test Championship Final'),
      searchTournaments('ICC Champions Trophy'),
      searchTournaments('Caribbean Premier League'),
      searchTournaments('Big Bash League'),
      searchTournaments('Pakistan Super League'),
    ]);

    // Filter to only main tournaments (not qualifiers, warm-ups, etc.)
    const filterMain = (tournaments: ApiTournament[], mustInclude: string[], exclude: string[] = []) => {
      return tournaments.filter(t => {
        const name = t.name.toLowerCase();
        const includesRequired = mustInclude.some(term => name.includes(term.toLowerCase()));
        const excludesTerms = exclude.some(term => name.includes(term.toLowerCase()));
        return includesRequired && !excludesTerms;
      });
    };

    // IPL - filter out women's
    const ipl = categorizeTournament(
      filterMain(iplResults, ['indian premier league'], ['women']),
      now
    );

    // T20 World Cup - main tournament only, not qualifiers
    const t20WorldCup = categorizeTournament(
      filterMain(t20WcResults, ['icc mens t20 world cup'], ['qualifier', 'warm-up', 'regional', 'sub regional', 'sub-regional']),
      now
    );

    // ODI World Cup - main tournament only
    const odiWorldCup = categorizeTournament(
      filterMain(odiWcResults, ['cricket world cup', 'world cup'], ['t20', 'qualifier', 'warm-up', 'women', 'u19', 'under']),
      now
    );

    // World Test Championship Final
    const wtcFinal = categorizeTournament(
      filterMain(wtcResults, ['world test championship final'], []),
      now
    );

    // Champions Trophy - main tournament only
    const championsTrophy = categorizeTournament(
      filterMain(ctResults, ['icc champions trophy'], ['qualifier', 'warm-up', 'asia pacific']),
      now
    );

    // CPL
    const cpl = categorizeTournament(
      filterMain(cplResults, ['caribbean premier league'], ['women']),
      now
    );

    // BBL
    const bbl = categorizeTournament(
      filterMain(bblResults, ['big bash league'], ['women']),
      now
    );

    // PSL
    const psl = categorizeTournament(
      filterMain(pslResults, ['pakistan super league'], ['women']),
      now
    );

    const featured: FeaturedTournaments = {
      ipl,
      t20WorldCup,
      odiWorldCup,
      wtcFinal,
      championsTrophy,
      cpl,
      bbl,
      psl,
    };

    return NextResponse.json(
      {
        featured,
        timestamp: now.toISOString(),
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
    console.error('Error fetching featured tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured tournaments', featured: null },
      { status: 500 }
    );
  }
}
