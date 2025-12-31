'use client';

import { cn } from '@/lib/utils';

interface BudgetBarProps {
  total: number;
  used: number;
  className?: string;
}

export function BudgetBar({ total, used, className }: BudgetBarProps) {
  const remaining = total - used;
  const percentage = (used / total) * 100;
  
  // Color based on remaining budget
  const getBarColor = () => {
    if (remaining < 0) return 'bg-red-500';
    if (remaining < 10) return 'bg-orange-500';
    if (remaining < 20) return 'bg-yellow-500';
    return 'bg-accent';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Labels */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="font-medium">Budget</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-foreground-muted">
            Used: <span className="text-foreground font-bold">{used.toFixed(1)}</span>
          </span>
          <span className={cn(
            'font-bold text-lg',
            remaining < 0 ? 'text-red-500' : remaining < 10 ? 'text-orange-500' : 'text-green-400'
          )}>
            {remaining.toFixed(1)} left
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out',
            getBarColor()
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        
        {/* Overflow indicator */}
        {remaining < 0 && (
          <div className="absolute inset-0 bg-red-500/30 animate-pulse" />
        )}
        
        {/* Markers */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="w-px h-full bg-background/30"
              style={{ marginLeft: `${mark}%` }}
            />
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="flex justify-between text-[10px] text-foreground-muted">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

// Compact version for header
export function BudgetBadge({ total, used }: BudgetBarProps) {
  const remaining = total - used;
  
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border',
      remaining < 0 
        ? 'bg-red-500/20 border-red-500/50 text-red-400'
        : remaining < 10
        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
        : 'bg-green-500/20 border-green-500/50 text-green-400'
    )}>
      <span className="text-lg">💰</span>
      <span className="font-bold">{remaining.toFixed(1)}</span>
      <span className="text-xs opacity-70">/ {total}</span>
    </div>
  );
}
