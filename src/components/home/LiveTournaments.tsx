'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Trophy, Flame, ChevronRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  odi: number;
  t20: number;
  test: number;
  matches: number;
  squads: number;
}

interface TournamentsData {
  live: Tournament[];
  upcoming: Tournament[];
}

export function LiveTournaments() {
  const [data, setData] = useState<TournamentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const res = await fetch('/api/cricket/tournaments');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Unable to load tournaments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Flame className="h-6 w-6 text-error animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-bold">Loading Tournaments...</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-background-secondary rounded mb-4 w-3/4" />
              <div className="h-4 bg-background-secondary rounded mb-2 w-1/2" />
              <div className="h-4 bg-background-secondary rounded w-1/3" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return null; // Silently fail on homepage
  }

  const { live, upcoming } = data;

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Live Tournaments */}
      {live.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Flame className="h-6 w-6 text-error" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-error rounded-full animate-ping" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Live Tournaments</h2>
            </div>
            <Link href="/contests" className="text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {live.slice(0, 6).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} isLive />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Tournaments */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">Upcoming Tournaments</h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcoming.slice(0, 4).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TournamentCard({ tournament, isLive }: { tournament: Tournament; isLive?: boolean }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFormat = () => {
    if (tournament.t20 > 0) return { label: 'T20', color: 'text-primary' };
    if (tournament.odi > 0) return { label: 'ODI', color: 'text-warning' };
    if (tournament.test > 0) return { label: 'TEST', color: 'text-error' };
    return { label: 'CRICKET', color: 'text-foreground-muted' };
  };

  const format = getFormat();
  const hasSquads = tournament.squads > 0;
  
  // Get a shorter name for display
  const displayName = tournament.name
    .replace(/, 2025-26$/, '')
    .replace(/, 2026$/, '')
    .replace(' 2025-26', '')
    .replace(' 2026', '')
    .replace(' 2025', '');

  const cardContent = (
    <Card className={`p-4 transition-colors ${
      hasSquads ? 'hover:border-primary cursor-pointer group' : 'opacity-75'
    } ${isLive ? 'border-error/50 bg-error/5' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${format.color} bg-current/10`}>
          {format.label}
        </span>
        <div className="flex items-center gap-2">
          {!hasSquads && (
            <span className="text-xs font-medium text-foreground-muted bg-background-secondary px-2 py-0.5 rounded">
              Coming Soon
            </span>
          )}
          {isLive && hasSquads && (
            <span className="flex items-center gap-1 text-xs font-medium text-error">
              <span className="h-2 w-2 bg-error rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>
      
      <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${
        hasSquads ? 'group-hover:text-primary transition-colors' : ''
      }`}>
        {displayName}
      </h3>
      
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>{formatDate(tournament.startDate)}</span>
        <span className="flex items-center gap-1">
          {hasSquads ? (
            <>
              <Users className="h-3 w-3" />
              {tournament.squads} teams
            </>
          ) : (
            <>
              <Trophy className="h-3 w-3" />
              {tournament.matches} matches
            </>
          )}
        </span>
      </div>
    </Card>
  );

  if (hasSquads) {
    return (
      <Link href={`/contests?tournament=${tournament.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
