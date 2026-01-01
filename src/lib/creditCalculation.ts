/**
 * Player Credit Calculation Utility
 * 
 * Calculates player credits based on career stats across all formats,
 * weighted appropriately for the target tournament format (T20/ODI/Test).
 */

interface CareerStats {
  batting: {
    [format: string]: {
      matches?: number;
      innings?: number;
      runs?: number;
      average?: number;
      strikeRate?: number;
      highScore?: number;
      fifties?: number;
      hundreds?: number;
      fours?: number;
      sixes?: number;
      notOuts?: number;
    };
  };
  bowling: {
    [format: string]: {
      matches?: number;
      innings?: number;
      balls?: number;
      runs?: number;
      wickets?: number;
      average?: number;
      economy?: number;
      strikeRate?: number;
      fiveWickets?: number;
      bestInnings?: string;
    };
  };
}

// Format weights for T20 tournaments (like SA20, IPL)
const T20_FORMAT_WEIGHTS: Record<string, number> = {
  t20: 1.0,      // T20 domestic/franchise - most relevant
  t20i: 0.9,     // T20 International - very relevant
  listA: 0.4,    // List A - somewhat relevant
  odi: 0.35,     // ODI - less relevant
  fc: 0.15,      // First Class - limited relevance
  test: 0.1,     // Test - minimal relevance
};

// Format weights for ODI tournaments
const ODI_FORMAT_WEIGHTS: Record<string, number> = {
  odi: 1.0,
  listA: 0.9,
  t20i: 0.3,
  t20: 0.25,
  test: 0.4,
  fc: 0.35,
};

// Format weights for Test matches
const TEST_FORMAT_WEIGHTS: Record<string, number> = {
  test: 1.0,
  fc: 0.9,
  odi: 0.3,
  listA: 0.25,
  t20i: 0.1,
  t20: 0.1,
};

type TournamentFormat = 't20' | 'odi' | 'test';

function getFormatWeights(tournamentFormat: TournamentFormat): Record<string, number> {
  switch (tournamentFormat) {
    case 't20': return T20_FORMAT_WEIGHTS;
    case 'odi': return ODI_FORMAT_WEIGHTS;
    case 'test': return TEST_FORMAT_WEIGHTS;
    default: return T20_FORMAT_WEIGHTS;
  }
}

/**
 * Calculate batting score (0-100 scale)
 */
function calculateBattingScore(
  stats: CareerStats['batting'],
  weights: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [format, formatStats] of Object.entries(stats)) {
    const weight = weights[format] || 0.1;
    if (!formatStats.matches || formatStats.matches < 3) continue; // Need minimum matches

    // Calculate format-specific batting score
    let formatScore = 0;
    let factors = 0;

    // Average (weight: 30%) - normalized to 0-100
    // T20 avg of 30+ is excellent, 20 is good, 15 is average
    if (formatStats.average && formatStats.average > 0) {
      const avgScore = Math.min(100, (formatStats.average / 35) * 100);
      formatScore += avgScore * 0.3;
      factors += 0.3;
    }

    // Strike Rate (weight: 30%) - more important in T20
    // T20 SR of 150+ is excellent, 130 is good, 110 is average
    if (formatStats.strikeRate && formatStats.strikeRate > 0) {
      const srScore = Math.min(100, ((formatStats.strikeRate - 80) / 80) * 100);
      formatScore += Math.max(0, srScore) * 0.3;
      factors += 0.3;
    }

    // Runs (weight: 20%) - consistency indicator
    // 2000+ runs is excellent
    if (formatStats.runs && formatStats.runs > 0) {
      const runsScore = Math.min(100, (formatStats.runs / 2000) * 100);
      formatScore += runsScore * 0.2;
      factors += 0.2;
    }

    // Boundary hitting (weight: 20%) - 6s especially valuable in T20
    if (formatStats.innings && formatStats.innings > 0) {
      const sixesPerInning = (formatStats.sixes || 0) / formatStats.innings;
      const foursPerInning = (formatStats.fours || 0) / formatStats.innings;
      // 2+ sixes per innings is excellent for T20
      const boundaryScore = Math.min(100, (sixesPerInning * 40) + (foursPerInning * 10));
      formatScore += boundaryScore * 0.2;
      factors += 0.2;
    }

    // Normalize and apply weight
    if (factors > 0) {
      const normalizedScore = formatScore / factors;
      totalScore += normalizedScore * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 50;
}

/**
 * Calculate bowling score (0-100 scale)
 */
function calculateBowlingScore(
  stats: CareerStats['bowling'],
  weights: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [format, formatStats] of Object.entries(stats)) {
    const weight = weights[format] || 0.1;
    if (!formatStats.matches || formatStats.matches < 3) continue;
    if (!formatStats.wickets || formatStats.wickets < 5) continue; // Need some wickets

    let formatScore = 0;
    let factors = 0;

    // Wickets per match (weight: 30%)
    // 1.5+ wickets per match is excellent in T20
    const wicketsPerMatch = formatStats.wickets / formatStats.matches;
    const wpScore = Math.min(100, (wicketsPerMatch / 2) * 100);
    formatScore += wpScore * 0.3;
    factors += 0.3;

    // Economy (weight: 35%) - lower is better
    // T20: 6-7 is excellent, 8 is average, 9+ is poor
    if (formatStats.economy && formatStats.economy > 0) {
      const ecoScore = Math.max(0, Math.min(100, (12 - formatStats.economy) / 6 * 100));
      formatScore += ecoScore * 0.35;
      factors += 0.35;
    }

    // Bowling average (weight: 20%) - lower is better
    // T20: <20 is excellent, 25 is good, 30+ is average
    if (formatStats.average && formatStats.average > 0) {
      const avgScore = Math.max(0, Math.min(100, (40 - formatStats.average) / 30 * 100));
      formatScore += avgScore * 0.2;
      factors += 0.2;
    }

    // Strike rate (weight: 15%) - lower is better
    // T20: <15 is excellent, 20 is good
    if (formatStats.strikeRate && formatStats.strikeRate > 0) {
      const srScore = Math.max(0, Math.min(100, (30 - formatStats.strikeRate) / 20 * 100));
      formatScore += srScore * 0.15;
      factors += 0.15;
    }

    if (factors > 0) {
      const normalizedScore = formatScore / factors;
      totalScore += normalizedScore * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 30;
}

/**
 * Calculate player credits based on role and stats
 */
export function calculatePlayerCredits(
  role: string,
  careerStats: CareerStats,
  tournamentFormat: TournamentFormat = 't20'
): number {
  const weights = getFormatWeights(tournamentFormat);
  
  const battingScore = calculateBattingScore(careerStats.batting || {}, weights);
  const bowlingScore = calculateBowlingScore(careerStats.bowling || {}, weights);

  let finalScore: number;
  
  // Weight batting vs bowling based on role
  switch (role.toLowerCase()) {
    case 'batsman':
    case 'wk-batsman':
    case 'wicket-keeper':
      // Batsmen: 90% batting, 10% bowling (for rare bowling)
      finalScore = battingScore * 0.9 + bowlingScore * 0.1;
      break;
    
    case 'bowler':
      // Bowlers: 20% batting, 80% bowling
      finalScore = battingScore * 0.2 + bowlingScore * 0.8;
      break;
    
    case 'all-rounder':
    case 'bowling allrounder':
    case 'batting allrounder':
      // All-rounders: 50/50 split
      finalScore = battingScore * 0.5 + bowlingScore * 0.5;
      break;
    
    default:
      // Default to balanced
      finalScore = battingScore * 0.6 + bowlingScore * 0.4;
  }

  // Convert score (0-100) to credits (6.0 - 11.5)
  // Score of 50 = 8.5 credits (average)
  // Score of 80+ = 11.0+ credits (elite)
  // Score of 20 = 6.5 credits (below average)
  const credits = 6.0 + (finalScore / 100) * 5.5;
  
  // Clamp and round to 0.5
  const clampedCredits = Math.max(6.0, Math.min(11.5, credits));
  return Math.round(clampedCredits * 2) / 2; // Round to nearest 0.5
}

/**
 * Parse raw stats array from API into structured CareerStats object
 */
export function parseApiStats(statsArray: Array<{
  fn: string;
  matchtype: string;
  stat: string;
  value: string;
}>): CareerStats {
  const result: CareerStats = {
    batting: {},
    bowling: {},
  };

  for (const stat of statsArray) {
    const fn = stat.fn as 'batting' | 'bowling';
    const format = stat.matchtype.toLowerCase().trim();
    const statName = stat.stat.trim().toLowerCase();
    const value = parseFloat(stat.value.trim()) || 0;

    if (!result[fn]) result[fn] = {};
    if (!result[fn][format]) result[fn][format] = {};

    // Map stat names to our structure
    const statMapping: Record<string, string> = {
      'm': 'matches',
      'mat': 'matches',
      'inn': 'innings',
      'inns': 'innings',
      'runs': 'runs',
      'avg': 'average',
      'sr': 'strikeRate',
      'hs': 'highScore',
      '50s': 'fifties',
      '50': 'fifties',
      '100s': 'hundreds',
      '100': 'hundreds',
      '4s': 'fours',
      '6s': 'sixes',
      'no': 'notOuts',
      'bf': 'ballsFaced',
      'b': 'balls',
      'wkts': 'wickets',
      'w': 'wickets',
      'econ': 'economy',
      'eco': 'economy',
      '5w': 'fiveWickets',
      'bbi': 'bestInnings',
      'bbm': 'bestMatch',
    };

    const mappedName = statMapping[statName] || statName;
    (result[fn][format] as Record<string, number | string>)[mappedName] = value;
  }

  return result;
}

/**
 * Get a summary of player's key stats for display
 */
export function getPlayerStatsSummary(
  careerStats: CareerStats,
  format: string = 't20'
): {
  battingAvg: number;
  strikeRate: number;
  runs: number;
  wickets: number;
  economy: number;
  matches: number;
} {
  const batting = careerStats.batting?.[format] || careerStats.batting?.t20i || {};
  const bowling = careerStats.bowling?.[format] || careerStats.bowling?.t20i || {};

  return {
    battingAvg: batting.average || 0,
    strikeRate: batting.strikeRate || 0,
    runs: batting.runs || 0,
    wickets: bowling.wickets || 0,
    economy: bowling.economy || 0,
    matches: batting.matches || bowling.matches || 0,
  };
}
