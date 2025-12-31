'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LivePointsBadgeProps {
  points: number;
  previousPoints?: number;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

/**
 * Animated badge showing current fantasy points
 * Flashes green when points increase
 */
export function LivePointsBadge({
  points,
  previousPoints,
  size = 'md',
  showAnimation = true,
  className,
}: LivePointsBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(points);
  const pointsGained = previousPoints !== undefined ? points - previousPoints : 0;

  useEffect(() => {
    if (showAnimation && previousPoints !== undefined && points > previousPoints) {
      setIsAnimating(true);
      
      // Animate the number counting up
      const duration = 1000;
      const steps = 20;
      const increment = (points - previousPoints) / steps;
      let current = previousPoints;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= points) {
          setDisplayPoints(points);
          clearInterval(interval);
        } else {
          setDisplayPoints(Math.round(current));
        }
      }, duration / steps);

      // Reset animation after 2 seconds
      const timeout = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayPoints(points);
    }
  }, [points, previousPoints, showAnimation]);

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-lg px-3 py-1 font-bold',
    lg: 'text-2xl px-4 py-2 font-bold',
  };

  return (
    <div className={cn('relative inline-flex items-center gap-1', className)}>
      <span
        className={cn(
          'rounded-full bg-gradient-to-r transition-all duration-300',
          isAnimating
            ? 'from-green-500 to-emerald-400 text-white scale-110 animate-pulse shadow-lg shadow-green-500/50'
            : 'from-primary to-primary/80 text-primary-foreground',
          sizeClasses[size]
        )}
      >
        {displayPoints}
        <span className="ml-1 text-xs opacity-80">pts</span>
      </span>
      
      {/* Points gained indicator */}
      {isAnimating && pointsGained > 0 && (
        <span className="absolute -top-2 -right-2 animate-bounce text-xs font-bold text-green-500">
          +{pointsGained}
        </span>
      )}
    </div>
  );
}

interface PointsBreakdownItemProps {
  label: string;
  value: number;
  icon?: string;
  isBonus?: boolean;
  isPenalty?: boolean;
}

/**
 * Single line item in a points breakdown
 */
function PointsBreakdownItem({
  label,
  value,
  icon,
  isBonus,
  isPenalty,
}: PointsBreakdownItemProps) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span className="text-muted-foreground">{label}</span>
      </span>
      <span
        className={cn(
          'font-medium',
          isBonus && 'text-green-500',
          isPenalty && 'text-red-500',
          !isBonus && !isPenalty && 'text-foreground'
        )}
      >
        {value >= 0 ? '+' : ''}{value}
      </span>
    </div>
  );
}

interface PointsBreakdownProps {
  breakdown: string[];
  totalPoints: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  className?: string;
}

/**
 * Detailed breakdown of how points were earned
 */
export function PointsBreakdown({
  breakdown,
  totalPoints,
  isCaptain,
  isViceCaptain,
  className,
}: PointsBreakdownProps) {
  // Parse breakdown strings like "50 runs → +50"
  const items = breakdown.map((item) => {
    const match = item.match(/^(.+?)\s*→\s*([+-]?\d+)$/);
    if (match) {
      const label = match[1];
      const value = parseInt(match[2], 10);
      return { label, value, isBonus: value > 10, isPenalty: value < 0 };
    }
    return { label: item, value: 0, isBonus: false, isPenalty: false };
  });

  const multiplier = isCaptain ? 2 : isViceCaptain ? 1.5 : 1;
  const basePoints = multiplier > 1 ? Math.round(totalPoints / multiplier) : totalPoints;

  return (
    <div className={cn('rounded-lg bg-secondary/50 p-3', className)}>
      <div className="space-y-0.5 divide-y divide-border/50">
        {items.map((item, i) => (
          <PointsBreakdownItem
            key={i}
            label={item.label}
            value={item.value}
            isBonus={item.isBonus}
            isPenalty={item.isPenalty}
          />
        ))}
        
        {multiplier > 1 && (
          <>
            <div className="flex items-center justify-between py-1 text-sm border-t border-dashed">
              <span className="text-muted-foreground">Base points</span>
              <span>{basePoints}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="flex items-center gap-1">
                {isCaptain && <span>👑</span>}
                {isViceCaptain && <span>⭐</span>}
                <span className="text-muted-foreground">
                  {isCaptain ? 'Captain (2×)' : 'Vice-Captain (1.5×)'}
                </span>
              </span>
              <span className="font-medium text-primary">×{multiplier}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t flex items-center justify-between">
        <span className="font-medium">Total</span>
        <LivePointsBadge points={totalPoints} size="sm" showAnimation={false} />
      </div>
    </div>
  );
}

interface LiveScoreCardProps {
  playerName: string;
  points: number;
  previousPoints?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  stats?: {
    runsScored?: number;
    wickets?: number;
    catches?: number;
  };
  breakdown?: string[];
  showBreakdown?: boolean;
  className?: string;
}

/**
 * Card showing a player's live fantasy score
 */
export function LiveScoreCard({
  playerName,
  points,
  previousPoints,
  isCaptain,
  isViceCaptain,
  stats,
  breakdown = [],
  showBreakdown = false,
  className,
}: LiveScoreCardProps) {
  const [expanded, setExpanded] = useState(showBreakdown);

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCaptain && (
            <span className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">
              C
            </span>
          )}
          {isViceCaptain && (
            <span className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-bold">
              VC
            </span>
          )}
          <span className="font-semibold">{playerName}</span>
        </div>
        <LivePointsBadge
          points={points}
          previousPoints={previousPoints}
          size="md"
        />
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
          {stats.runsScored !== undefined && stats.runsScored > 0 && (
            <span>🏏 {stats.runsScored} runs</span>
          )}
          {stats.wickets !== undefined && stats.wickets > 0 && (
            <span>🎯 {stats.wickets} wkts</span>
          )}
          {stats.catches !== undefined && stats.catches > 0 && (
            <span>🙌 {stats.catches} ct</span>
          )}
        </div>
      )}

      {/* Expandable breakdown */}
      {breakdown.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            {expanded ? 'Hide breakdown ▲' : 'Show breakdown ▼'}
          </button>
          
          {expanded && (
            <div className="mt-2">
              <PointsBreakdown
                breakdown={breakdown}
                totalPoints={points}
                isCaptain={isCaptain}
                isViceCaptain={isViceCaptain}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface TeamPointsSummaryProps {
  totalPoints: number;
  previousTotal?: number;
  playerCount: number;
  lastUpdated: string;
  isLive?: boolean;
  className?: string;
}

/**
 * Summary header showing total team points
 */
export function TeamPointsSummary({
  totalPoints,
  previousTotal,
  playerCount,
  lastUpdated,
  isLive = false,
  className,
}: TeamPointsSummaryProps) {
  const formattedTime = new Date(lastUpdated).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Points</p>
          <div className="flex items-center gap-2">
            <LivePointsBadge
              points={totalPoints}
              previousPoints={previousTotal}
              size="lg"
            />
            {isLive && (
              <span className="flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right text-sm text-muted-foreground">
          <p>{playerCount}/11 players scored</p>
          <p>Updated: {formattedTime}</p>
        </div>
      </div>
    </div>
  );
}
