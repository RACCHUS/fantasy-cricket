import type { ScoringRules } from '@/types';

/**
 * Default scoring rules (can be overridden per league)
 */
export const DEFAULT_SCORING: ScoringRules = {
  batting: {
    run: 1,
    four: 1,           // Bonus per boundary
    six: 2,            // Bonus per six
    halfCentury: 10,
    century: 25,
    duck: -5,          // Out for 0 (batsman faced at least 1 ball)
    strikeRateBonus: { threshold: 150, points: 5 },
    strikeRatePenalty: { threshold: 70, points: -5 },
  },
  bowling: {
    wicket: 25,
    maiden: 10,
    threeWickets: 10,  // Bonus for 3+ wickets
    fiveWickets: 25,   // Bonus for 5+ wickets
    economyBonus: { threshold: 5, points: 10 },
    economyPenalty: { threshold: 10, points: -5 },
  },
  fielding: {
    catch: 10,
    stumping: 15,
    runOutDirect: 15,
    runOutAssist: 10,
  },
  multipliers: {
    captain: 2,
    viceCaptain: 1.5,
  },
};

/**
 * Team building constraints (can be overridden per tournament)
 */
export const DEFAULT_TEAM_RULES = {
  totalPlayers: 11,
  maxPerTeam: 7,        // Max players from one cricket team
  budget: 1000,         // 100.0 credits (stored as integer * 10)
  minPerRole: {
    'batsman': 1,
    'bowler': 1,
    'all-rounder': 1,
    'wicket-keeper': 1,
  },
  maxPerRole: {
    'batsman': 5,
    'bowler': 5,
    'all-rounder': 4,
    'wicket-keeper': 2,
  },
} as const;

/**
 * Role display configuration
 */
export const ROLE_CONFIG = {
  'batsman': {
    label: 'Batsman',
    shortLabel: 'BAT',
    icon: '🏏',
    color: 'primary',
  },
  'bowler': {
    label: 'Bowler',
    shortLabel: 'BOWL',
    icon: '🎯',
    color: 'success',
  },
  'all-rounder': {
    label: 'All-Rounder',
    shortLabel: 'AR',
    icon: '⚡',
    color: 'warning',
  },
  'wicket-keeper': {
    label: 'Wicket Keeper',
    shortLabel: 'WK',
    icon: '🧤',
    color: 'accent',
  },
} as const;
