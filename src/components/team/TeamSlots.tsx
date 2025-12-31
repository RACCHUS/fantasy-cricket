'use client';

import { cn } from '@/lib/utils';
import { PlayerCardMini } from './PlayerCard';
import type { Player, PlayerRole } from '@/types';

interface TeamSlotsProps {
  players: Player[];
  captainId?: string | null;
  viceCaptainId?: string | null;
  onRemovePlayer: (playerId: string) => void;
  onPlayerClick?: (playerId: string) => void;
  maxPlayers?: number;
}

const FORMATION_LAYOUT = [
  { role: 'wicket-keeper', label: 'KEEPER', icon: '🧤', min: 1, max: 4 },
  { role: 'batsman', label: 'BATSMEN', icon: '🏏', min: 3, max: 6 },
  { role: 'all-rounder', label: 'ALL-ROUNDERS', icon: '⚡', min: 1, max: 4 },
  { role: 'bowler', label: 'BOWLERS', icon: '🎯', min: 3, max: 6 },
] as const;

export function TeamSlots({
  players,
  captainId,
  viceCaptainId,
  onRemovePlayer,
  onPlayerClick,
  maxPlayers = 11,
}: TeamSlotsProps) {
  // Group players by role
  const playersByRole = players.reduce<Record<PlayerRole, Player[]>>(
    (acc, player) => {
      if (!acc[player.role]) acc[player.role] = [];
      acc[player.role].push(player);
      return acc;
    },
    {} as Record<PlayerRole, Player[]>
  );

  const totalSelected = players.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span>👥</span> Your Team
        </h3>
        <span className={cn(
          'px-3 py-1 rounded-full text-sm font-bold',
          totalSelected === maxPlayers
            ? 'bg-green-500/20 text-green-400'
            : 'bg-surface-secondary'
        )}>
          {totalSelected}/{maxPlayers}
        </span>
      </div>

      {/* Formation Layout */}
      <div className="space-y-4">
        {FORMATION_LAYOUT.map(({ role, label, icon, min, max }) => {
          const rolePlayers = playersByRole[role as PlayerRole] || [];
          const count = rolePlayers.length;
          const meetsMin = count >= min;

          return (
            <div key={role} className="space-y-2">
              {/* Role Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  meetsMin ? 'bg-green-500/20 text-green-400' : 'bg-surface-secondary text-foreground-muted'
                )}>
                  {count} / {min}-{max}
                </span>
              </div>

              {/* Player Slots */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {rolePlayers.map((player) => (
                  <PlayerCardMini
                    key={player.id}
                    player={player}
                    isCaptain={captainId === player.id}
                    isViceCaptain={viceCaptainId === player.id}
                    onRemove={() => onRemovePlayer(player.id)}
                    onClick={() => onPlayerClick?.(player.id)}
                  />
                ))}
                
                {/* Empty Slots */}
                {count < min && Array.from({ length: min - count }).map((_, i) => (
                  <EmptySlot key={`empty-${role}-${i}`} icon={icon} required />
                ))}
                
                {/* Optional Empty Slots (show up to max) */}
                {count >= min && count < max && (
                  <EmptySlot icon={icon} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Messages */}
      {totalSelected === maxPlayers && (!captainId || !viceCaptainId) && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          <span className="font-bold">⚠️ Select Captain & Vice-Captain</span>
          <p className="text-xs opacity-80 mt-1">
            Tap on a player to set them as Captain (2x points) or Vice-Captain (1.5x points)
          </p>
        </div>
      )}
    </div>
  );
}

function EmptySlot({ icon, required = false }: { icon: string; required?: boolean }) {
  return (
    <div className={cn(
      'min-w-[70px] p-2 rounded-xl border-2 border-dashed flex flex-col items-center justify-center',
      required ? 'border-accent/50 bg-accent/5' : 'border-border bg-surface-secondary/30'
    )}>
      <span className="text-2xl opacity-30">{icon}</span>
      <span className="text-[10px] text-foreground-muted">
        {required ? 'Required' : 'Optional'}
      </span>
    </div>
  );
}

// Compact horizontal view
export function TeamSlotsCompact({
  players,
  captainId,
  viceCaptainId,
  onRemovePlayer,
  onPlayerClick,
}: TeamSlotsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {players.map((player) => (
        <PlayerCardMini
          key={player.id}
          player={player}
          isCaptain={captainId === player.id}
          isViceCaptain={viceCaptainId === player.id}
          onRemove={() => onRemovePlayer(player.id)}
          onClick={() => onPlayerClick?.(player.id)}
        />
      ))}
      
      {/* Empty slots to fill to 11 */}
      {Array.from({ length: Math.max(0, 11 - players.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="min-w-[70px] p-2 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center"
        >
          <span className="text-2xl opacity-30">➕</span>
          <span className="text-[10px] text-foreground-muted">{i + players.length + 1}</span>
        </div>
      ))}
    </div>
  );
}
