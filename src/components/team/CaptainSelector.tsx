'use client';

import { cn } from '@/lib/utils';
import type { Player } from '@/types';

interface CaptainSelectorProps {
  players: Player[];
  captainId: string | null;
  viceCaptainId: string | null;
  onSetCaptain: (playerId: string) => void;
  onSetViceCaptain: (playerId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_ICONS: Record<string, string> = {
  batsman: '🏏',
  bowler: '🎯',
  'all-rounder': '⚡',
  'wicket-keeper': '🧤',
};

export function CaptainSelector({
  players,
  captainId,
  viceCaptainId,
  onSetCaptain,
  onSetViceCaptain,
  isOpen,
  onClose,
}: CaptainSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl',
        'border border-border shadow-2xl',
        'max-h-[80vh] overflow-hidden flex flex-col',
        'animate-slide-up'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>👑</span> Select Captain & Vice-Captain
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center hover:bg-accent/20 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-foreground-muted mt-1">
            Captain gets <span className="text-yellow-400 font-bold">2x</span> points, Vice-Captain gets <span className="text-gray-400 font-bold">1.5x</span> points
          </p>
        </div>

        {/* Current Selection */}
        <div className="p-4 bg-surface-secondary/50 border-b border-border">
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">👑</div>
              <p className="text-xs text-foreground-muted">Captain (2x)</p>
              <p className="font-bold truncate">
                {captainId ? players.find(p => p.id === captainId)?.name || 'Select' : 'Not Selected'}
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 text-center">
              <div className="text-2xl mb-1">⭐</div>
              <p className="text-xs text-foreground-muted">Vice-Captain (1.5x)</p>
              <p className="font-bold truncate">
                {viceCaptainId ? players.find(p => p.id === viceCaptainId)?.name || 'Select' : 'Not Selected'}
              </p>
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {players.map((player) => {
              const isCaptain = captainId === player.id;
              const isViceCaptain = viceCaptainId === player.id;

              return (
                <div
                  key={player.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
                    isCaptain
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : isViceCaptain
                      ? 'bg-gray-500/10 border-gray-500/50'
                      : 'bg-surface border-border'
                  )}
                >
                  {/* Player Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-xl">
                      {ROLE_ICONS[player.role]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{player.name}</p>
                      <p className="text-xs text-foreground-muted truncate">
                        {player.teamName} • {player.credits} cr
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetCaptain(player.id)}
                      disabled={isViceCaptain}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        'text-lg font-bold',
                        isCaptain
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
                          : 'bg-surface-secondary hover:bg-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isCaptain ? '👑' : 'C'}
                    </button>
                    <button
                      onClick={() => onSetViceCaptain(player.id)}
                      disabled={isCaptain}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                        'text-lg font-bold',
                        isViceCaptain
                          ? 'bg-gray-400 text-black shadow-lg'
                          : 'bg-surface-secondary hover:bg-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isViceCaptain ? '⭐' : 'VC'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={!captainId || !viceCaptainId}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-lg transition-all',
              captainId && viceCaptainId
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-surface-secondary text-foreground-muted cursor-not-allowed'
            )}
          >
            {captainId && viceCaptainId ? '✓ Confirm Selection' : 'Select Both to Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline captain selector (shown in team preview)
export function CaptainSelectorInline({
  player,
  isCaptain,
  isViceCaptain,
  onSetCaptain,
  onSetViceCaptain,
  disabled = false,
}: {
  player: Player;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onSetCaptain: () => void;
  onSetViceCaptain: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={onSetCaptain}
        disabled={disabled || isViceCaptain}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
          isCaptain
            ? 'bg-yellow-500 text-black'
            : 'bg-surface-secondary hover:bg-yellow-500/30 disabled:opacity-50'
        )}
        title="Set as Captain (2x points)"
      >
        C
      </button>
      <button
        onClick={onSetViceCaptain}
        disabled={disabled || isCaptain}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
          isViceCaptain
            ? 'bg-gray-400 text-black'
            : 'bg-surface-secondary hover:bg-gray-500/30 disabled:opacity-50'
        )}
        title="Set as Vice-Captain (1.5x points)"
      >
        VC
      </button>
    </div>
  );
}
