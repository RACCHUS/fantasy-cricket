'use client';

import { cn } from '@/lib/utils';
import type { TeamScore, BattingStats, BowlingStats } from '@/hooks/useLiveMatch';

interface LiveScoreboardProps {
  battingTeam: TeamScore;
  bowlingTeam: TeamScore;
  currentInnings: 1 | 2;
  target?: number;
  requiredRunRate?: number;
  status: 'upcoming' | 'live' | 'innings_break' | 'completed';
  className?: string;
}

/**
 * Main scoreboard showing current match state
 */
export function LiveScoreboard({
  battingTeam,
  bowlingTeam,
  currentInnings,
  target,
  requiredRunRate,
  status,
  className,
}: LiveScoreboardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <span className="flex items-center gap-1.5 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        );
      case 'innings_break':
        return (
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">
            INNINGS BREAK
          </span>
        );
      case 'completed':
        return (
          <span className="text-xs bg-gray-500/20 text-gray-500 px-2 py-0.5 rounded-full">
            COMPLETED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50">
        <span className="text-sm font-medium">
          {currentInnings === 1 ? '1st Innings' : '2nd Innings'}
        </span>
        {getStatusBadge()}
      </div>

      {/* Main Score */}
      <div className="p-4">
        {/* Batting Team */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {battingTeam.shortName.substring(0, 2)}
            </div>
            <div>
              <p className="font-semibold">{battingTeam.teamName}</p>
              <p className="text-xs text-muted-foreground">Batting</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {battingTeam.runs}/{battingTeam.wickets}
            </p>
            <p className="text-sm text-muted-foreground">
              {battingTeam.overs} overs • RR: {battingTeam.runRate.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bowling Team (2nd innings target info) */}
        {currentInnings === 2 && target && (
          <div className="p-3 rounded-lg bg-secondary/30 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target</span>
              <span className="font-bold">{target}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Need</span>
              <span className="font-medium">
                {target - battingTeam.runs} runs from{' '}
                {Math.max(0, 120 - Math.floor(battingTeam.overs * 6))} balls
              </span>
            </div>
            {requiredRunRate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Req. RR</span>
                <span className={cn(
                  'font-medium',
                  requiredRunRate > 12 && 'text-red-500',
                  requiredRunRate <= 6 && 'text-green-500'
                )}>
                  {requiredRunRate.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Current Batsmen */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">At the crease</p>
          {battingTeam.batting
            .filter((b) => !b.isOut)
            .slice(0, 2)
            .map((batter) => (
              <BatsmanRow key={batter.playerId} batter={batter} />
            ))}
        </div>

        {/* Current Bowler */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-medium">Bowling</p>
          {bowlingTeam.bowling
            .filter((b) => b.isBowling)
            .map((bowler) => (
              <BowlerRow key={bowler.playerId} bowler={bowler} />
            ))}
        </div>
      </div>
    </div>
  );
}

function BatsmanRow({ batter }: { batter: BattingStats }) {
  return (
    <div className={cn(
      'flex items-center justify-between p-2 rounded-lg',
      batter.isOnStrike && 'bg-primary/10'
    )}>
      <div className="flex items-center gap-2">
        {batter.isOnStrike && (
          <span className="text-primary text-xs">●</span>
        )}
        <span className="font-medium">{batter.playerName}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="font-bold">{batter.runs}</span>
        <span className="text-muted-foreground">({batter.balls})</span>
        <span className="text-xs text-muted-foreground">
          4s: {batter.fours} | 6s: {batter.sixes}
        </span>
        <span className={cn(
          'text-xs',
          batter.strikeRate >= 150 && 'text-green-500',
          batter.strikeRate < 100 && batter.balls >= 10 && 'text-red-500'
        )}>
          SR: {batter.strikeRate.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function BowlerRow({ bowler }: { bowler: BowlingStats }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
      <span className="font-medium">{bowler.playerName}</span>
      <div className="flex items-center gap-4 text-sm">
        <span>{bowler.overs}-{bowler.maidens}-{bowler.runs}-{bowler.wickets}</span>
        <span className={cn(
          'text-xs',
          bowler.economy <= 6 && 'text-green-500',
          bowler.economy >= 10 && 'text-red-500'
        )}>
          Econ: {bowler.economy.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

interface RecentBallsProps {
  balls: Array<{ runs: number; isWicket: boolean; extras?: { type: string } }>;
  className?: string;
}

/**
 * Shows recent balls in the current over
 */
export function RecentBalls({ balls, className }: RecentBallsProps) {
  const getBallDisplay = (ball: RecentBallsProps['balls'][0]) => {
    if (ball.isWicket) return { text: 'W', class: 'bg-red-500 text-white' };
    if (ball.extras?.type === 'wide') return { text: 'Wd', class: 'bg-yellow-500/20 text-yellow-500' };
    if (ball.extras?.type === 'noball') return { text: 'Nb', class: 'bg-yellow-500/20 text-yellow-500' };
    if (ball.runs === 6) return { text: '6', class: 'bg-green-500 text-white' };
    if (ball.runs === 4) return { text: '4', class: 'bg-blue-500 text-white' };
    if (ball.runs === 0) return { text: '•', class: 'bg-secondary text-muted-foreground' };
    return { text: String(ball.runs), class: 'bg-secondary' };
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">This over:</span>
      <div className="flex gap-1">
        {balls.slice(-6).map((ball, i) => {
          const display = getBallDisplay(ball);
          return (
            <span
              key={i}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                display.class
              )}
            >
              {display.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface MiniScoreboardProps {
  teamName: string;
  shortName: string;
  runs: number;
  wickets: number;
  overs: number;
  isBatting: boolean;
  className?: string;
}

/**
 * Compact scoreboard for headers/notifications
 */
export function MiniScoreboard({
  teamName,
  shortName,
  runs,
  wickets,
  overs,
  isBatting,
  className,
}: MiniScoreboardProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg',
      isBatting ? 'bg-primary/10' : 'bg-secondary/50',
      className
    )}>
      <span className="font-medium text-sm">{shortName}</span>
      <span className="font-bold">
        {runs}/{wickets}
      </span>
      <span className="text-xs text-muted-foreground">
        ({overs} ov)
      </span>
    </div>
  );
}
