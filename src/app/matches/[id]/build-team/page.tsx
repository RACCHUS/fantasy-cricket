'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/layout/AppHeader';

interface Player {
  id: string;
  name: string;
  role: 'wk' | 'bat' | 'all' | 'bowl';
  team: string;
  teamShortName: string;
  credits: number;
  points?: number;
  selected?: boolean;
}

interface Match {
  id: string;
  name: string;
  teamA: { id: string; name: string; shortName: string };
  teamB: { id: string; name: string; shortName: string };
}

// Role constraints
const ROLE_LIMITS = {
  wk: { min: 1, max: 4, label: 'Wicket Keeper' },
  bat: { min: 3, max: 6, label: 'Batsman' },
  all: { min: 1, max: 4, label: 'All-Rounder' },
  bowl: { min: 3, max: 6, label: 'Bowler' },
};

const TOTAL_PLAYERS = 11;
const MAX_PER_TEAM = 7;
const TOTAL_CREDITS = 100;

export default function BuildTeamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchId = params.id as string;
  const teamName = searchParams.get('name') || 'My Team';

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [activeRole, setActiveRole] = useState<'wk' | 'bat' | 'all' | 'bowl'>('wk');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch match details
        const matchRes = await fetch(`/api/cricket/matches/${matchId}`);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatch(matchData.data || matchData);
        }

        // Fetch players for this match
        const playersRes = await fetch(`/api/cricket/matches/${matchId}/players`);
        if (playersRes.ok) {
          const playersData = await playersRes.json();
          setPlayers(playersData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [matchId]);

  // Calculate stats
  const creditsUsed = selectedPlayers.reduce((sum, p) => sum + p.credits, 0);
  const creditsRemaining = TOTAL_CREDITS - creditsUsed;
  
  const teamACounts = selectedPlayers.filter(p => p.team === match?.teamA.id || p.teamShortName === match?.teamA.shortName).length;
  const teamBCounts = selectedPlayers.filter(p => p.team === match?.teamB.id || p.teamShortName === match?.teamB.shortName).length;
  
  const roleCount = (role: string) => selectedPlayers.filter(p => p.role === role).length;

  const canSelectPlayer = (player: Player): boolean => {
    if (selectedPlayers.length >= TOTAL_PLAYERS) return false;
    if (selectedPlayers.find(p => p.id === player.id)) return false;
    if (creditsRemaining < player.credits) return false;
    
    // Check team limit
    const playerTeam = player.team === match?.teamA.id || player.teamShortName === match?.teamA.shortName ? 'A' : 'B';
    if (playerTeam === 'A' && teamACounts >= MAX_PER_TEAM) return false;
    if (playerTeam === 'B' && teamBCounts >= MAX_PER_TEAM) return false;
    
    // Check role limit
    if (roleCount(player.role) >= ROLE_LIMITS[player.role].max) return false;
    
    return true;
  };

  const togglePlayer = (player: Player) => {
    const isSelected = selectedPlayers.find(p => p.id === player.id);
    
    if (isSelected) {
      setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
    } else if (canSelectPlayer(player)) {
      setSelectedPlayers(prev => [...prev, player]);
    }
  };

  const isValidTeam = (): boolean => {
    if (selectedPlayers.length !== TOTAL_PLAYERS) return false;
    
    for (const [role, limits] of Object.entries(ROLE_LIMITS)) {
      const count = roleCount(role);
      if (count < limits.min || count > limits.max) return false;
    }
    
    return true;
  };

  const handleContinue = () => {
    if (!isValidTeam()) return;
    
    // Store selected players and go to captain selection
    const playerIds = selectedPlayers.map(p => p.id).join(',');
    router.push(`/matches/${matchId}/select-captain?name=${encodeURIComponent(teamName)}&players=${playerIds}`);
  };

  const filteredPlayers = players.filter(p => p.role === activeRole);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏏</div>
          <p className="text-foreground-muted">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Sticky Header with Stats */}
      <div className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-accent hover:underline text-sm">
                ← Back
              </button>
              <h1 className="font-bold text-lg">{teamName}</h1>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{selectedPlayers.length}</span>
              <span className="text-foreground-muted">/{TOTAL_PLAYERS}</span>
            </div>
          </div>
          
          {/* Progress and Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-foreground-muted">Credits:</span>
              <span className={`font-bold ${creditsRemaining < 0 ? 'text-red-400' : ''}`}>
                {creditsRemaining.toFixed(1)}
              </span>
            </div>
            {match && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-foreground-muted">{match.teamA.shortName}:</span>
                  <span className={`font-bold ${teamACounts >= MAX_PER_TEAM ? 'text-red-400' : ''}`}>
                    {teamACounts}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground-muted">{match.teamB.shortName}:</span>
                  <span className={`font-bold ${teamBCounts >= MAX_PER_TEAM ? 'text-red-400' : ''}`}>
                    {teamBCounts}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Role Counts */}
          <div className="flex gap-2 mt-2">
            {Object.entries(ROLE_LIMITS).map(([role, limits]) => {
              const count = roleCount(role);
              const isFull = count >= limits.max;
              const isMinMet = count >= limits.min;
              return (
                <div
                  key={role}
                  className={`px-2 py-1 rounded text-xs ${
                    isFull ? 'bg-green-500/20 text-green-400' :
                    isMinMet ? 'bg-accent/20 text-accent' :
                    'bg-surface-elevated text-foreground-muted'
                  }`}
                >
                  {role.toUpperCase()}: {count}/{limits.min}-{limits.max}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4">
        {/* Role Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {Object.entries(ROLE_LIMITS).map(([role, limits]) => (
            <button
              key={role}
              onClick={() => setActiveRole(role as typeof activeRole)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeRole === role
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-foreground-muted hover:text-foreground'
              }`}
            >
              {limits.label} ({roleCount(role)})
            </button>
          ))}
        </div>

        {/* Players List */}
        {filteredPlayers.length > 0 ? (
          <div className="space-y-2">
            {filteredPlayers.map((player) => {
              const isSelected = selectedPlayers.find(p => p.id === player.id);
              const canSelect = canSelectPlayer(player);
              
              return (
                <Card
                  key={player.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-accent bg-accent/10'
                      : canSelect
                      ? 'hover:bg-surface-elevated'
                      : 'opacity-50'
                  }`}
                  onClick={() => togglePlayer(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isSelected ? 'bg-accent text-white' : 'bg-surface-elevated'
                      }`}>
                        {player.teamShortName}
                      </div>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-foreground-muted">
                          {player.points ? `${player.points} pts` : 'No recent stats'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{player.credits}</p>
                      <p className="text-xs text-foreground-muted">credits</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center text-foreground-muted">
            <p>No {ROLE_LIMITS[activeRole].label}s available</p>
          </Card>
        )}

        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4">
          <div className="container mx-auto max-w-2xl">
            <Button
              className="w-full"
              onClick={handleContinue}
              disabled={!isValidTeam()}
            >
              {isValidTeam()
                ? 'Continue to Select Captain →'
                : `Select ${TOTAL_PLAYERS - selectedPlayers.length} more player${TOTAL_PLAYERS - selectedPlayers.length !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
