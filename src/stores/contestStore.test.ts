import { describe, it, expect, beforeEach } from 'vitest';
import { useContestStore } from './contestStore';
import type { Contest } from '@/types';

// Helper to create a contest
function createContest(overrides: Partial<Contest> = {}): Contest {
  return {
    id: '1',
    name: 'Mega Contest',
    matchId: 'match-1',
    tournamentId: 'tournament-1',
    type: 'match',
    status: 'upcoming',
    entryFee: 0,
    maxEntries: 100,
    currentEntries: 50,
    isSystemContest: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('contestStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useContestStore.getState().reset();
  });

  describe('setContests', () => {
    it('sets contests array', () => {
      const contests = [createContest()];

      useContestStore.getState().setContests(contests);
      
      expect(useContestStore.getState().contests).toHaveLength(1);
      expect(useContestStore.getState().contests[0].name).toBe('Mega Contest');
    });

    it('replaces existing contests', () => {
      useContestStore.getState().setContests([createContest({ id: '1' })]);
      useContestStore.getState().setContests([createContest({ id: '2', name: 'New Contest' })]);
      
      expect(useContestStore.getState().contests).toHaveLength(1);
      expect(useContestStore.getState().contests[0].id).toBe('2');
    });
  });

  describe('setCurrentContest', () => {
    it('sets current contest', () => {
      const contest = createContest();
      
      useContestStore.getState().setCurrentContest(contest);
      
      expect(useContestStore.getState().currentContest?.id).toBe('1');
    });

    it('clears current contest when null', () => {
      useContestStore.getState().setCurrentContest(createContest());
      useContestStore.getState().setCurrentContest(null);
      
      expect(useContestStore.getState().currentContest).toBeNull();
    });
  });

  describe('getContestById', () => {
    beforeEach(() => {
      useContestStore.getState().setContests([
        createContest({ id: '1', name: 'Contest 1' }),
        createContest({ id: '2', name: 'Contest 2' }),
      ]);
    });

    it('finds contest by id', () => {
      const contest = useContestStore.getState().getContestById('2');
      expect(contest?.name).toBe('Contest 2');
    });

    it('returns undefined for unknown id', () => {
      const contest = useContestStore.getState().getContestById('unknown');
      expect(contest).toBeUndefined();
    });
  });

  describe('loading states', () => {
    it('sets loading contests state', () => {
      useContestStore.getState().setLoadingContests(true);
      expect(useContestStore.getState().isLoadingContests).toBe(true);

      useContestStore.getState().setLoadingContests(false);
      expect(useContestStore.getState().isLoadingContests).toBe(false);
    });

    it('sets loading leaderboard state', () => {
      useContestStore.getState().setLoadingLeaderboard(true);
      expect(useContestStore.getState().isLoadingLeaderboard).toBe(true);

      useContestStore.getState().setLoadingLeaderboard(false);
      expect(useContestStore.getState().isLoadingLeaderboard).toBe(false);
    });
  });

  describe('user entries', () => {
    it('tracks user entries', () => {
      useContestStore.getState().setUserEntries([
        { 
          id: 'entry-1', 
          contestId: 'contest-1', 
          fantasyTeamId: 'team-1',
          userId: 'user-1',
          rank: null,
          points: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      
      expect(useContestStore.getState().userEntries).toHaveLength(1);
    });

    it('checks if user is in contest', () => {
      useContestStore.getState().setUserEntries([
        { 
          id: 'entry-1', 
          contestId: 'contest-1', 
          fantasyTeamId: 'team-1',
          userId: 'user-1',
          rank: null,
          points: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      
      expect(useContestStore.getState().isUserInContest('contest-1')).toBe(true);
      expect(useContestStore.getState().isUserInContest('contest-2')).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state', () => {
      useContestStore.getState().setContests([createContest()]);
      useContestStore.getState().setCurrentContest(createContest());
      useContestStore.getState().setLoadingContests(true);
      
      useContestStore.getState().reset();
      
      const state = useContestStore.getState();
      expect(state.contests).toHaveLength(0);
      expect(state.currentContest).toBeNull();
      expect(state.isLoadingContests).toBe(false);
    });
  });
});
