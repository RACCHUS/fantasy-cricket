'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/layout/AppHeader';

interface Tournament {
  id: string;
  name: string;
  status: 'live' | 'upcoming' | 'completed';
  startDate: string;
  endDate: string;
  matches: number;
  squads: number;
  odi: number;
  t20: number;
  test: number;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const res = await fetch('/api/cricket/tournaments');
        if (res.ok) {
          const data = await res.json();
          // Combine live and upcoming with status
          const allTournaments: Tournament[] = [
            ...(data.live || []).map((t: Omit<Tournament, 'status'>) => ({ ...t, status: 'live' as const })),
            ...(data.upcoming || []).map((t: Omit<Tournament, 'status'>) => ({ ...t, status: 'upcoming' as const })),
          ];
          setTournaments(allTournaments);
        }
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return false; // No completed from API yet
    return t.status === filter;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Auth-Aware Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <Link href="/dashboard">
            <Button variant="secondary">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'live', 'upcoming', 'completed'] as const).map((tab) => (
            <Button
              key={tab}
              variant={filter === tab ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(tab)}
            >
              {tab === 'live' && '🔴 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-5 bg-surface-alt rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-surface-alt rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-surface-alt rounded w-1/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTournaments.map((tournament) => (
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                <Card className="p-6 hover:border-accent transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">
                      {tournament.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      tournament.status === 'live' 
                        ? 'bg-red-500/20 text-red-400' 
                        : tournament.status === 'upcoming'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {tournament.status === 'live' ? '🔴 LIVE' : tournament.status}
                    </span>
                  </div>
                  
                  {/* Format badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tournament.t20 > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        T20
                      </span>
                    )}
                    {tournament.odi > 0 && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                        ODI
                      </span>
                    )}
                    {tournament.test > 0 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                        Test
                      </span>
                    )}
                  </div>
                  
                  <p className="text-foreground-muted text-sm mb-1">
                    🏏 {tournament.matches} matches
                    {tournament.squads > 0 && ` • 👥 ${tournament.squads} squads`}
                  </p>
                  
                  <p className="text-foreground-muted text-sm">
                    📅 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-accent text-sm font-medium">
                      {tournament.squads > 0 ? 'View Matches →' : 'Coming Soon'}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-foreground-muted">
            <div className="text-6xl mb-4">🏏</div>
            <p className="text-xl mb-2">No {filter !== 'all' ? filter : ''} tournaments found</p>
            <p className="text-sm">Check back soon for exciting cricket action!</p>
          </Card>
        )}
      </main>
    </div>
  );
}
