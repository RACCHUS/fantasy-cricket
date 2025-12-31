'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaderboard } from '@/components/contest';
import { cn } from '@/lib/utils';
import type { Contest } from '@/types';

interface ContestDetailContentProps {
  contestId: string;
  userId: string;
  isJoined: boolean;
  currentEntryId?: string;
  currentTeamId?: string;
  userTeams: { id: string; name: string }[];
  matchId?: string;
}

export function ContestDetailContent({
  contestId,
  userId,
  isJoined: initialIsJoined,
  currentEntryId,
  currentTeamId,
  userTeams,
  matchId,
}: ContestDetailContentProps) {
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(currentTeamId || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContest() {
      try {
        const res = await fetch(`/api/contests/${contestId}`);
        if (!res.ok) throw new Error('Failed to fetch contest');
        
        const data = await res.json();
        setContest(data.contest);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContest();
  }, [contestId]);

  const handleJoin = async () => {
    if (userTeams.length === 0) {
      // No teams, redirect to team builder
      router.push(`/team/${matchId}?contest=${contestId}`);
      return;
    }

    if (userTeams.length === 1) {
      // Only one team, use it directly
      await joinWithTeam(userTeams[0].id);
      return;
    }

    // Multiple teams, show selector
    setShowTeamSelector(true);
  };

  const joinWithTeam = async (teamId: string) => {
    setIsJoining(true);
    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fantasyTeamId: teamId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join');
      }

      setIsJoined(true);
      setShowTeamSelector(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this contest?')) return;

    try {
      const res = await fetch(`/api/contests/${contestId}/join`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to leave');
      }

      setIsJoined(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/2" />
          <div className="h-32 bg-secondary rounded-xl" />
          <div className="h-64 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500 mb-4">{error || 'Contest not found'}</p>
        <Link href="/contests" className="text-primary hover:underline">
          ← Back to Contests
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-500/10 text-blue-500',
    live: 'bg-red-500/10 text-red-500',
    completed: 'bg-gray-500/10 text-gray-500',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/contests"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
      </div>

      {/* Contest Info Card */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{contest.name}</h1>
            <p className="text-muted-foreground">
              {contest.type === 'tournament' && '🏆 Tournament Contest'}
              {contest.type === 'match' && '🏏 Match Contest'}
              {contest.type === 'h2h' && '⚔️ Head to Head'}
            </p>
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            statusColors[contest.status]
          )}>
            {contest.status === 'live' && (
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />
            )}
            {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
          </span>
        </div>

        {/* Match info */}
        {contest.match && (
          <div className="p-4 rounded-lg bg-secondary/50 mb-4">
            <p className="text-lg font-semibold text-center">
              {contest.match.teamHome} vs {contest.match.teamAway}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {new Date(contest.match.startTime).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{contest.currentEntries}</p>
            <p className="text-xs text-muted-foreground">
              {contest.maxEntries ? `/ ${contest.maxEntries}` : ''} Entries
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">FREE</p>
            <p className="text-xs text-muted-foreground">Entry Fee</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">🏆</p>
            <p className="text-xs text-muted-foreground">Glory & Pride</p>
          </div>
        </div>

        {/* Prize description */}
        {contest.prizeDescription && (
          <p className="text-sm text-muted-foreground italic mb-4">
            🎁 {contest.prizeDescription}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {contest.status === 'upcoming' && !isJoined && (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1 py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Contest'}
            </button>
          )}

          {isJoined && contest.status !== 'completed' && (
            <>
              <Link
                href={`/live/${matchId}?contest=${contestId}`}
                className="flex-1 text-center py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
              >
                {contest.status === 'live' ? '📺 Watch Live' : '✓ Joined'}
              </Link>
              {contest.status === 'upcoming' && (
                <button
                  onClick={handleLeave}
                  className="py-3 px-4 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Leave
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Team Selector Modal */}
      {showTeamSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Select Your Team</h3>
            <div className="space-y-2 mb-4">
              {userTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={cn(
                    'w-full p-3 rounded-lg border text-left transition-colors',
                    selectedTeamId === team.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-secondary'
                  )}
                >
                  {team.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTeamSelector(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => joinWithTeam(selectedTeamId)}
                disabled={!selectedTeamId || isJoining}
                className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-bold mb-4">Leaderboard</h2>
        <Leaderboard
          contestId={contestId}
          pollInterval={contest.status === 'live' ? 30 : 0}
          initialLimit={20}
          variant="full"
        />
      </div>
    </div>
  );
}
