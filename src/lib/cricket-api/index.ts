/**
 * Cricket API - Main Export
 * 
 * Exports the configured cricket API provider
 * Switch between providers by changing the export
 */

import type { CricketAPIProvider } from './provider';
import { CricketDataProvider } from './cricketdata';
import { MockCricketProvider } from './mock';

// Export types
export * from './types';
export * from './provider';
export { CACHE_TTL, apiCache, cacheKey, withCache } from './cache';

// Export DB-backed cache functions (recommended for production)
export {
  getTournamentsCached,
  getMatchesCached,
  getPlayersCached,
  getLiveScoreCached,
  forceRefreshTournaments,
  forceRefreshMatches,
  forceRefreshPlayers,
} from './db-cache';

// Export providers
export { CricketDataProvider } from './cricketdata';
export { MockCricketProvider } from './mock';

/**
 * Get the configured cricket API provider
 * Uses mock provider in development if no API key is set
 */
export function getCricketAPI(): CricketAPIProvider {
  const apiKey = process.env.CRICKET_API_KEY;
  
  // Use mock provider if:
  // 1. No API key is configured
  // 2. Explicitly set to use mock
  // 3. In test environment
  const useMock =
    !apiKey ||
    process.env.USE_MOCK_CRICKET_API === 'true' ||
    process.env.NODE_ENV === 'test';
  
  if (useMock) {
    return new MockCricketProvider();
  }
  
  return new CricketDataProvider(apiKey);
}

// Default export - singleton instance
let cricketAPIInstance: CricketAPIProvider | null = null;

export function getCricketAPIInstance(): CricketAPIProvider {
  if (!cricketAPIInstance) {
    cricketAPIInstance = getCricketAPI();
  }
  return cricketAPIInstance;
}

// For convenience, export a default instance
// Note: This uses lazy initialization
export const cricketAPI = {
  get instance(): CricketAPIProvider {
    return getCricketAPIInstance();
  },
  
  // Delegate common methods
  async getMatches(...args: Parameters<CricketAPIProvider['getMatches']>) {
    return getCricketAPIInstance().getMatches(...args);
  },
  
  async getMatch(...args: Parameters<CricketAPIProvider['getMatch']>) {
    return getCricketAPIInstance().getMatch(...args);
  },
  
  async getLiveMatches() {
    return getCricketAPIInstance().getLiveMatches();
  },
  
  async getLiveScore(...args: Parameters<CricketAPIProvider['getLiveScore']>) {
    return getCricketAPIInstance().getLiveScore(...args);
  },
  
  async getPlayers(...args: Parameters<CricketAPIProvider['getPlayers']>) {
    return getCricketAPIInstance().getPlayers(...args);
  },
  
  async getPlayer(...args: Parameters<CricketAPIProvider['getPlayer']>) {
    return getCricketAPIInstance().getPlayer(...args);
  },
  
  async getTournaments(...args: Parameters<CricketAPIProvider['getTournaments']>) {
    return getCricketAPIInstance().getTournaments(...args);
  },
  
  async getTeams(...args: Parameters<CricketAPIProvider['getTeams']>) {
    return getCricketAPIInstance().getTeams(...args);
  },
  
  async getAllPlayerMatchStats(...args: Parameters<CricketAPIProvider['getAllPlayerMatchStats']>) {
    return getCricketAPIInstance().getAllPlayerMatchStats(...args);
  },
};
