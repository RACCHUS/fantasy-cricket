import { NextRequest, NextResponse } from 'next/server';
import { getCricketAPI } from '@/lib/cricket-api';
import type { APIMatch, APILiveMatch } from '@/lib/cricket-api';

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

/**
 * GET /api/match/[matchId]/live - Get live match data
 * Returns current match state, scores, and recent ball events
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params;
    const cricket = getCricketAPI();

    // Try to get live score first, fallback to basic match info
    let matchInfo: APIMatch | APILiveMatch | null = await cricket.getLiveScore(matchId);
    
    if (!matchInfo) {
      matchInfo = await cricket.getMatch(matchId);
    }
    
    if (!matchInfo) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Build live match response
    const liveData = {
      matchId,
      status: matchInfo.status,
      currentInnings: 1 as const,
      teamHome: {
        teamId: matchInfo.teamA.id,
        teamName: matchInfo.teamA.name,
        shortName: matchInfo.teamA.shortName || getShortName(matchInfo.teamA.name),
        runs: matchInfo.score?.teamA?.runs || 0,
        wickets: matchInfo.score?.teamA?.wickets || 0,
        overs: matchInfo.score?.teamA?.overs || 0,
        runRate: matchInfo.score?.teamA?.runRate || 0,
        batting: getBattingStats(matchInfo),
        bowling: [],
      },
      teamAway: {
        teamId: matchInfo.teamB.id,
        teamName: matchInfo.teamB.name,
        shortName: matchInfo.teamB.shortName || getShortName(matchInfo.teamB.name),
        runs: matchInfo.score?.teamB?.runs || 0,
        wickets: matchInfo.score?.teamB?.wickets || 0,
        overs: matchInfo.score?.teamB?.overs || 0,
        runRate: matchInfo.score?.teamB?.runRate || 0,
        batting: [],
        bowling: getBowlingStats(matchInfo),
      },
      battingTeamId: getBattingTeamId(matchInfo),
      bowlingTeamId: getBowlingTeamId(matchInfo),
      target: getTarget(matchInfo),
      recentBalls: getRecentBalls(matchInfo),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(liveData);
  } catch (error) {
    console.error('Error fetching live match data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live match data' },
      { status: 500 }
    );
  }
}

function getShortName(teamName: string): string {
  // Common team abbreviations
  const abbreviations: Record<string, string> = {
    'Mumbai Indians': 'MI',
    'Chennai Super Kings': 'CSK',
    'Royal Challengers Bangalore': 'RCB',
    'Kolkata Knight Riders': 'KKR',
    'Delhi Capitals': 'DC',
    'Punjab Kings': 'PBKS',
    'Rajasthan Royals': 'RR',
    'Sunrisers Hyderabad': 'SRH',
    'Lucknow Super Giants': 'LSG',
    'Gujarat Titans': 'GT',
    'India': 'IND',
    'Australia': 'AUS',
    'England': 'ENG',
    'South Africa': 'SA',
    'New Zealand': 'NZ',
    'Pakistan': 'PAK',
    'West Indies': 'WI',
    'Sri Lanka': 'SL',
    'Bangladesh': 'BAN',
    'Afghanistan': 'AFG',
  };

  if (abbreviations[teamName]) {
    return abbreviations[teamName];
  }

  // Generate abbreviation from team name
  const words = teamName.split(' ');
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
  
  return teamName.substring(0, 3).toUpperCase();
}

function getBattingStats(matchInfo: APIMatch | APILiveMatch) {
  // Check if this is a live match with batting stats
  if ('currentBatsmen' in matchInfo && matchInfo.currentBatsmen) {
    return matchInfo.currentBatsmen.map(b => ({
      playerId: b.playerId,
      playerName: b.name,
      runs: b.runs,
      balls: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      strikeRate: b.strikeRate,
      isOnStrike: b.isOnStrike,
      isOut: false,
    }));
  }
  return [];
}

function getBowlingStats(matchInfo: APIMatch | APILiveMatch) {
  // Check if this is a live match with bowling stats
  if ('currentBowler' in matchInfo && matchInfo.currentBowler) {
    const bowler = matchInfo.currentBowler;
    return [{
      playerId: bowler.playerId,
      playerName: bowler.name,
      overs: bowler.overs,
      maidens: bowler.maidens,
      runs: bowler.runs,
      wickets: bowler.wickets,
      economy: bowler.economy,
      isBowling: true,
    }];
  }
  return [];
}

function getBattingTeamId(matchInfo: APIMatch | APILiveMatch): string {
  // Determine which team is batting based on innings and score
  const teamAScore = matchInfo.score?.teamA;
  const teamBScore = matchInfo.score?.teamB;
  
  // If team B has started batting (2nd innings), they're batting
  if (teamBScore && teamBScore.overs > 0) {
    return matchInfo.teamB.id;
  }
  
  // Otherwise team A is batting
  return matchInfo.teamA.id;
}

function getBowlingTeamId(matchInfo: APIMatch | APILiveMatch): string {
  const battingTeamId = getBattingTeamId(matchInfo);
  return battingTeamId === matchInfo.teamA.id ? matchInfo.teamB.id : matchInfo.teamA.id;
}

function getTarget(matchInfo: APIMatch | APILiveMatch): number | undefined {
  // If in 2nd innings, target is team A's score + 1
  const teamAScore = matchInfo.score?.teamA;
  const teamBScore = matchInfo.score?.teamB;
  
  if (teamBScore && teamBScore.overs > 0 && teamAScore) {
    return teamAScore.runs + 1;
  }
  
  return undefined;
}

function getRecentBalls(matchInfo: APIMatch | APILiveMatch) {
  // Check if this is a live match with recent overs
  if ('recentOvers' in matchInfo && matchInfo.recentOvers) {
    const balls = matchInfo.recentOvers.slice(-6);
    let ballNumber = 0;
    const currentOver = Math.floor(matchInfo.score?.teamA?.overs || 0);
    
    return balls.map((ball): {
      id: string;
      over: number;
      ball: number;
      ballNumber: number;
      runs: number;
      isWicket: boolean;
      batsmanId: string;
      batsmanName: string;
      bowlerId: string;
      bowlerName: string;
      commentary: string;
      timestamp: string;
    } => {
      ballNumber++;
      const isWicket = ball === 'W';
      const runs = isWicket ? 0 : parseInt(ball) || 0;
      
      return {
        id: `${currentOver}.${ballNumber}`,
        over: currentOver,
        ball: ballNumber,
        ballNumber,
        runs,
        isWicket,
        batsmanId: '',
        batsmanName: 'Batsman',
        bowlerId: '',
        bowlerName: 'Bowler',
        commentary: isWicket ? 'WICKET!' : runs > 0 ? `${runs} runs` : 'No run',
        timestamp: new Date().toISOString(),
      };
    });
  }
  return [];
}
