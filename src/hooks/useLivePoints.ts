'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PlayerPointsBreakdown {
  playerId: string;
  playerName: string;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  stats: {
    runsScored?: number;
    wickets?: number;
    catches?: number;
    [key: string]: number | undefined;
  };
  breakdown: string[];
}

interface LivePointsData {
  matchId: string;
  fantasyTeamId?: string;
  totalPoints: number;
  lastUpdated: string;
  playerBreakdown: PlayerPointsBreakdown[];
}

interface UseLivePointsOptions {
  matchId: string;
  fantasyTeamId?: string;
  /** Polling interval in seconds (default: 30) */
  pollInterval?: number;
  /** Enable polling only when match is live */
  pollOnlyWhenLive?: boolean;
  /** Initial enabled state */
  enabled?: boolean;
}

interface UseLivePointsReturn {
  /** Current points data */
  data: LivePointsData | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually refresh points */
  refresh: () => Promise<void>;
  /** Start polling for updates */
  startPolling: () => void;
  /** Stop polling for updates */
  stopPolling: () => void;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Previous total for comparison */
  previousTotal: number | null;
  /** Points gained since last update */
  pointsGained: number;
}

/**
 * Hook to fetch and poll for live fantasy points
 * 
 * @example
 * ```tsx
 * const { data, isLoading, startPolling } = useLivePoints({
 *   matchId: 'match-123',
 *   fantasyTeamId: 'team-456',
 *   pollInterval: 30,
 * });
 * 
 * useEffect(() => {
 *   if (matchIsLive) startPolling();
 * }, [matchIsLive]);
 * ```
 */
export function useLivePoints({
  matchId,
  fantasyTeamId,
  pollInterval = 30,
  pollOnlyWhenLive = true,
  enabled = true,
}: UseLivePointsOptions): UseLivePointsReturn {
  const [data, setData] = useState<LivePointsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [previousTotal, setPreviousTotal] = useState<number | null>(null);
  const [pointsGained, setPointsGained] = useState(0);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!matchId) return;

    try {
      const params = new URLSearchParams({ matchId });
      if (fantasyTeamId) {
        params.set('fantasyTeamId', fantasyTeamId);
      }

      const response = await fetch(`/api/scoring/live?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch points');
      }

      const newData: LivePointsData = await response.json();
      
      // Calculate points gained
      if (data?.totalPoints !== undefined) {
        const gained = newData.totalPoints - data.totalPoints;
        if (gained > 0) {
          setPointsGained(gained);
          setPreviousTotal(data.totalPoints);
          
          // Reset after animation
          setTimeout(() => setPointsGained(0), 3000);
        }
      }
      
      setData(newData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, fantasyTeamId, data?.totalPoints]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    
    setIsPolling(true);
    pollIntervalRef.current = setInterval(fetchPoints, pollInterval * 1000);
  }, [fetchPoints, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchPoints();
  }, [fetchPoints]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPoints();
    }
  }, [enabled, matchId, fantasyTeamId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh,
    startPolling,
    stopPolling,
    isPolling,
    previousTotal,
    pointsGained,
  };
}

/**
 * Hook to fetch all player points for a match (no fantasy team required)
 */
export function useMatchPoints(matchId: string, enabled = true) {
  const [data, setData] = useState<{
    matchId: string;
    lastUpdated: string;
    players: Array<{
      playerId: string;
      playerName: string;
      role: string;
      team: string;
      points: number;
      stats: Record<string, number>;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!matchId) return;

    try {
      const response = await fetch(`/api/scoring/live?matchId=${matchId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch points');
      }

      const pointsData = await response.json();
      setData(pointsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (enabled) {
      fetchPoints();
    }
  }, [enabled, matchId]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchPoints,
  };
}
