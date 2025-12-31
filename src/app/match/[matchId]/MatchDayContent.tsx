'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLiveMatch, useLiveFantasyPoints } from '@/hooks/useLiveMatch';
import { MatchCenter, MatchNotStarted, MatchCompleted } from '@/components/match';

interface MatchDayContentProps {
  matchId: string;
}

export default function MatchDayContent({ matchId }: MatchDayContentProps) {
  const { matchData, isLoading, error, lastUpdated, newBallEvent } = useLiveMatch(matchId);
  const { points, changes } = useLiveFantasyPoints(matchId);
  const [recentChange, setRecentChange] = useState<{
    playerId: string;
    playerName: string;
    points: number;
    reason: string;
    timestamp: number;
  } | undefined>();

  // Track the most recent point change for notifications
  useEffect(() => {
    if (changes.length > 0) {
      const latest = changes[0];
      setRecentChange({
        playerId: latest.playerId,
        playerName: latest.playerName,
        points: latest.points,
        reason: latest.reason,
        timestamp: Date.now(),
      });
    }
  }, [changes]);

  // Build fantasy team data from points
  const fantasyTeam = useMemo(() => {
    if (Object.keys(points).length === 0) {
      return undefined;
    }

    const totalPoints = Object.values(points).reduce(
      (sum, player) => sum + player.points,
      0
    );

    const playerPoints: Record<
      string,
      { name: string; points: number; breakdown: { reason: string; points: number }[] }
    > = {};

    Object.entries(points).forEach(([playerId, data]) => {
      playerPoints[playerId] = {
        name: data.playerName,
        points: data.points,
        breakdown: data.breakdown,
      };
    });

    return {
      name: 'My Team', // Would come from actual team data
      totalPoints,
      rank: undefined, // Would come from leaderboard
      playerPoints,
    };
  }, [points]);

  if (isLoading && !matchData) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <MatchDaySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Match</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Match Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find this match. It may have been removed or the ID is incorrect.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </Link>
            <div>
              <h1 className="font-semibold">
                {matchData.teamHome.shortName} vs {matchData.teamAway.shortName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {matchData.status === 'live' && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Live
                    {lastUpdated && (
                      <span className="ml-2">
                        • Updated {formatTimeAgo(lastUpdated)}
                      </span>
                    )}
                  </span>
                )}
                {matchData.status === 'upcoming' && 'Match not started'}
                {matchData.status === 'completed' && 'Match completed'}
                {matchData.status === 'innings_break' && 'Innings break'}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/team/${matchId}`}
              className="text-sm px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Edit Team
            </Link>
            <Link
              href={`/contests?matchId=${matchId}`}
              className="text-sm px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Contests
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        {matchData.status === 'upcoming' && (
          <MatchNotStarted
            matchId={matchId}
            teamHome={matchData.teamHome}
            teamAway={matchData.teamAway}
            startTime={new Date(Date.now() + 1000 * 60 * 60)} // Placeholder
          />
        )}

        {(matchData.status === 'live' || matchData.status === 'innings_break') && (
          <MatchCenter
            matchData={matchData}
            fantasyTeam={fantasyTeam}
            recentPointsChange={recentChange}
          />
        )}

        {matchData.status === 'completed' && (
          <MatchCompleted matchData={matchData} fantasyTeam={fantasyTeam} />
        )}
      </main>

      {/* New ball animation overlay */}
      {newBallEvent && (
        <NewBallOverlay event={newBallEvent} />
      )}
    </div>
  );
}

function MatchDaySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary" />
        <div>
          <div className="h-5 w-40 bg-secondary rounded mb-2" />
          <div className="h-3 w-24 bg-secondary rounded" />
        </div>
      </div>

      {/* Scoreboard skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary" />
            <div>
              <div className="h-5 w-24 bg-secondary rounded mb-2" />
              <div className="h-3 w-16 bg-secondary rounded" />
            </div>
          </div>
          <div className="text-right">
            <div className="h-8 w-20 bg-secondary rounded mb-2" />
            <div className="h-4 w-24 bg-secondary rounded" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-4 w-full bg-secondary rounded" />
          <div className="h-4 w-3/4 bg-secondary rounded" />
        </div>
      </div>

      {/* Commentary skeleton */}
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <div className="h-5 w-32 bg-secondary rounded" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface NewBallOverlayProps {
  event: {
    runs: number;
    isWicket: boolean;
    batsmanName: string;
    bowlerName: string;
  };
}

function NewBallOverlay({ event }: NewBallOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [event]);

  if (!visible) return null;

  // Only show overlay for significant events
  if (!event.isWicket && event.runs < 4) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`
          p-8 rounded-2xl text-center animate-in zoom-in-50 fade-in duration-300
          ${event.isWicket ? 'bg-red-500' : event.runs === 6 ? 'bg-green-500' : 'bg-blue-500'}
          text-white shadow-2xl
        `}
      >
        <p className="text-6xl font-bold mb-2">
          {event.isWicket ? 'OUT!' : event.runs === 6 ? 'SIX!' : 'FOUR!'}
        </p>
        <p className="text-xl">
          {event.bowlerName} to {event.batsmanName}
        </p>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
