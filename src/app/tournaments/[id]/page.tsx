'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/layout/AppHeader';

interface Match {
  id: string;
  name: string;
  status: string;
  startTime: string;
  venue?: string;
  format?: string;
  teamA: { name: string; shortName: string; logoUrl?: string };
  teamB: { name: string; shortName: string; logoUrl?: string };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch tournament details from the combined list
        const tourRes = await fetch('/api/cricket/tournaments');
        if (tourRes.ok) {
          const tourData = await tourRes.json();
          // Search in both live and upcoming
          const allTournaments = [
            ...(tourData.live || []),
            ...(tourData.upcoming || []),
          ];
          const found = allTournaments.find((t: Tournament) => t.id === tournamentId);
          setTournament(found || null);
        }

        // Fetch matches for this tournament (use tournamentId param)
        const matchRes = await fetch(`/api/cricket/matches?tournamentId=${tournamentId}`);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          const matchList = matchData.data || matchData.matches || [];
          
          // Sort matches: live first, then upcoming (soonest first), then completed (most recent first)
          matchList.sort((a: Match, b: Match) => {
            const statusOrder = (status: string) => {
              if (status === 'live') return 0;
              if (status === 'upcoming') return 1;
              return 2; // completed
            };
            
            const orderA = statusOrder(a.status);
            const orderB = statusOrder(b.status);
            
            if (orderA !== orderB) return orderA - orderB;
            
            const timeA = new Date(a.startTime).getTime();
            const timeB = new Date(b.startTime).getTime();
            
            // For upcoming: earliest first. For completed: most recent first
            if (a.status === 'completed') return timeB - timeA;
            return timeA - timeB;
          });
          
          setMatches(matchList);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏏</div>
          <p className="text-foreground-muted">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Tournament Not Found</h1>
          <p className="text-foreground-muted mb-4">This tournament doesn&apos;t exist or has been removed.</p>
          <Link href="/tournaments">
            <Button>Browse Tournaments</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Auth-Aware Header */}
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/tournaments" className="text-accent hover:underline">
            ← Back to Tournaments
          </Link>
        </div>

        {/* Tournament Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
              <p className="text-foreground-muted">
                📅 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              tournament.status === 'live' 
                ? 'bg-red-500/20 text-red-400' 
                : tournament.status === 'upcoming'
                ? 'bg-accent/20 text-accent'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {tournament.status === 'live' ? '🔴 LIVE' : tournament.status}
            </span>
          </div>
        </div>

        {/* Matches */}
        <h2 className="text-2xl font-bold mb-4">Matches</h2>
        
        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{match.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        match.status === 'live'
                          ? 'bg-red-500/20 text-red-400' 
                          : match.status === 'upcoming'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {match.status === 'live' ? '🔴 LIVE' : match.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-foreground-muted">
                      <span>📅 {new Date(match.startTime).toLocaleDateString()}</span>
                      <span>🕐 {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {match.venue && <span>📍 {match.venue}</span>}
                      {match.format && <span>🏏 {match.format.toUpperCase()}</span>}
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <span className="font-medium">{match.teamA.name} vs {match.teamB.name}</span>
                    </div>
                  </div>
                  
                  {match.status !== 'completed' && (
                    <Link href={`/matches/${match.id}/create-team`}>
                      <Button>
                        {match.status === 'live' 
                          ? 'Join Now 🔥' 
                          : 'Create Team'}
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-foreground-muted">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl mb-2">No matches available yet</p>
            <p className="text-sm">Match schedule will be updated soon.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
