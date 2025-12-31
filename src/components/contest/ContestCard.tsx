'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Contest } from '@/types';

interface ContestCardProps {
  contest: Contest;
  isJoined?: boolean;
  onJoin?: () => void;
  className?: string;
}

/**
 * Card displaying contest info with join action
 */
export function ContestCard({
  contest,
  isJoined = false,
  onJoin,
  className,
}: ContestCardProps) {
  const typeLabels: Record<Contest['type'], string> = {
    tournament: '🏆 Tournament',
    match: '🏏 Match',
    h2h: '⚔️ Head to Head',
  };

  const statusColors: Record<Contest['status'], string> = {
    upcoming: 'bg-blue-500/10 text-blue-500',
    live: 'bg-red-500/10 text-red-500',
    completed: 'bg-gray-500/10 text-gray-500',
  };

  const isFull = contest.maxEntries !== null && 
    contest.currentEntries >= contest.maxEntries;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-all hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{contest.name}</h3>
          <p className="text-sm text-muted-foreground">
            {typeLabels[contest.type]}
          </p>
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium uppercase',
          statusColors[contest.status]
        )}>
          {contest.status === 'live' && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
          )}
          {contest.status}
        </span>
      </div>

      {/* Match info */}
      {contest.match && (
        <div className="mb-3 p-2 rounded-lg bg-secondary/50">
          <p className="text-sm font-medium text-center">
            {contest.match.teamHome} vs {contest.match.teamAway}
          </p>
          <p className="text-xs text-muted-foreground text-center mt-0.5">
            {new Date(contest.match.startTime).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Entry info */}
      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-muted-foreground">Entries</p>
            <p className="font-medium">
              {contest.currentEntries}
              {contest.maxEntries && ` / ${contest.maxEntries}`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Entry Fee</p>
            <p className="font-medium text-green-500">
              {contest.entryFee === 0 ? 'FREE' : `₹${contest.entryFee}`}
            </p>
          </div>
        </div>

        {/* Entry progress bar */}
        {contest.maxEntries && (
          <div className="w-20">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isFull ? 'bg-red-500' : 'bg-primary'
                )}
                style={{
                  width: `${(contest.currentEntries / contest.maxEntries) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-0.5">
              {isFull ? 'Full' : `${contest.maxEntries - contest.currentEntries} spots`}
            </p>
          </div>
        )}
      </div>

      {/* Prize description */}
      {contest.prizeDescription && (
        <p className="text-xs text-muted-foreground mb-4 italic">
          🎁 {contest.prizeDescription}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/contests/${contest.id}`}
          className="flex-1 text-center py-2 px-4 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
        >
          View Details
        </Link>
        
        {contest.status === 'upcoming' && !isJoined && !isFull && (
          <button
            onClick={onJoin}
            className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Join Contest
          </button>
        )}
        
        {isJoined && contest.status !== 'completed' && (
          <Link
            href={`/live/${contest.matchId}?contest=${contest.id}`}
            className="flex-1 text-center py-2 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
          >
            {contest.status === 'live' ? '📺 Watch Live' : '✓ Joined'}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Compact contest card for lists
 */
export function ContestCardCompact({
  contest,
  isJoined = false,
  className,
}: Omit<ContestCardProps, 'onJoin'>) {
  const statusColors: Record<Contest['status'], string> = {
    upcoming: 'text-blue-500',
    live: 'text-red-500',
    completed: 'text-gray-500',
  };

  return (
    <Link
      href={`/contests/${contest.id}`}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-all',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl">
          {contest.type === 'tournament' && '🏆'}
          {contest.type === 'match' && '🏏'}
          {contest.type === 'h2h' && '⚔️'}
        </div>
        <div>
          <p className="font-medium">{contest.name}</p>
          <p className="text-xs text-muted-foreground">
            {contest.currentEntries} entries • Free
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {isJoined && (
          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
            Joined
          </span>
        )}
        <span className={cn('text-xs font-medium', statusColors[contest.status])}>
          {contest.status === 'live' && '● '}
          {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
        </span>
      </div>
    </Link>
  );
}
