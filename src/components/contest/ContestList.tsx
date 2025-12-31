'use client';

import { useState, useEffect } from 'react';
import { ContestCard, ContestCardCompact } from './ContestCard';
import { cn } from '@/lib/utils';
import type { Contest, ContestType, ContestStatus } from '@/types';

interface ContestListProps {
  /** Pre-fetched contests (optional) */
  initialContests?: Contest[];
  /** Filter by type */
  type?: ContestType;
  /** Filter by status */
  status?: ContestStatus;
  /** Filter by match */
  matchId?: string;
  /** User's joined contest IDs */
  joinedContestIds?: string[];
  /** Display variant */
  variant?: 'cards' | 'compact';
  /** Show filters */
  showFilters?: boolean;
  /** Callback when joining a contest */
  onJoinContest?: (contestId: string) => void;
  className?: string;
}

/**
 * Contest list with filtering and loading states
 */
export function ContestList({
  initialContests,
  type: initialType,
  status: initialStatus,
  matchId,
  joinedContestIds = [],
  variant = 'cards',
  showFilters = true,
  onJoinContest,
  className,
}: ContestListProps) {
  const [contests, setContests] = useState<Contest[]>(initialContests || []);
  const [isLoading, setIsLoading] = useState(!initialContests);
  const [error, setError] = useState<string | null>(null);
  
  const [typeFilter, setTypeFilter] = useState<ContestType | 'all'>(initialType || 'all');
  const [statusFilter, setStatusFilter] = useState<ContestStatus | 'all'>(initialStatus || 'all');

  useEffect(() => {
    if (initialContests) return;

    async function fetchContests() {
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.set('type', typeFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (matchId) params.set('matchId', matchId);

        const res = await fetch(`/api/contests?${params}`);
        if (!res.ok) throw new Error('Failed to fetch contests');

        const data = await res.json();
        setContests(data.contests);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContests();
  }, [initialContests, typeFilter, statusFilter, matchId]);

  // Apply client-side filters to initialContests
  const filteredContests = initialContests
    ? contests.filter((c) => {
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        return true;
      })
    : contests;

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse bg-secondary rounded-xl',
              variant === 'cards' ? 'h-48' : 'h-16'
            )}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            {(['all', 'match', 'tournament', 'h2h'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  typeFilter === t
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'all' && 'All'}
                {t === 'match' && '🏏 Match'}
                {t === 'tournament' && '🏆 Tournament'}
                {t === 'h2h' && '⚔️ H2H'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            {(['all', 'upcoming', 'live', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s === 'live' && '● '}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredContests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No contests found</p>
          <p className="text-sm mt-1">
            {typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Check back later for new contests'}
          </p>
        </div>
      )}

      {/* Contest grid/list */}
      <div
        className={cn(
          variant === 'cards'
            ? 'grid gap-4 md:grid-cols-2'
            : 'space-y-2'
        )}
      >
        {filteredContests.map((contest) =>
          variant === 'cards' ? (
            <ContestCard
              key={contest.id}
              contest={contest}
              isJoined={joinedContestIds.includes(contest.id)}
              onJoin={() => onJoinContest?.(contest.id)}
            />
          ) : (
            <ContestCardCompact
              key={contest.id}
              contest={contest}
              isJoined={joinedContestIds.includes(contest.id)}
            />
          )
        )}
      </div>
    </div>
  );
}
