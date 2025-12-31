'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlayerCard } from './PlayerCard';
import { RoleFilter } from './RoleFilter';
import { Input } from '@/components/ui/Input';
import type { Player, PlayerRole } from '@/types';

interface PlayerListProps {
  players: Player[];
  selectedPlayers: Player[];
  onSelectPlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
  maxPlayers?: number;
  maxCredits?: number;
  usedCredits?: number;
  maxPerTeam?: number;
  teamCounts?: Record<string, number>;
}

type SortOption = 'credits-asc' | 'credits-desc' | 'points-desc' | 'name-asc';

export function PlayerList({
  players,
  selectedPlayers,
  onSelectPlayer,
  onRemovePlayer,
  maxPlayers = 11,
  maxCredits = 100,
  usedCredits = 0,
  maxPerTeam = 7,
  teamCounts = {},
}: PlayerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlayerRole | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('credits-desc');

  // Selected player IDs for quick lookup
  const selectedIds = useMemo(
    () => new Set(selectedPlayers.map((p) => p.id)),
    [selectedPlayers]
  );

  // Count players by role
  const roleCounts = useMemo(() => {
    const counts = {
      all: players.length,
      batsman: 0,
      bowler: 0,
      'all-rounder': 0,
      'wicket-keeper': 0,
    };
    players.forEach((p) => {
      counts[p.role]++;
    });
    return counts;
  }, [players]);

  // Count selected by role
  const selectedRoleCounts = useMemo(() => {
    const counts = {
      batsman: 0,
      bowler: 0,
      'all-rounder': 0,
      'wicket-keeper': 0,
    };
    selectedPlayers.forEach((p) => {
      counts[p.role]++;
    });
    return counts;
  }, [selectedPlayers]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = players;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.teamName?.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      result = result.filter((p) => p.role === selectedRole);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'credits-asc':
          return a.credits - b.credits;
        case 'credits-desc':
          return b.credits - a.credits;
        case 'points-desc':
          return (b.points || 0) - (a.points || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [players, searchQuery, selectedRole, sortBy]);

  // Check if player can be selected
  const canSelectPlayer = (player: Player): boolean => {
    // Already selected
    if (selectedIds.has(player.id)) return true;
    
    // Team full
    if (selectedPlayers.length >= maxPlayers) return false;
    
    // Budget exceeded
    if (usedCredits + player.credits > maxCredits) return false;
    
    // Max per team exceeded
    if (player.teamId && teamCounts[player.teamId] >= maxPerTeam) return false;
    
    return true;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search & Sort Header */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          <Input
            type="text"
            placeholder="Search players or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <RoleFilter
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          counts={roleCounts}
          selectedCounts={selectedRoleCounts}
        />

        {/* Sort Options */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-foreground-muted whitespace-nowrap">Sort by:</span>
          {[
            { value: 'credits-desc', label: '💰 High→Low' },
            { value: 'credits-asc', label: '💰 Low→High' },
            { value: 'points-desc', label: '⭐ Points' },
            { value: 'name-asc', label: '🔤 Name' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as SortOption)}
              className={cn(
                'px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all',
                sortBy === option.value
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border hover:border-accent/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player Count */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-foreground-muted">
          Showing <span className="font-bold text-foreground">{filteredPlayers.length}</span> players
        </span>
        <span className={cn(
          'font-bold',
          selectedPlayers.length === maxPlayers ? 'text-green-400' : 'text-accent'
        )}>
          {selectedPlayers.length}/{maxPlayers} selected
        </span>
      </div>

      {/* Player Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-foreground-muted">
            <span className="text-5xl mb-4">🔍</span>
            <p>No players found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredPlayers.map((player) => {
              const isSelected = selectedIds.has(player.id);
              const disabled = !canSelectPlayer(player);

              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={isSelected}
                  disabled={disabled && !isSelected}
                  onSelect={onSelectPlayer}
                  onRemove={onRemovePlayer}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact list view for mobile
export function PlayerListCompact({
  players,
  selectedPlayers,
  onSelectPlayer,
  onRemovePlayer,
}: Omit<PlayerListProps, 'maxPlayers' | 'maxCredits' | 'usedCredits' | 'maxPerTeam' | 'teamCounts'>) {
  const selectedIds = new Set(selectedPlayers.map((p) => p.id));

  return (
    <div className="space-y-2">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isSelected={selectedIds.has(player.id)}
          onSelect={onSelectPlayer}
          onRemove={onRemovePlayer}
          compact
        />
      ))}
    </div>
  );
}
