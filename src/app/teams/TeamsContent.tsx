'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/layout/AppHeader';

interface Team {
  id: string;
  name: string;
  total_points: number;
  matches?: {
    id: string;
    team1_name: string;
    team2_name: string;
    match_date: string;
    status: string;
  };
}

interface TeamsContentProps {
  teams: Team[] | null;
}

export function TeamsContent({ teams }: TeamsContentProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Shared Auth-Aware Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Teams 👥</h1>
          <Link href="/tournaments">
            <Button>Create New Team</Button>
          </Link>
        </div>

        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <Card key={team.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    team.matches?.status === 'live' 
                      ? 'bg-red-500/20 text-red-400' 
                      : team.matches?.status === 'upcoming'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {team.matches?.status || 'Unknown'}
                  </span>
                </div>
                
                {team.matches && (
                  <p className="text-foreground-muted text-sm mb-2">
                    {team.matches.team1_name} vs {team.matches.team2_name}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-foreground-muted">
                    Points: <span className="font-bold text-accent">{team.total_points || 0}</span>
                  </span>
                  <Link href={`/teams/${team.id}`}>
                    <Button variant="secondary" size="sm">View Team</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-foreground-muted">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-xl mb-2">No teams created yet</p>
            <p className="text-sm mb-4">Create your first fantasy team by joining a match!</p>
            <Link href="/tournaments">
              <Button>Browse Tournaments</Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
