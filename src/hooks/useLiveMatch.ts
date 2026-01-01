'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface BallEvent {
  id: string;
  over: number;
  ball: number;
  ballNumber: number; // Alias for ball for compatibility
  runs: number;
  extras?: {
    type: 'wide' | 'noball' | 'bye' | 'legbye';
    runs: number;
  };
  isWicket: boolean;
  wicketType?: string;
  batsmanId: string;
  batsmanName: string;
  bowlerId: string;
  bowlerName: string;
  commentary: string;
  timestamp: string;
  fantasyPoints?: Record<string, number>; // Player ID to points
}

export interface BattingStats {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOnStrike: boolean;
  isOut: boolean;
  dismissal?: string;
}

export interface BowlingStats {
  playerId: string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  isBowling: boolean;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  shortName: string;
  runs: number;
  wickets: number;
  overs: number;
  runRate: number;
  batting: BattingStats[];
  bowling: BowlingStats[];
}

export interface LiveMatchData {
  matchId: string;
  status: 'upcoming' | 'live' | 'innings_break' | 'completed';
  currentInnings: 1 | 2;
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
  teamHome: TeamScore;
  teamAway: TeamScore;
  battingTeamId: string;
  bowlingTeamId: string;
  target?: number;
  requiredRunRate?: number;
  lastBall?: BallEvent;
  recentBalls: BallEvent[];
  lastUpdated: string;
}

interface UseLiveMatchOptions {
  matchId: string;
  /** Polling interval in seconds (default: 3600 = 1 hour)
   * IMPORTANT: CricketData.org has 100 requests/day limit!
   * For a 3-hour match: 3 requests
   */
  pollInterval?: number;
  /** Enable polling */
  enabled?: boolean;
}

interface UseLiveMatchReturn {
  matchData: LiveMatchData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
  /** New ball event since last update */
  newBallEvent: BallEvent | null;
}

/**
 * Hook to fetch and poll for live match data
 * Can be called with just matchId string or full options object
 */
export function useLiveMatch(
  matchIdOrOptions: string | UseLiveMatchOptions
): UseLiveMatchReturn {
  const options: UseLiveMatchOptions = typeof matchIdOrOptions === 'string' 
    ? { matchId: matchIdOrOptions } 
    : matchIdOrOptions;
  
  const { matchId, pollInterval = 3600, enabled = true } = options; // 1 hour (API limit: 100/day)
  
  const [data, setData] = useState<LiveMatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [newBallEvent, setNewBallEvent] = useState<BallEvent | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBallIdRef = useRef<string | null>(null);

  const fetchMatchData = useCallback(async () => {
    if (!matchId) return;

    try {
      const response = await fetch(`/api/match/${matchId}/live`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch match data');
      }

      const matchData: LiveMatchData = await response.json();
      
      // Check for new ball event
      if (matchData.lastBall && matchData.lastBall.id !== lastBallIdRef.current) {
        if (lastBallIdRef.current !== null) {
          // This is a new ball, not the initial load
          setNewBallEvent(matchData.lastBall);
          // Clear after animation
          setTimeout(() => setNewBallEvent(null), 3000);
        }
        lastBallIdRef.current = matchData.lastBall.id;
      }
      
      setData(matchData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    
    setIsPolling(true);
    pollIntervalRef.current = setInterval(fetchMatchData, pollInterval * 1000);
  }, [fetchMatchData, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchMatchData();
  }, [fetchMatchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchMatchData();
    }
  }, [enabled, matchId]);

  // Auto-start polling when match is live
  useEffect(() => {
    if (data?.status === 'live' && enabled && !isPolling) {
      startPolling();
    } else if (data?.status !== 'live' && isPolling) {
      stopPolling();
    }
  }, [data?.status, enabled, isPolling, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    matchData: data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    startPolling,
    stopPolling,
    isPolling,
    newBallEvent,
  };
}

interface PlayerPointsData {
  playerName: string;
  points: number;
  breakdown: { reason: string; points: number }[];
}

interface PointsChange {
  playerId: string;
  playerName: string;
  points: number;
  reason: string;
  timestamp: number;
}

/**
 * Hook to track fantasy points changes during live match
 */
export function useLiveFantasyPoints(
  matchId: string,
  fantasyTeamId?: string,
  enabled = true
) {
  const [points, setPoints] = useState<Record<string, PlayerPointsData>>({});
  const [changes, setChanges] = useState<PointsChange[]>([]);
  const previousPointsRef = useRef<Record<string, number>>({});

  const fetchPoints = useCallback(async () => {
    if (!matchId) return;

    try {
      const url = fantasyTeamId 
        ? `/api/scoring/live?matchId=${matchId}&fantasyTeamId=${fantasyTeamId}`
        : `/api/scoring/live?matchId=${matchId}`;
      
      const res = await fetch(url);
      
      if (!res.ok) return;

      const data = await res.json();
      
      const newPoints: Record<string, PlayerPointsData> = {};
      const newChanges: PointsChange[] = [];
      
      // Process player breakdown
      data.playerBreakdown?.forEach((p: { 
        playerId: string; 
        playerName: string;
        points: number;
        breakdown?: { reason: string; points: number }[];
      }) => {
        newPoints[p.playerId] = {
          playerName: p.playerName || 'Unknown',
          points: p.points,
          breakdown: p.breakdown || [],
        };
        
        // Check for point changes
        const prevPoints = previousPointsRef.current[p.playerId] || 0;
        if (prevPoints !== p.points && prevPoints !== 0) {
          const diff = p.points - prevPoints;
          newChanges.push({
            playerId: p.playerId,
            playerName: p.playerName || 'Unknown',
            points: diff,
            reason: p.breakdown?.[0]?.reason || 'Points updated',
            timestamp: Date.now(),
          });
        }
        previousPointsRef.current[p.playerId] = p.points;
      });
      
      setPoints(newPoints);
      if (newChanges.length > 0) {
        setChanges(prev => [...newChanges, ...prev].slice(0, 20));
      }
    } catch {
      // Silently fail for points updates
    }
  }, [matchId, fantasyTeamId]);

  useEffect(() => {
    if (!enabled) return;
    
    fetchPoints();
    const interval = setInterval(fetchPoints, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [enabled, fetchPoints]);

  return {
    points,
    changes,
    refresh: fetchPoints,
  };
}
