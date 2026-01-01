'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Users, Star, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

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

interface FeaturedData {
  featured: {
    ipl: { upcoming: Tournament | null; completed: Tournament | null };
    t20WorldCup: { upcoming: Tournament | null; completed: Tournament | null };
    odiWorldCup: { upcoming: Tournament | null; completed: Tournament | null };
    wtcFinal: { upcoming: Tournament | null; completed: Tournament | null };
    championsTrophy: { upcoming: Tournament | null; completed: Tournament | null };
    cpl: { upcoming: Tournament | null; completed: Tournament | null };
    bbl: { upcoming: Tournament | null; completed: Tournament | null };
    psl: { upcoming: Tournament | null; completed: Tournament | null };
  };
}

const TOURNAMENT_CONFIG: Record<string, { name: string; emoji: string; color: string; format: string }> = {
  ipl: { name: 'Indian Premier League', emoji: '🇮🇳', color: 'from-blue-600 to-orange-500', format: 'T20' },
  t20WorldCup: { name: 'T20 World Cup', emoji: '🏆', color: 'from-purple-600 to-pink-500', format: 'T20' },
  odiWorldCup: { name: 'ODI World Cup', emoji: '🌍', color: 'from-green-600 to-teal-500', format: 'ODI' },
  wtcFinal: { name: 'Test Championship', emoji: '🏏', color: 'from-red-600 to-orange-500', format: 'TEST' },
  championsTrophy: { name: 'Champions Trophy', emoji: '🏅', color: 'from-amber-500 to-yellow-400', format: 'ODI' },
  cpl: { name: 'Caribbean Premier League', emoji: '🌴', color: 'from-yellow-500 to-red-500', format: 'T20' },
  bbl: { name: 'Big Bash League', emoji: '🇦🇺', color: 'from-green-500 to-yellow-500', format: 'T20' },
  psl: { name: 'Pakistan Super League', emoji: '🇵🇰', color: 'from-green-600 to-emerald-400', format: 'T20' },
};

export function FeaturedTournaments() {
  const [data, setData] = useState<FeaturedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/cricket/tournaments/featured');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Star className="h-6 w-6 text-warning" />
          <h2 className="text-2xl md:text-3xl font-bold">Featured Tournaments</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-6 bg-background-secondary rounded mb-3 w-3/4" />
              <div className="h-4 bg-background-secondary rounded mb-2 w-1/2" />
              <div className="h-4 bg-background-secondary rounded w-1/3" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!data?.featured) return null;

  const { featured } = data;
  const tournamentKeys = Object.keys(featured) as (keyof typeof featured)[];

  return (
    <section className="container mx-auto px-4 py-12 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <Star className="h-6 w-6 text-warning fill-warning" />
        <h2 className="text-2xl md:text-3xl font-bold">Major Tournaments</h2>
      </div>

      {/* Upcoming Major Tournaments */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-foreground-muted mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming & Active
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tournamentKeys.map((key) => {
            const tournament = featured[key].upcoming;
            if (!tournament) return null;
            return (
              <FeaturedCard
                key={key}
                tournament={tournament}
                config={TOURNAMENT_CONFIG[key]}
                isCompleted={false}
              />
            );
          })}
          {tournamentKeys.every((key) => !featured[key].upcoming) && (
            <p className="text-foreground-muted col-span-full text-center py-4">
              No upcoming major tournaments at this time
            </p>
          )}
        </div>
      </div>

      {/* Completed Major Tournaments */}
      <div>
        <h3 className="text-lg font-semibold text-foreground-muted mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Recently Completed
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tournamentKeys.map((key) => {
            const tournament = featured[key].completed;
            if (!tournament) return null;
            return (
              <FeaturedCard
                key={key}
                tournament={tournament}
                config={TOURNAMENT_CONFIG[key]}
                isCompleted={true}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({
  tournament,
  config,
  isCompleted,
}: {
  tournament: Tournament;
  config: { name: string; emoji: string; color: string; format: string };
  isCompleted: boolean;
}) {
  const hasSquads = tournament.squads > 0;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Use config format or infer from tournament data
  const format = config.format || (tournament.t20 > 0 ? 'T20' : tournament.odi > 0 ? 'ODI' : 'TEST');

  // Extract year from tournament name or date
  const year = tournament.name.match(/20\d{2}/)?.[0] || formatDate(tournament.startDate);

  const isClickable = hasSquads && !isCompleted;

  const cardContent = (
    <Card className={`overflow-hidden transition-all ${
      isClickable ? 'hover:border-primary cursor-pointer hover:shadow-lg group' : ''
    } ${isCompleted ? 'opacity-75' : ''}`}>
      {/* Gradient header */}
      <div className={`h-2 bg-gradient-to-r ${config.color}`} />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-2xl">{config.emoji}</span>
          <div className="flex items-center gap-2">
            {format && (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-background-secondary">
                {format}
              </span>
            )}
            {isCompleted && (
              <span className="text-xs font-medium text-foreground-muted">
                Completed
              </span>
            )}
          </div>
        </div>

        <h4 className={`font-bold text-sm mb-1 ${
          isClickable ? 'group-hover:text-primary transition-colors' : ''
        }`}>
          {config.name}
        </h4>
        
        <p className="text-xs text-foreground-muted mb-3">{year}</p>

        <div className="flex items-center justify-between text-xs">
          {hasSquads ? (
            <span className="flex items-center gap-1 text-success">
              <Users className="h-3 w-3" />
              {tournament.squads} teams
            </span>
          ) : (
            <span className="text-foreground-muted">
              No squads yet
            </span>
          )}
          <span className="flex items-center gap-1 text-foreground-muted">
            <Trophy className="h-3 w-3" />
            {tournament.matches} matches
          </span>
        </div>

        {!isCompleted && !hasSquads && (
          <div className="mt-3 text-xs text-center py-1.5 rounded bg-warning/10 text-warning font-medium">
            Coming Soon
          </div>
        )}
        
        {!isCompleted && hasSquads && (
          <div className="mt-3 text-xs text-center py-1.5 rounded bg-primary/10 text-primary font-medium group-hover:bg-primary group-hover:text-white transition-colors">
            Play Now →
          </div>
        )}
      </div>
    </Card>
  );

  if (isClickable) {
    return (
      <Link href={`/contests?tournament=${tournament.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
