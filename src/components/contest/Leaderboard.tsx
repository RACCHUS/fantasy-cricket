'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  previousRank?: number | null;
  rankChange?: 'up' | 'down' | 'same' | 'new';
  entryId: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  teamId?: string;
  teamName: string;
  points: number;
  isCurrentUser: boolean;
}

interface LeaderboardProps {
  contestId: string;
  /** Polling interval in seconds (0 = no polling) */
  pollInterval?: number;
  /** Max entries to show initially */
  initialLimit?: number;
  /** Show full width or compact */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Real-time leaderboard with rank change animations
 */
export function Leaderboard({
  contestId,
  pollInterval = 0,
  initialLimit = 20,
  variant = 'full',
  className,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(initialLimit);
  const [hasMore, setHasMore] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>('upcoming');

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/contests/${contestId}/leaderboard?limit=${limit}`
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await res.json();
      setEntries(data.leaderboard);
      setTotalEntries(data.totalEntries);
      setCurrentUserEntry(data.currentUserEntry);
      setHasMore(data.pagination.hasMore);
      setMatchStatus(data.matchStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [contestId, limit]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Polling
  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(fetchLeaderboard, pollInterval * 1000);
    return () => clearInterval(interval);
  }, [pollInterval, fetchLeaderboard]);

  const loadMore = () => {
    setLimit((prev) => prev + 20);
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className={cn('animate-pulse space-y-2', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-secondary rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="text-primary hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('text-center py-12 text-muted-foreground', className)}>
        <p>No entries yet</p>
        <p className="text-sm mt-1">Be the first to join!</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground uppercase">
        <div className="flex items-center gap-4">
          <span className="w-8 text-center">#</span>
          <span>Player</span>
        </div>
        <span>Points</span>
      </div>

      {/* Entries */}
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.entryId}
            entry={entry}
            variant={variant}
            isTop3={index < 3}
          />
        ))}
      </div>

      {/* Current user if not visible */}
      {currentUserEntry && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-xs text-muted-foreground mb-2 px-3">Your position</p>
          <LeaderboardRow
            entry={currentUserEntry}
            variant={variant}
            isTop3={currentUserEntry.rank <= 3}
          />
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            className="text-sm text-primary hover:underline"
          >
            Load more ({totalEntries - entries.length} remaining)
          </button>
        </div>
      )}

      {/* Live indicator */}
      {matchStatus === 'live' && pollInterval > 0 && (
        <div className="text-center pt-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Auto-updating every {pollInterval}s
          </span>
        </div>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  variant: 'full' | 'compact';
  isTop3: boolean;
}

function LeaderboardRow({ entry, variant, isTop3 }: LeaderboardRowProps) {
  const rankColors = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-amber-600',
  };

  const rankColor = rankColors[entry.rank as keyof typeof rankColors] || '';

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-lg transition-all',
        entry.isCurrentUser && 'bg-primary/10 border border-primary/20',
        !entry.isCurrentUser && 'hover:bg-secondary/50',
        isTop3 && !entry.isCurrentUser && 'bg-secondary/30'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="w-8 flex items-center justify-center gap-1">
          <span className={cn('font-bold', rankColor, isTop3 && 'text-lg')}>
            {entry.rank}
          </span>
          {entry.rankChange && entry.rankChange !== 'same' && (
            <RankChangeIndicator change={entry.rankChange} />
          )}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
          {entry.avatarUrl ? (
            <img
              src={entry.avatarUrl}
              alt={entry.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium">
              {entry.username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name */}
        <div className={variant === 'compact' ? '' : ''}>
          <p className={cn(
            'font-medium',
            entry.isCurrentUser && 'text-primary'
          )}>
            {entry.username}
            {entry.isCurrentUser && (
              <span className="ml-1 text-xs text-muted-foreground">(You)</span>
            )}
          </p>
          {variant === 'full' && (
            <p className="text-xs text-muted-foreground">{entry.teamName}</p>
          )}
        </div>
      </div>

      {/* Points */}
      <span className={cn(
        'font-bold tabular-nums',
        isTop3 && 'text-lg',
        rankColor
      )}>
        {entry.points}
      </span>
    </div>
  );
}

function RankChangeIndicator({ change }: { change: 'up' | 'down' | 'new' }) {
  if (change === 'new') {
    return (
      <span className="text-xs text-blue-500 font-medium">NEW</span>
    );
  }

  if (change === 'up') {
    return (
      <span className="text-green-500 text-xs animate-bounce">▲</span>
    );
  }

  return (
    <span className="text-red-500 text-xs">▼</span>
  );
}

/**
 * Mini leaderboard for dashboard cards
 */
export function MiniLeaderboard({
  contestId,
  limit = 5,
  className,
}: {
  contestId: string;
  limit?: number;
  className?: string;
}) {
  return (
    <Leaderboard
      contestId={contestId}
      initialLimit={limit}
      variant="compact"
      pollInterval={0}
      className={className}
    />
  );
}
