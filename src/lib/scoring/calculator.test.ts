import { describe, it, expect } from 'vitest';
import { calculatePlayerPoints, calculateTeamPoints } from './calculator';
import { DEFAULT_SCORING } from '@/constants/scoring';

describe('calculatePlayerPoints', () => {
  it('calculates basic run scoring', () => {
    const stats = { runsScored: 30, ballsFaced: 25 }; // SR 120 (no bonus)
    const points = calculatePlayerPoints(stats);
    expect(points).toBe(30); // 30 runs = 30 points
  });

  it('adds boundary bonuses', () => {
    const stats = { runsScored: 20, ballsFaced: 15, fours: 3, sixes: 1 };
    const points = calculatePlayerPoints(stats);
    // 20 runs + 3 fours (3 bonus) + 1 six (2 bonus) = 25
    expect(points).toBe(25);
  });

  it('awards half-century bonus', () => {
    const stats = { runsScored: 50, ballsFaced: 40 }; // SR 125 (no bonus)
    const points = calculatePlayerPoints(stats);
    // 50 runs + 10 half-century bonus = 60
    expect(points).toBe(60);
  });

  it('awards century bonus instead of half-century', () => {
    const stats = { runsScored: 100, ballsFaced: 70 }; // SR 143 (no bonus)
    const points = calculatePlayerPoints(stats);
    // 100 runs + 25 century bonus = 125
    expect(points).toBe(125);
  });

  it('applies duck penalty', () => {
    const stats = { runsScored: 0, ballsFaced: 5 };
    const points = calculatePlayerPoints(stats);
    expect(points).toBe(-5); // Duck penalty
  });

  it('does not apply duck if no balls faced', () => {
    const stats = { runsScored: 0, ballsFaced: 0 };
    const points = calculatePlayerPoints(stats);
    expect(points).toBe(0); // No penalty for DNB
  });

  it('calculates wicket points', () => {
    const stats = { wickets: 3, oversBowled: 4, runsConceded: 25 };
    const points = calculatePlayerPoints(stats);
    // 3 wickets (75) + 3-wicket bonus (10) = 85
    expect(points).toBe(85);
  });

  it('awards 5-wicket haul bonus', () => {
    const stats = { wickets: 5, oversBowled: 4, runsConceded: 30 };
    const points = calculatePlayerPoints(stats);
    // 5 wickets (125) + 5-wicket bonus (25) = 150
    expect(points).toBe(150);
  });

  it('calculates fielding points', () => {
    const stats = { catches: 2, stumpings: 1 };
    const points = calculatePlayerPoints(stats);
    // 2 catches (20) + 1 stumping (15) = 35
    expect(points).toBe(35);
  });

  it('calculates combined all-rounder stats', () => {
    const stats = {
      runsScored: 50,
      ballsFaced: 40,  // SR 125 (no bonus)
      fours: 4,
      sixes: 2,
      wickets: 2,
      oversBowled: 4,
      runsConceded: 28,
      catches: 1,
    };
    const points = calculatePlayerPoints(stats);
    // Batting: 50 + 4 + 4 + 10 (half-century) = 68
    // Bowling: 50 = 50
    // Fielding: 10 = 10
    // Total: 128
    expect(points).toBe(128);
  });

  it('applies strike rate bonus', () => {
    const stats = { runsScored: 40, ballsFaced: 20 }; // SR 200
    const points = calculatePlayerPoints(stats);
    // 40 runs + 5 SR bonus = 45
    expect(points).toBe(45);
  });

  it('applies economy bonus', () => {
    const stats = { wickets: 1, oversBowled: 4, runsConceded: 15 }; // Economy 3.75
    const points = calculatePlayerPoints(stats);
    // 1 wicket (25) + economy bonus (10) = 35
    expect(points).toBe(35);
  });
});

describe('calculateTeamPoints', () => {
  it('sums all player points', () => {
    const playerIds = ['p1', 'p2'];
    const matchStats = new Map([
      ['p1', { runsScored: 50, ballsFaced: 40 } as any], // SR 125 (no bonus)
      ['p2', { wickets: 2, oversBowled: 4, runsConceded: 25 } as any],
    ]);

    const { total, breakdown } = calculateTeamPoints(
      playerIds,
      'p1',
      'p2',
      matchStats
    );

    // p1: (50 + 10 half-century) * 2 captain = 120
    // p2: 50 * 1.5 vice-captain = 75
    expect(breakdown.get('p1')).toBe(120);
    expect(breakdown.get('p2')).toBe(75);
    expect(total).toBe(195);
  });

  it('applies captain 2x multiplier', () => {
    const matchStats = new Map([
      ['p1', { runsScored: 30, ballsFaced: 25 } as any], // SR 120 (no bonus)
    ]);

    const { total } = calculateTeamPoints(['p1'], 'p1', 'p2', matchStats);
    expect(total).toBe(60); // 30 * 2 = 60
  });

  it('applies vice-captain 1.5x multiplier', () => {
    const matchStats = new Map([
      ['p1', { runsScored: 30, ballsFaced: 25 } as any], // SR 120 (no bonus)
    ]);

    const { total } = calculateTeamPoints(['p1'], 'p2', 'p1', matchStats);
    expect(total).toBe(45); // 30 * 1.5 = 45
  });

  it('handles missing player stats gracefully', () => {
    const matchStats = new Map([
      ['p1', { runsScored: 30, ballsFaced: 25 } as any], // SR 120 (no bonus)
    ]);

    const { total } = calculateTeamPoints(['p1', 'p2', 'p3'], 'p1', 'p2', matchStats);
    expect(total).toBe(60); // Only p1 has stats, captain 2x
  });
});
