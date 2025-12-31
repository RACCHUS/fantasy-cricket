'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PointsChange {
  playerId: string;
  playerName: string;
  points: number;
  reason: string;
  timestamp: number;
}

interface PointsTickerProps {
  changes: PointsChange[];
  className?: string;
}

/**
 * Animated ticker showing live fantasy points as they're scored
 */
export function PointsTicker({ changes, className }: PointsTickerProps) {
  const [visibleChanges, setVisibleChanges] = useState<PointsChange[]>([]);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Show new changes with animation
  useEffect(() => {
    if (changes.length > 0 && changes[0].timestamp > Date.now() - 5000) {
      const latest = changes[0];
      setAnimatingId(`${latest.playerId}-${latest.timestamp}`);
      setVisibleChanges(changes.slice(0, 5));
      
      const timer = setTimeout(() => setAnimatingId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [changes]);

  if (visibleChanges.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {visibleChanges.map((change) => {
        const uniqueId = `${change.playerId}-${change.timestamp}`;
        const isAnimating = animatingId === uniqueId;
        
        return (
          <div
            key={uniqueId}
            className={cn(
              'flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300',
              change.points > 0 && 'bg-green-500/10',
              change.points < 0 && 'bg-red-500/10',
              isAnimating && 'scale-105 ring-2 ring-primary/50'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{change.playerName}</span>
              <span className="text-xs text-muted-foreground">{change.reason}</span>
            </div>
            <span
              className={cn(
                'font-bold text-sm',
                change.points > 0 && 'text-green-500',
                change.points < 0 && 'text-red-500'
              )}
            >
              {change.points > 0 ? '+' : ''}{change.points}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface TotalPointsDisplayProps {
  totalPoints: number;
  previousPoints?: number;
  teamName?: string;
  rank?: number;
  className?: string;
}

/**
 * Displays total fantasy points with animation on changes
 */
export function TotalPointsDisplay({
  totalPoints,
  previousPoints,
  teamName,
  rank,
  className,
}: TotalPointsDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(totalPoints);
  const prevPointsRef = useRef(totalPoints);

  useEffect(() => {
    if (totalPoints !== prevPointsRef.current) {
      setIsAnimating(true);
      
      // Animate the number counting up/down
      const diff = totalPoints - prevPointsRef.current;
      const steps = 10;
      const stepValue = diff / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayPoints(totalPoints);
          clearInterval(interval);
          setTimeout(() => setIsAnimating(false), 500);
        } else {
          setDisplayPoints(Math.round(prevPointsRef.current + stepValue * currentStep));
        }
      }, 50);

      prevPointsRef.current = totalPoints;

      return () => clearInterval(interval);
    }
  }, [totalPoints]);

  const pointsDiff = previousPoints !== undefined ? totalPoints - previousPoints : 0;

  return (
    <div className={cn('rounded-xl border bg-card p-4', className)}>
      {teamName && (
        <p className="text-sm text-muted-foreground mb-1">{teamName}</p>
      )}
      
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'text-4xl font-bold transition-transform duration-300',
            isAnimating && 'scale-110 text-primary'
          )}
        >
          {displayPoints}
        </span>
        <span className="text-muted-foreground">pts</span>
        
        {pointsDiff !== 0 && (
          <span
            className={cn(
              'text-sm font-medium',
              pointsDiff > 0 && 'text-green-500',
              pointsDiff < 0 && 'text-red-500'
            )}
          >
            {pointsDiff > 0 ? '▲' : '▼'} {Math.abs(pointsDiff)}
          </span>
        )}
      </div>
      
      {rank && (
        <p className="text-sm mt-2">
          <span className="text-muted-foreground">Rank: </span>
          <span className="font-semibold">#{rank}</span>
        </p>
      )}
    </div>
  );
}

interface PointsBreakdownLiveProps {
  playerPoints: Record<string, { name: string; points: number; breakdown: { reason: string; points: number }[] }>;
  className?: string;
}

/**
 * Live breakdown of points by player
 */
export function PointsBreakdownLive({ playerPoints, className }: PointsBreakdownLiveProps) {
  const sortedPlayers = Object.entries(playerPoints)
    .sort(([, a], [, b]) => b.points - a.points);

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b bg-secondary/30">
        <h3 className="font-semibold">Your Players</h3>
      </div>
      
      <div className="divide-y">
        {sortedPlayers.map(([playerId, data]) => (
          <div key={playerId} className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{data.name}</span>
              <span
                className={cn(
                  'font-bold',
                  data.points > 0 && 'text-green-500',
                  data.points < 0 && 'text-red-500'
                )}
              >
                {data.points > 0 ? '+' : ''}{data.points}
              </span>
            </div>
            
            {data.breakdown.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.breakdown.slice(0, 5).map((item, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      item.points > 0 && 'bg-green-500/10 text-green-500',
                      item.points < 0 && 'bg-red-500/10 text-red-500',
                      item.points === 0 && 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {item.reason}: {item.points > 0 ? '+' : ''}{item.points}
                  </span>
                ))}
                {data.breakdown.length > 5 && (
                  <span className="text-xs text-muted-foreground">
                    +{data.breakdown.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        
        {sortedPlayers.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            No points scored yet
          </div>
        )}
      </div>
    </div>
  );
}

interface FloatingPointsNotificationProps {
  change?: PointsChange;
  className?: string;
}

/**
 * Floating notification that appears when points are scored
 */
export function FloatingPointsNotification({ change, className }: FloatingPointsNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [currentChange, setCurrentChange] = useState<PointsChange | null>(null);

  useEffect(() => {
    if (change && change.timestamp > Date.now() - 3000) {
      setCurrentChange(change);
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [change]);

  if (!visible || !currentChange) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300',
        className
      )}
    >
      <div
        className={cn(
          'px-4 py-3 rounded-xl shadow-lg border',
          currentChange.points > 0 && 'bg-green-500/90 text-white border-green-400',
          currentChange.points < 0 && 'bg-red-500/90 text-white border-red-400'
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">
            {currentChange.points > 0 ? '+' : ''}{currentChange.points}
          </span>
          <div>
            <p className="font-medium">{currentChange.playerName}</p>
            <p className="text-sm opacity-90">{currentChange.reason}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
