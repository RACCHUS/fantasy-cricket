import { describe, it, expect, beforeEach } from 'vitest';
import { useTeamStore } from './teamStore';
import type { TournamentPlayer } from '@/types';

// Helper to create a player
function createPlayer(overrides: Partial<TournamentPlayer> = {}): TournamentPlayer {
  return {
    id: '1',
    name: 'Virat Kohli',
    role: 'batsman',
    teamId: 'team-rcb',
    teamName: 'RCB',
    teamShortName: 'RCB',
    price: 10.5,
    credits: 10.5,
    formRating: 8.5,
    ...overrides,
  };
}

describe('teamStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTeamStore.getState().reset();
  });

  describe('addPlayer', () => {
    it('adds a player to the team', () => {
      const player = createPlayer();

      const result = useTeamStore.getState().addPlayer(player);
      
      expect(result).toBe(true);
      const state = useTeamStore.getState();
      expect(state.players).toHaveLength(1);
      expect(state.players[0].id).toBe('1');
    });

    it('does not add duplicate players', () => {
      const player = createPlayer();

      useTeamStore.getState().addPlayer(player);
      const result = useTeamStore.getState().addPlayer(player);
      
      expect(result).toBe(false);
      expect(useTeamStore.getState().players).toHaveLength(1);
    });

    it('tracks budget used correctly', () => {
      const player = createPlayer({ price: 10 });

      useTeamStore.getState().addPlayer(player);
      
      expect(useTeamStore.getState().budgetUsed).toBe(10);
    });
  });

  describe('removePlayer', () => {
    it('removes a player from the team', () => {
      const player = createPlayer();

      useTeamStore.getState().addPlayer(player);
      expect(useTeamStore.getState().players).toHaveLength(1);

      useTeamStore.getState().removePlayer('1');
      
      expect(useTeamStore.getState().players).toHaveLength(0);
    });

    it('refunds budget when removing player', () => {
      const player = createPlayer({ price: 10 });

      useTeamStore.getState().addPlayer(player);
      expect(useTeamStore.getState().budgetUsed).toBe(10);

      useTeamStore.getState().removePlayer('1');
      expect(useTeamStore.getState().budgetUsed).toBe(0);
    });

    it('clears captain if removed player was captain', () => {
      const player = createPlayer();

      useTeamStore.getState().addPlayer(player);
      useTeamStore.getState().setCaptain(player);
      expect(useTeamStore.getState().captain?.id).toBe('1');

      useTeamStore.getState().removePlayer('1');
      
      expect(useTeamStore.getState().captain).toBeNull();
    });

    it('clears vice captain if removed player was vice captain', () => {
      const player = createPlayer();

      useTeamStore.getState().addPlayer(player);
      useTeamStore.getState().setViceCaptain(player);
      expect(useTeamStore.getState().viceCaptain?.id).toBe('1');

      useTeamStore.getState().removePlayer('1');
      
      expect(useTeamStore.getState().viceCaptain).toBeNull();
    });
  });

  describe('setCaptain/setViceCaptain', () => {
    const player1 = createPlayer({ id: '1', name: 'Player 1' });
    const player2 = createPlayer({ id: '2', name: 'Player 2', teamId: 'team-other' });

    beforeEach(() => {
      useTeamStore.getState().addPlayer(player1);
      useTeamStore.getState().addPlayer(player2);
    });

    it('sets captain correctly', () => {
      useTeamStore.getState().setCaptain(player1);
      expect(useTeamStore.getState().captain?.id).toBe('1');
    });

    it('sets vice captain correctly', () => {
      useTeamStore.getState().setViceCaptain(player2);
      expect(useTeamStore.getState().viceCaptain?.id).toBe('2');
    });

    it('can have different captain and vice captain', () => {
      useTeamStore.getState().setCaptain(player1);
      useTeamStore.getState().setViceCaptain(player2);
      
      expect(useTeamStore.getState().captain?.id).toBe('1');
      expect(useTeamStore.getState().viceCaptain?.id).toBe('2');
    });
  });

  describe('reset', () => {
    it('resets all team state', () => {
      const player = createPlayer();

      useTeamStore.getState().addPlayer(player);
      useTeamStore.getState().setCaptain(player);

      useTeamStore.getState().reset();
      
      const state = useTeamStore.getState();
      expect(state.players).toHaveLength(0);
      expect(state.captain).toBeNull();
      expect(state.viceCaptain).toBeNull();
      expect(state.budgetUsed).toBe(0);
    });
  });
});
