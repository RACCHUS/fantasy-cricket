'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/layout/AppHeader';

interface Match {
  id: string;
  name: string;
  status: string;
  startTime: string;
  venue: string;
  format: string;
  teamA: { id: string; name: string; shortName: string; logoUrl?: string };
  teamB: { id: string; name: string; shortName: string; logoUrl?: string };
}

export default function CreateTeamPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await fetch(`/api/cricket/matches/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data.data || data);
        }
      } catch (error) {
        console.error('Failed to fetch match:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();
  }, [matchId]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    
    setCreating(true);
    try {
      // TODO: Implement team creation with Supabase
      // For now, just redirect to team building page
      router.push(`/matches/${matchId}/build-team?name=${encodeURIComponent(teamName)}`);
    } catch (error) {
      console.error('Failed to create team:', error);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏏</div>
          <p className="text-foreground-muted">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold mb-2">Match Not Found</h1>
            <p className="text-foreground-muted mb-4">This match doesn&apos;t exist or has been removed.</p>
            <Link href="/tournaments">
              <Button>Browse Tournaments</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  const matchDate = new Date(match.startTime);
  const isMatchStarted = matchDate <= new Date();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="text-accent hover:underline"
          >
            ← Back to Matches
          </button>
        </div>

        {/* Match Info Card */}
        <Card className="p-6 mb-6">
          <div className="text-center mb-6">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              match.status === 'live'
                ? 'bg-red-500/20 text-red-400' 
                : match.status === 'upcoming'
                ? 'bg-accent/20 text-accent'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {match.status === 'live' ? '🔴 LIVE' : match.format?.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-2 mx-auto">
                {match.teamA.logoUrl ? (
                  <img src={match.teamA.logoUrl} alt={match.teamA.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-2xl font-bold">{match.teamA.shortName}</span>
                )}
              </div>
              <p className="font-semibold">{match.teamA.name}</p>
            </div>
            
            <div className="text-2xl font-bold text-foreground-muted">VS</div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-2 mx-auto">
                {match.teamB.logoUrl ? (
                  <img src={match.teamB.logoUrl} alt={match.teamB.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-2xl font-bold">{match.teamB.shortName}</span>
                )}
              </div>
              <p className="font-semibold">{match.teamB.name}</p>
            </div>
          </div>

          <div className="text-center text-foreground-muted text-sm space-y-1">
            <p>📅 {matchDate.toLocaleDateString()} at {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p>📍 {match.venue}</p>
          </div>
        </Card>

        {/* Create Team Form */}
        {isMatchStarted && match.status !== 'live' ? (
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-xl font-bold mb-2">Match Already Started</h2>
            <p className="text-foreground-muted mb-4">
              Team creation is closed for this match. You can view live scores instead.
            </p>
            <Link href={`/matches/${matchId}/live`}>
              <Button>View Live Score</Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Create Your Fantasy Team</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name..."
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  maxLength={30}
                />
                <p className="text-xs text-foreground-muted mt-1">
                  {teamName.length}/30 characters
                </p>
              </div>

              <div className="bg-surface-elevated rounded-lg p-4">
                <h3 className="font-medium mb-2">Team Rules</h3>
                <ul className="text-sm text-foreground-muted space-y-1">
                  <li>• Select 11 players from both teams</li>
                  <li>• Maximum 7 players from one team</li>
                  <li>• Must include: 1-4 WK, 3-6 BAT, 1-4 AR, 3-6 BOWL</li>
                  <li>• Budget: 100 credits</li>
                  <li>• Choose 1 Captain (2x) and 1 Vice Captain (1.5x)</li>
                </ul>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateTeam}
                disabled={!teamName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Continue to Pick Players →'}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
