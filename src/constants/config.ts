/**
 * Application configuration
 */
export const APP_CONFIG = {
  name: 'Fantasy Cricket',
  shortName: 'FantasyCric',
  description: 'Live fantasy cricket app',
  domain: 'fantasycricket.app',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

/**
 * API caching durations (in seconds)
 */
export const CACHE_TTL = {
  PLAYER_LIST: 24 * 60 * 60,    // 24 hours
  TEAM_LIST: 24 * 60 * 60,      // 24 hours
  MATCH_LIST: 60 * 60,          // 1 hour
  LIVE_SCORE: 60,               // 1 minute
  PLAYER_STATS: 5 * 60,         // 5 minutes during match
} as const;

/**
 * Polling intervals (in milliseconds)
 * IMPORTANT: CricketData.org API has 100 requests/day limit!
 * For a 3-hour match with 1-hour polling = 3 requests
 * This leaves room for ~95+ other requests per day
 */
export const POLLING_INTERVALS = {
  LIVE_MATCH: 60 * 60 * 1000,   // 1 hour (API limit!)
  LEADERBOARD: 15 * 60 * 1000,  // 15 minutes
  MATCH_STATUS: 60 * 60 * 1000, // 1 hour for checking if match started
} as const;

/**
 * UI constants
 */
export const UI = {
  TOAST_DURATION: 4000,         // 4 seconds
  DEBOUNCE_MS: 300,             // 300ms for search
  PAGE_SIZE: 20,                // Items per page
  MAX_TEAM_NAME_LENGTH: 30,
} as const;

/**
 * Match status display
 */
export const MATCH_STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    color: 'foreground-muted',
    icon: '📅',
  },
  live: {
    label: 'LIVE',
    color: 'accent',
    icon: '🔴',
    pulse: true,
  },
  completed: {
    label: 'Completed',
    color: 'success',
    icon: '✅',
  },
} as const;
