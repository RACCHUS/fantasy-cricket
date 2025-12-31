'use client';

import { TeamBuilder } from '@/components/team';
import type { Player } from '@/types';

// Mock data for development
const MOCK_PLAYERS: Player[] = [
  // Mumbai Indians
  { id: 'rohit', name: 'Rohit Sharma', teamId: 'mi', teamName: 'Mumbai Indians', role: 'batsman', credits: 10.5, points: 156 },
  { id: 'bumrah', name: 'Jasprit Bumrah', teamId: 'mi', teamName: 'Mumbai Indians', role: 'bowler', credits: 9.5, points: 142 },
  { id: 'hardik', name: 'Hardik Pandya', teamId: 'mi', teamName: 'Mumbai Indians', role: 'all-rounder', credits: 9.0, points: 134 },
  { id: 'kishan', name: 'Ishan Kishan', teamId: 'mi', teamName: 'Mumbai Indians', role: 'wicket-keeper', credits: 8.5, points: 98 },
  { id: 'surya', name: 'Suryakumar Yadav', teamId: 'mi', teamName: 'Mumbai Indians', role: 'batsman', credits: 10.0, points: 167 },
  { id: 'pollard', name: 'Kieron Pollard', teamId: 'mi', teamName: 'Mumbai Indians', role: 'all-rounder', credits: 8.0, points: 89 },
  { id: 'archer', name: 'Jofra Archer', teamId: 'mi', teamName: 'Mumbai Indians', role: 'bowler', credits: 8.5, points: 76 },
  { id: 'brevis', name: 'Dewald Brevis', teamId: 'mi', teamName: 'Mumbai Indians', role: 'batsman', credits: 7.0, points: 54 },
  
  // Chennai Super Kings
  { id: 'dhoni', name: 'MS Dhoni', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'wicket-keeper', credits: 9.0, points: 112 },
  { id: 'jadeja', name: 'Ravindra Jadeja', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'all-rounder', credits: 9.5, points: 145 },
  { id: 'gaikwad', name: 'Ruturaj Gaikwad', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'batsman', credits: 9.0, points: 134 },
  { id: 'chahar', name: 'Deepak Chahar', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'bowler', credits: 8.0, points: 98 },
  { id: 'conway', name: 'Devon Conway', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'batsman', credits: 8.5, points: 112 },
  { id: 'dube', name: 'Shivam Dube', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'all-rounder', credits: 7.5, points: 87 },
  { id: 'pathirana', name: 'Matheesha Pathirana', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'bowler', credits: 7.0, points: 76 },
  { id: 'theekshana', name: 'Maheesh Theekshana', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'bowler', credits: 7.5, points: 65 },
  { id: 'rahane', name: 'Ajinkya Rahane', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'batsman', credits: 6.5, points: 45 },
  { id: 'santner', name: 'Mitchell Santner', teamId: 'csk', teamName: 'Chennai Super Kings', role: 'all-rounder', credits: 6.0, points: 34 },
];

interface TeamBuilderContentProps {
  matchId: string;
}

export function TeamBuilderContent({ matchId }: TeamBuilderContentProps) {
  // Mock match info
  const matchInfo = {
    teamA: { id: 'mi', name: 'Mumbai Indians', shortName: 'MI' },
    teamB: { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK' },
    venue: 'Wankhede Stadium, Mumbai',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    deadline: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
  };

  return (
    <TeamBuilder
      matchId={matchId}
      matchInfo={matchInfo}
      availablePlayers={MOCK_PLAYERS}
    />
  );
}
