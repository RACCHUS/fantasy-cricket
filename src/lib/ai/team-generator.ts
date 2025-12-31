import type { Player } from '@/types';
import { DEFAULT_TEAM_RULES } from '@/constants/scoring';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface GeneratedTeam {
  players: Player[];
  captainId: string;
  viceCaptainId: string;
  teamName: string;
  totalCredits: number;
}

interface TeamGenerationOptions {
  players: Player[];
  difficulty: AIDifficulty;
  budget?: number;
  existingTeams?: GeneratedTeam[];
}

const AI_NAMES = {
  easy: [
    'Rookie Bot', 'Casual Charlie', 'Sunday Player', 'Lucky Luke', 'Newbie Nick',
  ],
  medium: [
    'Steady Steve', 'Smart Sam', 'Tactical Tom', 'Balanced Ben', 'Clever Chris',
  ],
  hard: [
    'Pro Predictor', 'Expert Eddie', 'Master Mind', 'Champion Carl', 'Elite Eric',
  ],
};

/**
 * Generate an AI opponent team based on difficulty level
 */
export function generateAITeam(options: GeneratedTeam[]): GeneratedTeam;
export function generateAITeam(options: TeamGenerationOptions): GeneratedTeam;
export function generateAITeam(
  optionsOrExisting: TeamGenerationOptions | GeneratedTeam[]
): GeneratedTeam {
  // Handle overloaded call
  if (Array.isArray(optionsOrExisting)) {
    throw new Error('Please provide TeamGenerationOptions');
  }

  const {
    players,
    difficulty,
    budget = DEFAULT_TEAM_RULES.budget,
    existingTeams = [],
  } = optionsOrExisting;

  const rules = DEFAULT_TEAM_RULES;

  // Different strategies based on difficulty
  switch (difficulty) {
    case 'easy':
      return generateRandomTeam(players, budget, rules, existingTeams);
    case 'medium':
      return generateBalancedTeam(players, budget, rules, existingTeams);
    case 'hard':
      return generateOptimizedTeam(players, budget, rules, existingTeams);
  }
}

/**
 * Easy: Random valid team
 */
function generateRandomTeam(
  players: Player[],
  budget: number,
  rules: typeof DEFAULT_TEAM_RULES,
  existingTeams: GeneratedTeam[]
): GeneratedTeam {
  const selected: Player[] = [];
  let remainingBudget = budget;
  const teamCounts = new Map<string, number>();

  // Shuffle players
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  // Select minimum required by role first
  const roleOrder: Player['role'][] = ['wicket-keeper', 'batsman', 'all-rounder', 'bowler'];
  
  for (const role of roleOrder) {
    const minRequired = rules.minPerRole[role] || 1;
    const rolePlayers = shuffled.filter(
      (p) => p.role === role && 
             (p.credits || 0) * 10 <= remainingBudget &&
             !selected.includes(p) &&
             (teamCounts.get(p.teamName || '') || 0) < rules.maxPerTeam
    );

    for (let i = 0; i < minRequired && i < rolePlayers.length; i++) {
      const player = rolePlayers[i];
      selected.push(player);
      remainingBudget -= (player.credits || 0) * 10;
      teamCounts.set(player.teamName || '', (teamCounts.get(player.teamName || '') || 0) + 1);
    }
  }

  // Fill remaining slots
  while (selected.length < rules.totalPlayers) {
    const affordable = shuffled.filter(
      (p) =>
        !selected.includes(p) &&
        (p.credits || 0) * 10 <= remainingBudget &&
        (teamCounts.get(p.teamName || '') || 0) < rules.maxPerTeam &&
        countByRole(selected, p.role) < (rules.maxPerRole[p.role] || 5)
    );

    if (affordable.length === 0) break;

    const player = affordable[Math.floor(Math.random() * affordable.length)];
    selected.push(player);
    remainingBudget -= (player.credits || 0) * 10;
    teamCounts.set(player.teamName || '', (teamCounts.get(player.teamName || '') || 0) + 1);
  }

  // Random captain/VC
  const captain = selected[Math.floor(Math.random() * selected.length)];
  let viceCaptain = selected[Math.floor(Math.random() * selected.length)];
  while (viceCaptain.id === captain.id) {
    viceCaptain = selected[Math.floor(Math.random() * selected.length)];
  }

  return {
    players: selected,
    captainId: captain.id,
    viceCaptainId: viceCaptain.id,
    teamName: getAIName('easy', existingTeams),
    totalCredits: budget - remainingBudget,
  };
}

/**
 * Medium: Weighted by recent form and points
 */
function generateBalancedTeam(
  players: Player[],
  budget: number,
  rules: typeof DEFAULT_TEAM_RULES,
  existingTeams: GeneratedTeam[]
): GeneratedTeam {
  const selected: Player[] = [];
  let remainingBudget = budget;
  const teamCounts = new Map<string, number>();

  // Sort by points (form indicator), with some randomness
  const sortedPlayers = [...players].sort((a, b) => {
    const aScore = (a.points || 0) + Math.random() * 20;
    const bScore = (b.points || 0) + Math.random() * 20;
    return bScore - aScore;
  });

  // Select by role, preferring higher-rated players
  const roleOrder: Player['role'][] = ['wicket-keeper', 'batsman', 'all-rounder', 'bowler'];
  
  for (const role of roleOrder) {
    const minRequired = rules.minPerRole[role] || 1;
    const maxAllowed = rules.maxPerRole[role] || 5;
    const targetCount = Math.min(
      maxAllowed,
      Math.max(minRequired, Math.floor(minRequired + Math.random() * 2))
    );

    const rolePlayers = sortedPlayers.filter(
      (p) => p.role === role && 
             (p.credits || 0) * 10 <= remainingBudget &&
             !selected.includes(p) &&
             (teamCounts.get(p.teamName || '') || 0) < rules.maxPerTeam
    );

    for (let i = 0; i < targetCount && i < rolePlayers.length && selected.length < rules.totalPlayers; i++) {
      const player = rolePlayers[i];
      selected.push(player);
      remainingBudget -= (player.credits || 0) * 10;
      teamCounts.set(player.teamName || '', (teamCounts.get(player.teamName || '') || 0) + 1);
    }
  }

  // Fill any remaining slots
  while (selected.length < rules.totalPlayers) {
    const affordable = sortedPlayers.filter(
      (p) =>
        !selected.includes(p) &&
        (p.credits || 0) * 10 <= remainingBudget &&
        (teamCounts.get(p.teamName || '') || 0) < rules.maxPerTeam &&
        countByRole(selected, p.role) < (rules.maxPerRole[p.role] || 5)
    );

    if (affordable.length === 0) break;
    
    const player = affordable[0];
    selected.push(player);
    remainingBudget -= (player.credits || 0) * 10;
    teamCounts.set(player.teamName || '', (teamCounts.get(player.teamName || '') || 0) + 1);
  }

  // Pick captain from top performers
  const sortedSelected = [...selected].sort((a, b) => (b.points || 0) - (a.points || 0));
  const captain = sortedSelected[0];
  const viceCaptain = sortedSelected[1];

  return {
    players: selected,
    captainId: captain.id,
    viceCaptainId: viceCaptain.id,
    teamName: getAIName('medium', existingTeams),
    totalCredits: budget - remainingBudget,
  };
}

/**
 * Hard: Optimized picks with smart captain selection
 */
function generateOptimizedTeam(
  players: Player[],
  budget: number,
  rules: typeof DEFAULT_TEAM_RULES,
  existingTeams: GeneratedTeam[]
): GeneratedTeam {
  const selected: Player[] = [];
  let remainingBudget = budget;
  const teamCounts = new Map<string, number>();

  // Calculate value score (points per credit)
  const withValue = players.map((p) => ({
    ...p,
    valueScore: (p.points || 0) / Math.max(p.credits || 1, 1),
  }));

  // Sort by value, then by points
  const sortedPlayers = [...withValue].sort((a, b) => {
    const valueDiff = b.valueScore - a.valueScore;
    if (Math.abs(valueDiff) < 0.1) {
      return (b.points || 0) - (a.points || 0);
    }
    return valueDiff;
  });

  // Optimal role distribution for T20
  const targetDistribution: Record<Player['role'], number> = {
    'wicket-keeper': 1,
    'batsman': 4,
    'all-rounder': 2,
    'bowler': 4,
  };

  // Select best value players per role
  for (const [role, target] of Object.entries(targetDistribution)) {
    const rolePlayers = sortedPlayers.filter(
      (p) => p.role === role && 
             (p.credits || 0) * 10 <= remainingBudget &&
             !selected.includes(p) &&
             (teamCounts.get(p.teamName || '') || 0) < rules.maxPerTeam
    );

    for (let i = 0; i < target && i < rolePlayers.length && selected.length < rules.totalPlayers; i++) {
      const player = rolePlayers[i];
      selected.push(player);
      remainingBudget -= (player.credits || 0) * 10;
      teamCounts.set(player.teamName || '', (teamCounts.get(player.teamName || '') || 0) + 1);
    }
  }

  // Fill remaining with best value
  while (selected.length < rules.totalPlayers) {
    const affordable = sortedPlayers.filter(
      (p) =>
        !selected.includes(p) &&
        (p.credits || 0) * 10 <= remainingBudget &&
        (teamCounts.get(p.teamName || '') || 0) < rules.maxPerTeam &&
        countByRole(selected, p.role) < (rules.maxPerRole[p.role] || 5)
    );

    if (affordable.length === 0) break;
    
    const player = affordable[0];
    selected.push(player);
    remainingBudget -= (player.credits || 0) * 10;
    teamCounts.set(player.teamName || '', (teamCounts.get(player.teamName || '') || 0) + 1);
  }

  // Smart captain: highest points player
  const sortedSelected = [...selected].sort((a, b) => (b.points || 0) - (a.points || 0));
  
  // Captain: best performer
  // VC: best value who's different role (for variety)
  const captain = sortedSelected[0];
  let viceCaptain = sortedSelected.find(
    (p) => p.id !== captain.id && p.role !== captain.role
  ) || sortedSelected[1];

  return {
    players: selected,
    captainId: captain.id,
    viceCaptainId: viceCaptain.id,
    teamName: getAIName('hard', existingTeams),
    totalCredits: budget - remainingBudget,
  };
}

function countByRole(players: Player[], role: Player['role']): number {
  return players.filter((p) => p.role === role).length;
}

function getAIName(difficulty: AIDifficulty, existingTeams: GeneratedTeam[]): string {
  const names = AI_NAMES[difficulty];
  const usedNames = new Set(existingTeams.map((t) => t.teamName));
  
  const available = names.filter((n) => !usedNames.has(n));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  
  // All names used, add a number
  return `${names[0]} ${existingTeams.length + 1}`;
}

/**
 * Generate multiple AI teams for a contest
 */
export function generateAITeams(
  players: Player[],
  count: number,
  difficulty: AIDifficulty | 'mixed' = 'mixed'
): GeneratedTeam[] {
  const teams: GeneratedTeam[] = [];
  
  for (let i = 0; i < count; i++) {
    let diff: AIDifficulty;
    if (difficulty === 'mixed') {
      const diffOptions: AIDifficulty[] = ['easy', 'medium', 'hard'];
      diff = diffOptions[i % 3];
    } else {
      diff = difficulty;
    }

    const team = generateAITeam({
      players,
      difficulty: diff,
      existingTeams: teams,
    });
    teams.push(team);
  }

  return teams;
}
