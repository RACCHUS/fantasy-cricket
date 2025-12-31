'use client';

import { useLivePoints } from '@/hooks/useLivePoints';
import {
  LiveScoreCard,
  TeamPointsSummary,
} from './LivePointsDisplay';
import { cn } from '@/lib/utils';

interface LiveMatchScoreboardProps {
  matchId: string;
  fantasyTeamId: string;
  isMatchLive?: boolean;
  className?: string;
}

/**
 * Full scoreboard showing live fantasy points for a team
 * Auto-polls when match is live
 */
export function LiveMatchScoreboard({
  matchId,
  fantasyTeamId,
  isMatchLive = false,
  className,
}: LiveMatchScoreboardProps) {
  const {
    data,
    isLoading,
    error,
    refresh,
    startPolling,
    stopPolling,
    isPolling,
    previousTotal,
    pointsGained,
  } = useLivePoints({
    matchId,
    fantasyTeamId,
    pollInterval: 30,
  });

  // Auto-start polling when match is live
  if (isMatchLive && !isPolling) {
    startPolling();
  } else if (!isMatchLive && isPolling) {
    stopPolling();
  }

  if (isLoading && !data) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-24 bg-secondary rounded-xl" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const playersWithStats = data.playerBreakdown.filter(
    (p) => p.breakdown.length > 0
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary header */}
      <TeamPointsSummary
        totalPoints={data.totalPoints}
        previousTotal={previousTotal ?? undefined}
        playerCount={playersWithStats.length}
        lastUpdated={data.lastUpdated}
        isLive={isMatchLive}
      />

      {/* Points gained toast */}
      {pointsGained > 0 && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce z-50">
          +{pointsGained} points! 🎉
        </div>
      )}

      {/* Player cards */}
      <div className="space-y-2">
        {data.playerBreakdown.map((player) => (
          <LiveScoreCard
            key={player.playerId}
            playerName={player.playerName}
            points={player.points}
            isCaptain={player.isCaptain}
            isViceCaptain={player.isViceCaptain}
            stats={{
              runsScored: player.stats.runsScored,
              wickets: player.stats.wickets,
              catches: player.stats.catches,
            }}
            breakdown={player.breakdown}
          />
        ))}
      </div>

      {/* Manual refresh button */}
      <div className="text-center">
        <button
          onClick={refresh}
          disabled={isLoading}
          className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>
    </div>
  );
}

interface MatchLeaderboardProps {
  matchId: string;
  className?: string;
}

/**
 * Leaderboard showing all player points in a match
 * Used to see who's scoring big across all players
 */
export function MatchLeaderboard({
  matchId,
  className,
}: MatchLeaderboardProps) {
  const { data, isLoading, error, refresh } = useLivePoints({
    matchId,
    pollInterval: 60,
  });

  if (isLoading && !data) {
    return (
      <div className={cn('animate-pulse space-y-2', className)}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 bg-secondary rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refresh} className="text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  // Access players from the non-team response
  const players = (data as unknown as { players?: Array<{
    playerId: string;
    playerName: string;
    role: string;
    team: string;
    points: number;
  }> })?.players || [];

  if (players.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No player stats available yet
      </div>
    );
  }

  const roleIcons: Record<string, string> = {
    batsman: '🏏',
    bowler: '🎯',
    'all-rounder': '⚡',
    'wicket-keeper': '🧤',
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground uppercase">
        <span>Player</span>
        <span>Points</span>
      </div>
      
      {players.map((player, index) => (
        <div
          key={player.playerId}
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg',
            index < 3 && 'bg-primary/5',
            index === 0 && 'bg-yellow-500/10 border border-yellow-500/20'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 text-center text-sm text-muted-foreground">
              {index + 1}
            </span>
            <span>{roleIcons[player.role] || '•'}</span>
            <div>
              <p className="font-medium text-sm">{player.playerName}</p>
              <p className="text-xs text-muted-foreground">{player.team}</p>
            </div>
          </div>
          <span className={cn(
            'font-bold',
            index === 0 && 'text-yellow-500',
            index === 1 && 'text-gray-400',
            index === 2 && 'text-amber-600'
          )}>
            {player.points}
          </span>
        </div>
      ))}
    </div>
  );
}
