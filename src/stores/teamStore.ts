import { create } from 'zustand';
import type { TournamentPlayer, PlayerRole } from '@/types';
import { DEFAULT_TEAM_RULES } from '@/constants/scoring';

interface TeamBuilderState {
  // Selected players
  players: TournamentPlayer[];
  captain: TournamentPlayer | null;
  viceCaptain: TournamentPlayer | null;

  // Budget
  budget: number;
  budgetUsed: number;

  // Validation
  errors: string[];
  isValid: boolean;

  // Actions
  addPlayer: (player: TournamentPlayer) => boolean;
  removePlayer: (playerId: string) => void;
  setCaptain: (player: TournamentPlayer) => void;
  setViceCaptain: (player: TournamentPlayer) => void;
  reset: () => void;
  validate: () => boolean;
}

const initialState = {
  players: [],
  captain: null,
  viceCaptain: null,
  budget: DEFAULT_TEAM_RULES.budget,
  budgetUsed: 0,
  errors: [],
  isValid: false,
};

export const useTeamStore = create<TeamBuilderState>((set, get) => ({
  ...initialState,

  addPlayer: (player: TournamentPlayer) => {
    const state = get();

    // Check if already selected
    if (state.players.some(p => p.id === player.id)) {
      return false;
    }

    // Check team limit
    if (state.players.length >= DEFAULT_TEAM_RULES.totalPlayers) {
      return false;
    }

    // Check budget
    if (state.budgetUsed + player.price > state.budget) {
      return false;
    }

    // Check max per cricket team
    const sameTeamCount = state.players.filter(p => p.teamId === player.teamId).length;
    if (sameTeamCount >= DEFAULT_TEAM_RULES.maxPerTeam) {
      return false;
    }

    // Check max per role
    const sameRoleCount = state.players.filter(p => p.role === player.role).length;
    if (sameRoleCount >= DEFAULT_TEAM_RULES.maxPerRole[player.role]) {
      return false;
    }

    set(s => ({
      players: [...s.players, player],
      budgetUsed: s.budgetUsed + player.price,
    }));

    get().validate();
    return true;
  },

  removePlayer: (playerId: string) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);

    if (!player) return;

    set(s => ({
      players: s.players.filter(p => p.id !== playerId),
      budgetUsed: s.budgetUsed - player.price,
      captain: s.captain?.id === playerId ? null : s.captain,
      viceCaptain: s.viceCaptain?.id === playerId ? null : s.viceCaptain,
    }));

    get().validate();
  },

  setCaptain: (player: TournamentPlayer) => {
    const state = get();

    // Must be in selected players
    if (!state.players.some(p => p.id === player.id)) {
      return;
    }

    // Can't be same as vice-captain
    if (state.viceCaptain?.id === player.id) {
      set({ viceCaptain: null });
    }

    set({ captain: player });
    get().validate();
  },

  setViceCaptain: (player: TournamentPlayer) => {
    const state = get();

    // Must be in selected players
    if (!state.players.some(p => p.id === player.id)) {
      return;
    }

    // Can't be same as captain
    if (state.captain?.id === player.id) {
      set({ captain: null });
    }

    set({ viceCaptain: player });
    get().validate();
  },

  reset: () => {
    set(initialState);
  },

  validate: () => {
    const state = get();
    const errors: string[] = [];

    // Check player count
    if (state.players.length !== DEFAULT_TEAM_RULES.totalPlayers) {
      errors.push(`Select ${DEFAULT_TEAM_RULES.totalPlayers} players (${state.players.length}/${DEFAULT_TEAM_RULES.totalPlayers})`);
    }

    // Check minimum per role
    const roleCounts: Record<PlayerRole, number> = {
      'batsman': 0,
      'bowler': 0,
      'all-rounder': 0,
      'wicket-keeper': 0,
    };

    state.players.forEach(p => {
      roleCounts[p.role]++;
    });

    for (const [role, min] of Object.entries(DEFAULT_TEAM_RULES.minPerRole)) {
      if (roleCounts[role as PlayerRole] < min) {
        errors.push(`Need at least ${min} ${role}`);
      }
    }

    // Check captain/vice-captain
    if (!state.captain) {
      errors.push('Select a captain');
    }
    if (!state.viceCaptain) {
      errors.push('Select a vice-captain');
    }

    const isValid = errors.length === 0;

    set({ errors, isValid });
    return isValid;
  },
}));

// Selectors
export const selectRoleCounts = (state: TeamBuilderState) => {
  const counts: Record<PlayerRole, number> = {
    'batsman': 0,
    'bowler': 0,
    'all-rounder': 0,
    'wicket-keeper': 0,
  };

  state.players.forEach(p => {
    counts[p.role]++;
  });

  return counts;
};

export const selectBudgetRemaining = (state: TeamBuilderState) => {
  return state.budget - state.budgetUsed;
};

export const selectCanAddPlayer = (state: TeamBuilderState, player: TournamentPlayer) => {
  if (state.players.some(p => p.id === player.id)) return false;
  if (state.players.length >= DEFAULT_TEAM_RULES.totalPlayers) return false;
  if (state.budgetUsed + player.price > state.budget) return false;

  const sameTeamCount = state.players.filter(p => p.teamId === player.teamId).length;
  if (sameTeamCount >= DEFAULT_TEAM_RULES.maxPerTeam) return false;

  const sameRoleCount = state.players.filter(p => p.role === player.role).length;
  if (sameRoleCount >= DEFAULT_TEAM_RULES.maxPerRole[player.role]) return false;

  return true;
};
