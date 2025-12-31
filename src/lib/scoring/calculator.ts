import type { ScoringRules, PlayerMatchStats } from '@/types';
import { DEFAULT_SCORING } from '@/constants/scoring';

/**
 * Calculate fantasy points for a player based on match stats
 */
export function calculatePlayerPoints(
  stats: Partial<PlayerMatchStats>,
  rules: ScoringRules = DEFAULT_SCORING
): number {
  let points = 0;

  // Batting points
  const runs = stats.runsScored ?? 0;
  const ballsFaced = stats.ballsFaced ?? 0;
  const fours = stats.fours ?? 0;
  const sixes = stats.sixes ?? 0;

  points += runs * rules.batting.run;
  points += fours * rules.batting.four;
  points += sixes * rules.batting.six;

  // Milestone bonuses
  if (runs >= 100) {
    points += rules.batting.century;
  } else if (runs >= 50) {
    points += rules.batting.halfCentury;
  }

  // Duck penalty (out for 0, having faced at least 1 ball)
  if (runs === 0 && ballsFaced > 0) {
    points += rules.batting.duck;
  }

  // Strike rate bonus/penalty (min 10 balls faced)
  if (ballsFaced >= 10) {
    const strikeRate = (runs / ballsFaced) * 100;
    if (strikeRate >= rules.batting.strikeRateBonus.threshold) {
      points += rules.batting.strikeRateBonus.points;
    } else if (strikeRate <= rules.batting.strikeRatePenalty.threshold) {
      points += rules.batting.strikeRatePenalty.points;
    }
  }

  // Bowling points
  const wickets = stats.wickets ?? 0;
  const maidens = stats.maidens ?? 0;
  const oversBowled = stats.oversBowled ?? 0;
  const runsConceded = stats.runsConceded ?? 0;

  points += wickets * rules.bowling.wicket;
  points += maidens * rules.bowling.maiden;

  // Wicket haul bonuses
  if (wickets >= 5) {
    points += rules.bowling.fiveWickets;
  } else if (wickets >= 3) {
    points += rules.bowling.threeWickets;
  }

  // Economy rate bonus/penalty (min 2 overs bowled)
  if (oversBowled >= 2) {
    const economy = runsConceded / oversBowled;
    if (economy <= rules.bowling.economyBonus.threshold) {
      points += rules.bowling.economyBonus.points;
    } else if (economy >= rules.bowling.economyPenalty.threshold) {
      points += rules.bowling.economyPenalty.points;
    }
  }

  // Fielding points
  points += (stats.catches ?? 0) * rules.fielding.catch;
  points += (stats.stumpings ?? 0) * rules.fielding.stumping;
  points += (stats.runOuts ?? 0) * rules.fielding.runOutDirect;

  return Math.round(points);
}

/**
 * Calculate total fantasy team points for a match
 */
export function calculateTeamPoints(
  playerIds: string[],
  captainId: string,
  viceCaptainId: string,
  matchStats: Map<string, PlayerMatchStats>,
  rules: ScoringRules = DEFAULT_SCORING
): { total: number; breakdown: Map<string, number> } {
  const breakdown = new Map<string, number>();
  let total = 0;

  for (const playerId of playerIds) {
    const stats = matchStats.get(playerId);
    if (!stats) continue;

    let points = calculatePlayerPoints(stats, rules);

    // Apply multipliers
    if (playerId === captainId) {
      points = Math.round(points * rules.multipliers.captain);
    } else if (playerId === viceCaptainId) {
      points = Math.round(points * rules.multipliers.viceCaptain);
    }

    breakdown.set(playerId, points);
    total += points;
  }

  return { total, breakdown };
}

/**
 * Get points breakdown description for display
 */
export function getPointsDescription(
  stats: Partial<PlayerMatchStats>,
  rules: ScoringRules = DEFAULT_SCORING
): string[] {
  const descriptions: string[] = [];
  const runs = stats.runsScored ?? 0;
  const wickets = stats.wickets ?? 0;
  const catches = stats.catches ?? 0;

  if (runs > 0) {
    descriptions.push(`${runs} runs (+${runs * rules.batting.run})`);
  }
  if (wickets > 0) {
    descriptions.push(`${wickets} wickets (+${wickets * rules.bowling.wicket})`);
  }
  if (catches > 0) {
    descriptions.push(`${catches} catches (+${catches * rules.fielding.catch})`);
  }

  return descriptions;
}
