'use client';

import { cn } from '@/lib/utils';
import type { PlayerRole } from '@/types';

interface RoleFilterProps {
  selectedRole: PlayerRole | 'all';
  onRoleChange: (role: PlayerRole | 'all') => void;
  counts?: {
    all: number;
    batsman: number;
    bowler: number;
    'all-rounder': number;
    'wicket-keeper': number;
  };
  selectedCounts?: {
    batsman: number;
    bowler: number;
    'all-rounder': number;
    'wicket-keeper': number;
  };
}

const ROLE_CONFIG = [
  { key: 'all' as const, icon: '👥', label: 'All', shortLabel: 'ALL' },
  { key: 'wicket-keeper' as const, icon: '🧤', label: 'Keeper', shortLabel: 'WK' },
  { key: 'batsman' as const, icon: '🏏', label: 'Batsman', shortLabel: 'BAT' },
  { key: 'all-rounder' as const, icon: '⚡', label: 'All-Rounder', shortLabel: 'AR' },
  { key: 'bowler' as const, icon: '🎯', label: 'Bowler', shortLabel: 'BOWL' },
];

// Role limits for team validation
export const ROLE_LIMITS = {
  'wicket-keeper': { min: 1, max: 4 },
  batsman: { min: 3, max: 6 },
  'all-rounder': { min: 1, max: 4 },
  bowler: { min: 3, max: 6 },
} as const;

export function RoleFilter({
  selectedRole,
  onRoleChange,
  counts,
  selectedCounts,
}: RoleFilterProps) {
  return (
    <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {ROLE_CONFIG.map(({ key, icon, label, shortLabel }) => {
        const isActive = selectedRole === key;
        const count = key === 'all' ? counts?.all : counts?.[key];
        const selected = key !== 'all' ? selectedCounts?.[key] || 0 : undefined;
        const limit = key !== 'all' ? ROLE_LIMITS[key] : undefined;
        
        // Check if role is at max
        const atMax = limit && selected !== undefined && selected >= limit.max;
        // Check if role meets minimum
        const meetsMin = limit && selected !== undefined && selected >= limit.min;

        return (
          <button
            key={key}
            onClick={() => onRoleChange(key)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
              'min-w-[70px] sm:min-w-[80px]',
              isActive
                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                : 'bg-surface border border-border hover:border-accent/50',
              atMax && !isActive && 'opacity-50'
            )}
          >
            {/* Icon with count badge */}
            <div className="relative">
              <span className="text-2xl">{icon}</span>
              {selected !== undefined && limit && (
                <span className={cn(
                  'absolute -top-1 -right-3 text-[10px] font-bold px-1 rounded-full',
                  meetsMin ? 'bg-green-500 text-white' : 'bg-surface-secondary'
                )}>
                  {selected}/{limit.max}
                </span>
              )}
            </div>
            
            {/* Label */}
            <span className="text-xs font-medium hidden sm:block">{label}</span>
            <span className="text-xs font-medium sm:hidden">{shortLabel}</span>
            
            {/* Available count */}
            {count !== undefined && (
              <span className={cn(
                'text-[10px]',
                isActive ? 'text-white/70' : 'text-foreground-muted'
              )}>
                {count} available
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Compact version for mobile
export function RoleFilterCompact({
  selectedRole,
  onRoleChange,
  selectedCounts,
}: {
  selectedRole: PlayerRole | 'all';
  onRoleChange: (role: PlayerRole | 'all') => void;
  selectedCounts?: {
    batsman: number;
    bowler: number;
    'all-rounder': number;
    'wicket-keeper': number;
  };
}) {
  return (
    <div className="flex justify-between bg-surface rounded-xl p-1 border border-border">
      {ROLE_CONFIG.map(({ key, icon, shortLabel }) => {
        const isActive = selectedRole === key;
        const selected = key !== 'all' ? selectedCounts?.[key] || 0 : undefined;
        const limit = key !== 'all' ? ROLE_LIMITS[key] : undefined;

        return (
          <button
            key={key}
            onClick={() => onRoleChange(key)}
            className={cn(
              'flex-1 flex flex-col items-center py-2 rounded-lg transition-all',
              isActive && 'bg-accent text-white'
            )}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-[10px] font-medium">{shortLabel}</span>
            {selected !== undefined && limit && (
              <span className={cn(
                'text-[9px] font-bold',
                isActive ? 'text-white/80' : 'text-foreground-muted'
              )}>
                {selected}/{limit.min}-{limit.max}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
