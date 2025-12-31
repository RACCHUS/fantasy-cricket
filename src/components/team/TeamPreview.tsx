'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ROLE_LIMITS } from './RoleFilter';
import type { Player, PlayerRole } from '@/types';

interface TeamPreviewProps {
  players: Player[];
  captainId: string | null;
  viceCaptainId: string | null;
  teamName: string;
  matchInfo?: {
    teamA: string;
    teamB: string;
    date: Date;
    venue: string;
  };
  totalCredits: number;
  usedCredits: number;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_ICONS: Record<string, string> = {
  batsman: '🏏',
  bowler: '🎯',
  'all-rounder': '⚡',
  'wicket-keeper': '🧤',
};

export function TeamPreview({
  players,
  captainId,
  viceCaptainId,
  teamName,
  matchInfo,
  totalCredits,
  usedCredits,
  onSubmit,
  onBack,
  isSubmitting = false,
  isOpen,
  onClose,
}: TeamPreviewProps) {
  if (!isOpen) return null;

  // Validation
  const validation = validateTeam(players, captainId, viceCaptainId);
  const captain = players.find((p) => p.id === captainId);
  const viceCaptain = players.find((p) => p.id === viceCaptainId);

  // Group by role
  const playersByRole = players.reduce<Record<PlayerRole, Player[]>>(
    (acc, player) => {
      if (!acc[player.role]) acc[player.role] = [];
      acc[player.role].push(player);
      return acc;
    },
    {} as Record<PlayerRole, Player[]>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-2xl bg-surface rounded-2xl',
        'border border-border shadow-2xl',
        'max-h-[90vh] overflow-hidden flex flex-col',
        'animate-slide-up'
      )}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {teamName || 'My Fantasy Team'}
              </h2>
              {matchInfo && (
                <p className="text-sm text-foreground-muted">
                  {matchInfo.teamA} vs {matchInfo.teamB}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center hover:bg-red-500/20 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Captain & VC Highlight */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">👑</span>
                <span className="text-xs text-yellow-400 font-medium">CAPTAIN (2x)</span>
              </div>
              <p className="font-bold truncate">{captain?.name || 'Not Selected'}</p>
            </div>
            <div className="flex-1 p-3 rounded-xl bg-gray-500/10 border border-gray-500/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">⭐</span>
                <span className="text-xs text-gray-400 font-medium">VICE-CAPTAIN (1.5x)</span>
              </div>
              <p className="font-bold truncate">{viceCaptain?.name || 'Not Selected'}</p>
            </div>
          </div>
        </div>

        {/* Team Composition */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 rounded-xl bg-surface-secondary">
              <p className="text-2xl font-bold">{players.length}</p>
              <p className="text-xs text-foreground-muted">Players</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-surface-secondary">
              <p className="text-2xl font-bold">{usedCredits.toFixed(1)}</p>
              <p className="text-xs text-foreground-muted">Credits Used</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-500/10">
              <p className="text-2xl font-bold text-green-400">
                {(totalCredits - usedCredits).toFixed(1)}
              </p>
              <p className="text-xs text-foreground-muted">Credits Left</p>
            </div>
          </div>

          {/* Players by Role */}
          <div className="space-y-4">
            {(['wicket-keeper', 'batsman', 'all-rounder', 'bowler'] as PlayerRole[]).map((role) => {
              const rolePlayers = playersByRole[role] || [];
              if (rolePlayers.length === 0) return null;

              return (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{ROLE_ICONS[role]}</span>
                    <span className="font-medium text-sm uppercase">
                      {role.replace('-', ' ')}s
                    </span>
                    <span className="text-xs text-foreground-muted">
                      ({rolePlayers.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {rolePlayers.map((player) => (
                      <div
                        key={player.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border',
                          captainId === player.id
                            ? 'bg-yellow-500/10 border-yellow-500/50'
                            : viceCaptainId === player.id
                            ? 'bg-gray-500/10 border-gray-500/50'
                            : 'bg-surface-secondary border-border'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {captainId === player.id && '👑 '}
                            {viceCaptainId === player.id && '⭐ '}
                            {player.name}
                          </p>
                          <p className="text-xs text-foreground-muted">{player.credits} cr</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Errors */}
          {!validation.isValid && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <h4 className="font-bold text-red-400 mb-2">⚠️ Team Issues</h4>
              <ul className="space-y-1">
                {validation.errors.map((error, i) => (
                  <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border bg-surface-secondary/50">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onBack}
              className="flex-1"
              disabled={isSubmitting}
            >
              ← Back to Edit
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1"
              disabled={!validation.isValid || isSubmitting}
              loading={isSubmitting}
            >
              {validation.isValid ? '🚀 Save Team' : 'Fix Issues First'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Validation helper
function validateTeam(
  players: Player[],
  captainId: string | null,
  viceCaptainId: string | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check player count
  if (players.length !== 11) {
    errors.push(`Select exactly 11 players (currently ${players.length})`);
  }

  // Check captain
  if (!captainId) {
    errors.push('Select a Captain');
  }

  // Check vice-captain
  if (!viceCaptainId) {
    errors.push('Select a Vice-Captain');
  }

  // Check captain and VC are different
  if (captainId && viceCaptainId && captainId === viceCaptainId) {
    errors.push('Captain and Vice-Captain must be different players');
  }

  // Check role requirements
  const roleCounts: Record<PlayerRole, number> = {
    batsman: 0,
    bowler: 0,
    'all-rounder': 0,
    'wicket-keeper': 0,
  };

  players.forEach((p) => {
    roleCounts[p.role]++;
  });

  for (const [role, limits] of Object.entries(ROLE_LIMITS)) {
    const count = roleCounts[role as PlayerRole];
    if (count < limits.min) {
      errors.push(`Need at least ${limits.min} ${role.replace('-', ' ')}(s) (have ${count})`);
    }
    if (count > limits.max) {
      errors.push(`Maximum ${limits.max} ${role.replace('-', ' ')}(s) allowed (have ${count})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
