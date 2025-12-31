import { create } from 'zustand';
import type { Contest, ContestEntry, LeaderboardEntry } from '@/types';

interface ContestState {
  // Current contest being viewed
  currentContest: Contest | null;
  
  // List of contests
  contests: Contest[];
  isLoadingContests: boolean;
  
  // Leaderboard data
  leaderboard: LeaderboardEntry[];
  isLoadingLeaderboard: boolean;
  
  // User's entries
  userEntries: ContestEntry[];
  
  // Actions
  setCurrentContest: (contest: Contest | null) => void;
  setContests: (contests: Contest[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setUserEntries: (entries: ContestEntry[]) => void;
  setLoadingContests: (loading: boolean) => void;
  setLoadingLeaderboard: (loading: boolean) => void;
  
  // Utility
  getContestById: (id: string) => Contest | undefined;
  getUserEntryForContest: (contestId: string) => ContestEntry | undefined;
  isUserInContest: (contestId: string) => boolean;
  reset: () => void;
}

const initialState = {
  currentContest: null,
  contests: [],
  isLoadingContests: false,
  leaderboard: [],
  isLoadingLeaderboard: false,
  userEntries: [],
};

export const useContestStore = create<ContestState>((set, get) => ({
  ...initialState,

  setCurrentContest: (contest) => set({ currentContest: contest }),
  
  setContests: (contests) => set({ contests }),
  
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  
  setUserEntries: (entries) => set({ userEntries: entries }),
  
  setLoadingContests: (loading) => set({ isLoadingContests: loading }),
  
  setLoadingLeaderboard: (loading) => set({ isLoadingLeaderboard: loading }),
  
  getContestById: (id) => {
    return get().contests.find((c) => c.id === id);
  },
  
  getUserEntryForContest: (contestId) => {
    return get().userEntries.find((e) => e.contestId === contestId);
  },
  
  isUserInContest: (contestId) => {
    return get().userEntries.some((e) => e.contestId === contestId);
  },
  
  reset: () => set(initialState),
}));

/**
 * Hook to get filtered contests
 */
export function useFilteredContests(filters: {
  type?: Contest['type'];
  status?: Contest['status'];
  matchId?: string;
}) {
  const contests = useContestStore((state) => state.contests);
  
  return contests.filter((contest) => {
    if (filters.type && contest.type !== filters.type) return false;
    if (filters.status && contest.status !== filters.status) return false;
    if (filters.matchId && contest.matchId !== filters.matchId) return false;
    return true;
  });
}
