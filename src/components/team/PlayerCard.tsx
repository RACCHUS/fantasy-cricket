'use client';

import { cn } from '@/lib/utils';
import type { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  disabled?: boolean;
  onSelect?: (player: Player) => void;
  onRemove?: (playerId: string) => void;
  onCaptainClick?: (playerId: string) => void;
  showCaptainBadge?: boolean;
  compact?: boolean;
}

const ROLE_ICONS: Record<string, string> = {
  batsman: '🏏',
  bowler: '🎯',
  'all-rounder': '⚡',
  'wicket-keeper': '🧤',
};

const ROLE_COLORS: Record<string, string> = {
  batsman: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  bowler: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'all-rounder': 'bg-green-500/20 text-green-400 border-green-500/30',
  'wicket-keeper': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export function PlayerCard({
  player,
  isSelected = false,
  isCaptain = false,
  isViceCaptain = false,
  disabled = false,
  onSelect,
  onRemove,
  onCaptainClick,
  showCaptainBadge = false,
  compact = false,
}: PlayerCardProps) {
  const handleClick = () => {
    if (disabled) return;
    
    if (isSelected && onRemove) {
      onRemove(player.id);
    } else if (!isSelected && onSelect) {
      onSelect(player);
    }
  };

  const handleCaptainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCaptainClick && isSelected) {
      onCaptainClick(player.id);
    }
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
          'hover:scale-[1.02] active:scale-[0.98]',
          isSelected
            ? 'bg-accent/10 border-accent shadow-lg shadow-accent/20'
            : 'bg-surface border-border hover:border-accent/50',
          disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
        )}
      >
        {/* Player Avatar */}
        <div className="relative">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
            'bg-gradient-to-br from-surface-secondary to-background border-2',
            isSelected ? 'border-accent' : 'border-border'
          )}>
            {player.imageUrl ? (
              <img 
                src={player.imageUrl} 
                alt={player.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              ROLE_ICONS[player.role]
            )}
          </div>
          
          {/* Captain/VC Badge */}
          {(isCaptain || isViceCaptain) && (
            <div className={cn(
              'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              isCaptain ? 'bg-yellow-500 text-black' : 'bg-gray-400 text-black'
            )}>
              {isCaptain ? 'C' : 'VC'}
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{player.name}</p>
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>{ROLE_ICONS[player.role]}</span>
            <span className="truncate">{player.teamName || 'Team'}</span>
          </div>
        </div>

        {/* Credits */}
        <div className={cn(
          'px-3 py-1 rounded-full text-sm font-bold',
          isSelected ? 'bg-accent text-white' : 'bg-surface-secondary'
        )}>
          {player.credits}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative group p-4 rounded-2xl border transition-all cursor-pointer',
        'hover:scale-[1.03] active:scale-[0.97] active:animate-card-tap',
        isSelected
          ? 'bg-gradient-to-b from-accent/20 to-accent/5 border-accent shadow-xl shadow-accent/20'
          : 'bg-surface border-border hover:border-accent/50 hover:shadow-lg',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center animate-points-pop">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Captain/VC Badge */}
      {showCaptainBadge && isSelected && (
        <button
          onClick={handleCaptainClick}
          className={cn(
            'absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center',
            'text-sm font-bold transition-all hover:scale-110',
            isCaptain
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
              : isViceCaptain
              ? 'bg-gray-400 text-black shadow-lg'
              : 'bg-surface-secondary text-foreground-muted hover:bg-accent/20'
          )}
        >
          {isCaptain ? '👑' : isViceCaptain ? '⭐' : '•'}
        </button>
      )}

      {/* Player Avatar */}
      <div className="flex justify-center mb-3">
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center text-4xl',
          'bg-gradient-to-br from-surface-secondary to-background',
          'border-4 transition-all',
          isSelected ? 'border-accent' : 'border-border group-hover:border-accent/50'
        )}>
          {player.imageUrl ? (
            <img 
              src={player.imageUrl} 
              alt={player.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            ROLE_ICONS[player.role]
          )}
        </div>
      </div>

      {/* Player Name */}
      <h3 className="font-bold text-center truncate mb-1">{player.name}</h3>

      {/* Team Name */}
      <p className="text-sm text-foreground-muted text-center truncate mb-3">
        {player.teamName || 'Team'}
      </p>

      {/* Role Badge */}
      <div className="flex justify-center mb-3">
        <span className={cn(
          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border',
          ROLE_COLORS[player.role]
        )}>
          {ROLE_ICONS[player.role]} {player.role.replace('-', ' ')}
        </span>
      </div>

      {/* Credits & Points */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-xs text-foreground-muted">Credits</p>
          <p className={cn(
            'text-lg font-bold',
            isSelected ? 'text-accent' : ''
          )}>
            {player.credits}
          </p>
        </div>
        
        <div className="h-8 w-px bg-border" />
        
        <div className="text-center">
          <p className="text-xs text-foreground-muted">Points</p>
          <p className="text-lg font-bold text-green-400">
            {player.points || 0}
          </p>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className={cn(
        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
        'bg-gradient-to-t from-accent/10 to-transparent'
      )} />
    </div>
  );
}

// Mini version for team slots
export function PlayerCardMini({
  player,
  isCaptain,
  isViceCaptain,
  onRemove,
  onClick,
}: {
  player: Player;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-xl border bg-surface cursor-pointer',
        'hover:border-accent transition-all group',
        (isCaptain || isViceCaptain) && 'ring-2 ring-yellow-500/50'
      )}
    >
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-white text-xs">×</span>
        </button>
      )}

      {/* Captain/VC indicator */}
      {(isCaptain || isViceCaptain) && (
        <div className={cn(
          'absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
          isCaptain ? 'bg-yellow-500 text-black' : 'bg-gray-400 text-black'
        )}>
          {isCaptain ? 'C' : 'VC'}
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="text-2xl mb-1">{ROLE_ICONS[player.role]}</div>
        <p className="text-xs font-medium truncate w-full text-center">
          {player.name.split(' ').pop()}
        </p>
        <p className="text-[10px] text-foreground-muted">{player.credits}cr</p>
      </div>
    </div>
  );
}
