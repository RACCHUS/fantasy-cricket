'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LiveScoreboard, RecentBalls, MiniScoreboard } from './LiveScoreboard';
import { CommentaryFeed, CompactCommentary } from './CommentaryFeed';
import { TotalPointsDisplay, PointsBreakdownLive, FloatingPointsNotification } from './PointsTicker';
import type { LiveMatchData, BallEvent } from '@/hooks/useLiveMatch';

interface MatchCenterProps {
  matchData: LiveMatchData;
  fantasyTeam?: {
    name: string;
    totalPoints: number;
    previousPoints?: number;
    rank?: number;
    playerPoints: Record<string, { name: string; points: number; breakdown: { reason: string; points: number }[] }>;
  };
  recentPointsChange?: {
    playerId: string;
    playerName: string;
    points: number;
    reason: string;
    timestamp: number;
  };
  className?: string;
}

/**
 * Main match center component combining scoreboard, commentary, and fantasy points
 */
export function MatchCenter({
  matchData,
  fantasyTeam,
  recentPointsChange,
  className,
}: MatchCenterProps) {
  const {
    status,
    currentInnings,
    teamHome,
    teamAway,
    battingTeamId,
    target,
    recentBalls,
  } = matchData;

  // Determine which team is batting/bowling
  const battingTeam = battingTeamId === teamHome.teamId ? teamHome : teamAway;
  const bowlingTeam = battingTeamId === teamHome.teamId ? teamAway : teamHome;

  // Calculate required run rate for 2nd innings
  const requiredRunRate = useMemo(() => {
    if (currentInnings === 2 && target) {
      const runsNeeded = target - battingTeam.runs;
      const ballsRemaining = 120 - Math.floor(battingTeam.overs * 6);
      if (ballsRemaining > 0) {
        return (runsNeeded / ballsRemaining) * 6;
      }
    }
    return undefined;
  }, [currentInnings, target, battingTeam]);

  // Get current over balls
  const currentOverBalls = useMemo(() => {
    const currentOver = Math.floor(battingTeam.overs);
    return recentBalls.filter(ball => ball.over === currentOver);
  }, [battingTeam.overs, recentBalls]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Floating notification for live points */}
      {recentPointsChange && (
        <FloatingPointsNotification change={recentPointsChange} />
      )}

      {/* Header with mini scoreboards */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MiniScoreboard
            teamName={teamHome.teamName}
            shortName={teamHome.shortName}
            runs={teamHome.runs}
            wickets={teamHome.wickets}
            overs={teamHome.overs}
            isBatting={battingTeamId === teamHome.teamId}
          />
          <span className="text-muted-foreground font-medium">vs</span>
          <MiniScoreboard
            teamName={teamAway.teamName}
            shortName={teamAway.shortName}
            runs={teamAway.runs}
            wickets={teamAway.wickets}
            overs={teamAway.overs}
            isBatting={battingTeamId === teamAway.teamId}
          />
        </div>
        
        {/* Fantasy points summary */}
        {fantasyTeam && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
            <span className="text-sm text-muted-foreground">Your points:</span>
            <span className="font-bold text-primary">{fantasyTeam.totalPoints}</span>
            {fantasyTeam.rank && (
              <span className="text-xs text-muted-foreground">
                (Rank #{fantasyTeam.rank})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main scoreboard */}
        <div className="lg:col-span-2 space-y-4">
          <LiveScoreboard
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            currentInnings={currentInnings}
            target={target}
            requiredRunRate={requiredRunRate}
            status={status}
          />

          {/* Recent balls */}
          {status === 'live' && currentOverBalls.length > 0 && (
            <div className="p-4 rounded-xl border bg-card">
              <RecentBalls balls={currentOverBalls} />
            </div>
          )}

          {/* Commentary feed */}
          <CommentaryFeed events={recentBalls} maxItems={15} />
        </div>

        {/* Right column - Fantasy points */}
        <div className="space-y-4">
          {fantasyTeam ? (
            <>
              <TotalPointsDisplay
                totalPoints={fantasyTeam.totalPoints}
                previousPoints={fantasyTeam.previousPoints}
                teamName={fantasyTeam.name}
                rank={fantasyTeam.rank}
              />
              <PointsBreakdownLive playerPoints={fantasyTeam.playerPoints} />
            </>
          ) : (
            <div className="rounded-xl border bg-card p-6 text-center">
              <p className="text-muted-foreground mb-4">
                No team selected for this match
              </p>
              <a
                href={`/team/${matchData.matchId}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Create Team
              </a>
            </div>
          )}

          {/* Match info card */}
          <div className="rounded-xl border bg-card p-4">
            <h4 className="font-semibold mb-3">Match Info</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{status.replace('_', ' ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Innings</dt>
                <dd className="font-medium">{currentInnings === 1 ? '1st' : '2nd'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Run Rate</dt>
                <dd className="font-medium">{battingTeam.runRate.toFixed(2)}</dd>
              </div>
              {currentInnings === 2 && target && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Target</dt>
                    <dd className="font-medium">{target}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Need</dt>
                    <dd className="font-medium">{target - battingTeam.runs} runs</dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Last ball compact commentary */}
      {status === 'live' && recentBalls.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t md:hidden">
          <CompactCommentary latestEvent={recentBalls[0]} />
        </div>
      )}
    </div>
  );
}

interface MatchNotStartedProps {
  matchId: string;
  teamHome: { teamName: string; shortName: string };
  teamAway: { teamName: string; shortName: string };
  startTime: Date;
  className?: string;
}

/**
 * Pre-match view when match hasn't started yet
 */
export function MatchNotStarted({
  matchId,
  teamHome,
  teamAway,
  startTime,
  className,
}: MatchNotStartedProps) {
  const timeUntilStart = startTime.getTime() - Date.now();
  const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60));
  const minutesUntil = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className={cn('rounded-xl border bg-card p-8 text-center', className)}>
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl mx-auto mb-2">
            {teamHome.shortName.substring(0, 2)}
          </div>
          <p className="font-semibold">{teamHome.teamName}</p>
        </div>
        <span className="text-2xl font-bold text-muted-foreground">VS</span>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl mx-auto mb-2">
            {teamAway.shortName.substring(0, 2)}
          </div>
          <p className="font-semibold">{teamAway.teamName}</p>
        </div>
      </div>

      <p className="text-muted-foreground mb-2">Match starts in</p>
      <p className="text-3xl font-bold mb-6">
        {hoursUntil > 0 && `${hoursUntil}h `}{minutesUntil}m
      </p>

      <a
        href={`/team/${matchId}`}
        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        Create Your Team
      </a>
    </div>
  );
}

interface MatchCompletedProps {
  matchData: LiveMatchData;
  fantasyTeam?: {
    name: string;
    totalPoints: number;
    rank?: number;
    playerPoints: Record<string, { name: string; points: number; breakdown: { reason: string; points: number }[] }>;
  };
  className?: string;
}

/**
 * Post-match summary view
 */
export function MatchCompleted({
  matchData,
  fantasyTeam,
  className,
}: MatchCompletedProps) {
  const { teamHome, teamAway, target } = matchData;

  // Determine winner
  const getWinner = () => {
    if (teamHome.runs > (teamAway.runs || 0)) {
      const margin = teamHome.runs - teamAway.runs;
      return `${teamHome.teamName} won by ${margin} runs`;
    } else if (teamAway.runs > teamHome.runs) {
      if (teamAway.wickets < 10) {
        const wicketsRemaining = 10 - teamAway.wickets;
        return `${teamAway.teamName} won by ${wicketsRemaining} wickets`;
      }
      const margin = teamAway.runs - teamHome.runs;
      return `${teamAway.teamName} won by ${margin} runs`;
    }
    return 'Match Tied';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Match result */}
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">RESULT</p>
        <p className="text-xl font-bold mb-4">{getWinner()}</p>

        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="font-semibold">{teamHome.shortName}</p>
            <p className="text-2xl font-bold">{teamHome.runs}/{teamHome.wickets}</p>
            <p className="text-sm text-muted-foreground">({teamHome.overs} ov)</p>
          </div>
          <span className="text-muted-foreground">vs</span>
          <div className="text-center">
            <p className="font-semibold">{teamAway.shortName}</p>
            <p className="text-2xl font-bold">{teamAway.runs}/{teamAway.wickets}</p>
            <p className="text-sm text-muted-foreground">({teamAway.overs} ov)</p>
          </div>
        </div>
      </div>

      {/* Fantasy result */}
      {fantasyTeam && (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">YOUR TEAM</p>
          <p className="font-semibold mb-1">{fantasyTeam.name}</p>
          <p className="text-4xl font-bold text-primary mb-2">{fantasyTeam.totalPoints} pts</p>
          {fantasyTeam.rank && (
            <p className="text-muted-foreground">
              Final Rank: <span className="font-bold">#{fantasyTeam.rank}</span>
            </p>
          )}
        </div>
      )}

      {/* Points breakdown */}
      {fantasyTeam && (
        <PointsBreakdownLive playerPoints={fantasyTeam.playerPoints} />
      )}
    </div>
  );
}
